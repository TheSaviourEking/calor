import sharp from 'sharp'

const STRIP_FRACTION = 0.03
const WHITE_MIN = 245
const ALPHA_MAX = 16
const WHITE_RATIO = 0.95

/**
 * True when the image border is (near-)white or transparent, i.e. a studio
 * white background that can safely be replaced without touching the product.
 */
export async function detectWhiteBackground(input: Buffer): Promise<boolean> {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const strip = Math.max(1, Math.round(STRIP_FRACTION * Math.min(width, height)))

  let total = 0
  let white = 0
  for (let y = 0; y < height; y++) {
    const inBandY = y < strip || y >= height - strip
    for (let x = 0; x < width; x++) {
      if (!inBandY && x >= strip && x < width - strip) {
        // jump across the interior of the row
        x = width - strip - 1
        continue
      }
      const i = (y * width + x) * 4
      total++
      if (
        data[i + 3] < ALPHA_MAX ||
        (data[i] >= WHITE_MIN && data[i + 1] >= WHITE_MIN && data[i + 2] >= WHITE_MIN)
      ) {
        white++
      }
    }
  }
  return total > 0 && white / total >= WHITE_RATIO
}
