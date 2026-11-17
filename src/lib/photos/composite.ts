import sharp from 'sharp'
import { MAX_INPUT_PIXELS } from './ingest'

/**
 * Places a background-removed product cutout on a calo. backdrop.
 *
 * The rule: only the background changes, never the product. The cutout's
 * pixels go through exactly one uniform resample to fit the frame and are then
 * laid over the backdrop and shadow last, so nothing is ever drawn on top of
 * them. verifyProductUntouched proves this on the raw result before encoding.
 */

export type RawImage = { data: Buffer; width: number; height: number }
export type Placement = { left: number; top: number; width: number; height: number }

export const DEFAULT_CANVAS = 1600
const PRODUCT_HEIGHT = 0.72
const PRODUCT_MAX_WIDTH = 0.88
const PRODUCT_BOTTOM = 0.86
const SHADOW_SQUASH = 0.18
const SHADOW_SIGMA = 18
const SHADOW_OPACITY = 0.22
const HONESTY_TOLERANCE = 2
// Alpha below this is treated as background-removal haze when framing.
const TRIM_ALPHA_THRESHOLD = 16

function load(input: Buffer): sharp.Sharp {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
}

function rawInput(img: RawImage) {
  return { raw: { width: img.width, height: img.height, channels: 4 as const } }
}

/**
 * Upright RGBA cutout cropped to the bounding box of its clearly visible pixels
 * (alpha >= TRIM_ALPHA_THRESHOLD), so faint background-removal haze does not
 * skew the framing. The crop carries every pixel inside the box unchanged.
 */
async function uprightTrimmedCutout(cutout: Buffer): Promise<RawImage> {
  const { data, info } = await load(cutout).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let i = 3, p = 0; i < data.length; i += 4, p++) {
    if (data[i] < TRIM_ALPHA_THRESHOLD) continue
    const x = p % width
    const y = (p - x) / width
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  if (maxX < 0) throw new Error('Cutout has no visible pixels')
  const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
  const trimmed = await sharp(data, { raw: { width, height, channels: 4 } }).extract(box).raw().toBuffer()
  return { data: trimmed, width: box.width, height: box.height }
}

/** One uniform lanczos3 resample of the product; the only transformation it gets. */
async function scaleCutout(cutout: RawImage, canvas: number): Promise<RawImage> {
  const scale = Math.min((PRODUCT_HEIGHT * canvas) / cutout.height, (PRODUCT_MAX_WIDTH * canvas) / cutout.width)
  const width = Math.max(1, Math.round(cutout.width * scale))
  const height = Math.max(1, Math.round(cutout.height * scale))
  const data = await sharp(cutout.data, rawInput(cutout))
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer()
  return { data, width, height }
}

function placeOnCanvas(scaled: RawImage, canvas: number): Placement {
  return {
    left: Math.round((canvas - scaled.width) / 2),
    top: Math.round(PRODUCT_BOTTOM * canvas) - scaled.height,
    width: scaled.width,
    height: scaled.height,
  }
}

async function backdropCanvas(backdrop: Buffer, canvas: number): Promise<RawImage> {
  const data = await load(backdrop)
    .rotate()
    .resize(canvas, canvas, { fit: 'cover' })
    .removeAlpha()
    .ensureAlpha()
    .raw()
    .toBuffer()
  return { data, width: canvas, height: canvas }
}

/**
 * Soft contact shadow: the product's silhouette in black, squashed flat,
 * centred on the product's bottom edge and blurred, as a full-canvas layer.
 */
async function contactShadow(scaled: RawImage, placement: Placement, canvas: number): Promise<RawImage> {
  const squashedHeight = Math.max(1, Math.round(scaled.height * SHADOW_SQUASH))
  const silhouette = await sharp(scaled.data, rawInput(scaled))
    .extractChannel(3)
    .resize(scaled.width, squashedHeight, { fit: 'fill' })
    .raw()
    .toBuffer()

  const layer = Buffer.alloc(canvas * canvas * 4) // transparent black
  const top = placement.top + placement.height - Math.round(squashedHeight / 2)
  for (let y = 0; y < squashedHeight; y++) {
    const cy = top + y
    if (cy < 0 || cy >= canvas) continue
    for (let x = 0; x < scaled.width; x++) {
      const cx = placement.left + x
      if (cx < 0 || cx >= canvas) continue
      layer[(cy * canvas + cx) * 4 + 3] = Math.round(silhouette[y * scaled.width + x] * SHADOW_OPACITY)
    }
  }
  const data = await sharp(layer, { raw: { width: canvas, height: canvas, channels: 4 } })
    .blur(SHADOW_SIGMA)
    .raw()
    .toBuffer()
  return { data, width: canvas, height: canvas }
}

export async function composeOnBackdrop(input: {
  cutout: Buffer
  backdrop: Buffer
  canvas?: number
}): Promise<{ raw: RawImage; placement: Placement; scaledCutout: RawImage }> {
  const canvas = input.canvas ?? DEFAULT_CANVAS
  const scaledCutout = await scaleCutout(await uprightTrimmedCutout(input.cutout), canvas)
  const placement = placeOnCanvas(scaledCutout, canvas)
  const base = await backdropCanvas(input.backdrop, canvas)
  const shadow = await contactShadow(scaledCutout, placement, canvas)

  // Order matters: backdrop -> shadow -> product. The product is drawn last so
  // the shadow can never darken an opaque product pixel.
  const data = await sharp(base.data, rawInput(base))
    .composite([
      { input: shadow.data, ...rawInput(shadow), left: 0, top: 0, blend: 'over' },
      { input: scaledCutout.data, ...rawInput(scaledCutout), left: placement.left, top: placement.top, blend: 'over' },
    ])
    .raw()
    .toBuffer()
  return { raw: { data, width: canvas, height: canvas }, placement, scaledCutout }
}

/**
 * Honesty check: every fully opaque pixel of the scaled cutout must appear in
 * the composite at its placement, within HONESTY_TOLERANCE per channel. Fails
 * when nothing could be checked or the placement does not fit the composite.
 */
export function verifyProductUntouched(
  composite: RawImage,
  scaledCutout: RawImage,
  placement: Placement,
): { ok: boolean; maxDiff: number; checkedPixels: number } {
  const fits =
    placement.width === scaledCutout.width &&
    placement.height === scaledCutout.height &&
    placement.left >= 0 &&
    placement.top >= 0 &&
    placement.left + placement.width <= composite.width &&
    placement.top + placement.height <= composite.height
  if (!fits) return { ok: false, maxDiff: 255, checkedPixels: 0 }

  let maxDiff = 0
  let checkedPixels = 0
  for (let y = 0; y < scaledCutout.height; y++) {
    for (let x = 0; x < scaledCutout.width; x++) {
      const s = (y * scaledCutout.width + x) * 4
      if (scaledCutout.data[s + 3] !== 255) continue
      const c = ((placement.top + y) * composite.width + placement.left + x) * 4
      for (let ch = 0; ch < 3; ch++) {
        const diff = Math.abs(scaledCutout.data[s + ch] - composite.data[c + ch])
        if (diff > maxDiff) maxDiff = diff
      }
      checkedPixels++
    }
  }
  return { ok: checkedPixels > 0 && maxDiff <= HONESTY_TOLERANCE, maxDiff, checkedPixels }
}

export async function encodeComposite(raw: RawImage): Promise<Buffer> {
  return sharp(raw.data, rawInput(raw)).webp({ quality: 90 }).toBuffer()
}
