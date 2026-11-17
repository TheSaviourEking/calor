// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import {
  composeOnBackdrop,
  verifyProductUntouched,
  encodeComposite,
} from '@/lib/photos/composite'

const BACKDROP_RGB = [0xea, 0xdf, 0xd2]
const PRODUCT = '#3366aa'

// Transparent canvas with an opaque coloured rectangle somewhere inside it.
async function cutout(w: number, h: number, shape: { w: number; h: number; left: number; top: number }): Promise<Buffer> {
  const block = await sharp({ create: { width: shape.w, height: shape.h, channels: 4, background: PRODUCT } }).png().toBuffer()
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: block, left: shape.left, top: shape.top }])
    .png()
    .toBuffer()
}

async function backdrop(): Promise<Buffer> {
  return sharp({ create: { width: 300, height: 200, channels: 3, background: '#EADFD2' } }).png().toBuffer()
}

function pixel(raw: { data: Buffer; width: number }, x: number, y: number): number[] {
  const i = (y * raw.width + x) * 4
  return [raw.data[i], raw.data[i + 1], raw.data[i + 2], raw.data[i + 3]]
}

describe('composeOnBackdrop', () => {
  it('places the product at 72% of canvas height, centred, bottom at 86%', async () => {
    const input = await cutout(600, 800, { w: 300, h: 500, left: 120, top: 90 })
    const { raw, placement } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop() })
    expect(raw.width).toBe(1600)
    expect(raw.height).toBe(1600)
    expect(Math.abs(placement.height - 1152)).toBeLessThanOrEqual(1)
    expect(Math.abs(placement.top + placement.height - 1376)).toBeLessThanOrEqual(1)
    expect(Math.abs(placement.left - (1600 - placement.width) / 2)).toBeLessThanOrEqual(1)
    // trimmed to the shape: 300x500 aspect ratio preserved
    expect(Math.abs(placement.width - 1152 * (300 / 500))).toBeLessThanOrEqual(1)
  })

  it('fits a very wide product within 88% of the width', async () => {
    const input = await cutout(3000, 200, { w: 3000, h: 200, left: 0, top: 0 })
    const { placement } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop(), canvas: 400 })
    expect(placement.width).toBeLessThanOrEqual(Math.round(0.88 * 400))
    expect(placement.width).toBeGreaterThanOrEqual(Math.round(0.88 * 400) - 1)
    expect(Math.abs(placement.top + placement.height - 0.86 * 400)).toBeLessThanOrEqual(1)
  })

  it('leaves every opaque product pixel unchanged', async () => {
    const input = await cutout(200, 300, { w: 120, h: 200, left: 40, top: 50 })
    const { raw, placement, scaledCutout } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop(), canvas: 400 })
    const result = verifyProductUntouched(raw, scaledCutout, placement)
    expect(result.ok).toBe(true)
    expect(result.maxDiff).toBeLessThanOrEqual(2)
    expect(result.checkedPixels).toBeGreaterThan(0)
  })

  it('casts a shadow below the product, not on it', async () => {
    const input = await cutout(200, 300, { w: 120, h: 200, left: 40, top: 50 })
    const { raw, placement, scaledCutout } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop(), canvas: 400 })
    const x = placement.left + Math.floor(placement.width / 2)
    const below = pixel(raw, x, placement.top + placement.height + 10)
    for (let c = 0; c < 3; c++) expect(below[c]).toBeLessThan(BACKDROP_RGB[c])
    // far corner is untouched backdrop
    const corner = pixel(raw, 2, 2)
    for (let c = 0; c < 3; c++) expect(Math.abs(corner[c] - BACKDROP_RGB[c])).toBeLessThanOrEqual(1)
    expect(verifyProductUntouched(raw, scaledCutout, placement).ok).toBe(true)
  })

  it('fails the check when the product was altered', async () => {
    const input = await cutout(200, 300, { w: 120, h: 200, left: 40, top: 50 })
    const { raw, placement, scaledCutout } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop(), canvas: 400 })
    const tinted = Buffer.from(raw.data)
    for (let y = placement.top; y < placement.top + placement.height; y++) {
      for (let x = placement.left; x < placement.left + placement.width; x++) {
        const i = (y * raw.width + x) * 4
        for (let c = 0; c < 3; c++) tinted[i + c] = Math.min(255, tinted[i + c] + 12)
      }
    }
    const result = verifyProductUntouched({ ...raw, data: tinted }, scaledCutout, placement)
    expect(result.ok).toBe(false)
    expect(result.maxDiff).toBeGreaterThanOrEqual(12)
  })

  it('respects EXIF orientation', async () => {
    // Stored landscape 300x100; orientation 6 means it displays portrait 100x300
    const base = await cutout(300, 100, { w: 300, h: 100, left: 0, top: 0 })
    const oriented = await sharp(base).webp({ lossless: true }).withMetadata({ orientation: 6 }).toBuffer()
    expect((await sharp(oriented).metadata()).orientation).toBe(6)
    const { placement } = await composeOnBackdrop({ cutout: oriented, backdrop: await backdrop(), canvas: 400 })
    expect(placement.height).toBeGreaterThan(placement.width)
    expect(Math.abs(placement.width - placement.height / 3)).toBeLessThanOrEqual(1)
  })
})

describe('encodeComposite', () => {
  it('encodes raw RGBA as WebP', async () => {
    const input = await cutout(100, 100, { w: 50, h: 50, left: 25, top: 25 })
    const { raw } = await composeOnBackdrop({ cutout: input, backdrop: await backdrop(), canvas: 200 })
    const webp = await encodeComposite(raw)
    const meta = await sharp(webp).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(200)
  })
})
