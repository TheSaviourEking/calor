// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { detectWhiteBackground } from '@/lib/photos/detect'

type Bg = string | { r: number; g: number; b: number; alpha: number }

async function productOn(bg: Bg, w: number, h: number): Promise<Buffer> {
  const sw = Math.max(1, Math.floor(w / 2))
  const sh = Math.max(1, Math.floor(h / 2))
  const square = await sharp({
    create: { width: sw, height: sh, channels: 4, background: '#202020' },
  })
    .png()
    .toBuffer()
  return sharp({ create: { width: w, height: h, channels: 4, background: bg } })
    .composite([{ input: square, left: Math.floor((w - sw) / 2), top: Math.floor((h - sh) / 2) }])
    .png()
    .toBuffer()
}

async function whiteWithBorderNoise(fraction: number): Promise<Buffer> {
  const w = 800
  const h = 800
  const strip = Math.round(0.03 * Math.min(w, h))
  const raw = Buffer.alloc(w * h * 4, 255)
  const border: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y < strip || y >= h - strip || x < strip || x >= w - strip) border.push(y * w + x)
    }
  }
  const noisy = Math.round(border.length * fraction)
  for (let k = 0; k < noisy; k++) {
    // evenly spread so the fraction is exact and deterministic
    const p = border[Math.floor((k * border.length) / noisy)]
    raw[p * 4] = raw[p * 4 + 1] = raw[p * 4 + 2] = 128
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

describe('detectWhiteBackground', () => {
  it('detects a white studio background', async () => {
    expect(await detectWhiteBackground(await productOn('#FFFFFF', 800, 800))).toBe(true)
  })
  it('rejects a satin-coloured background', async () => {
    expect(await detectWhiteBackground(await productOn('#E8DDD0', 800, 800))).toBe(false)
  })
  it('treats a transparent border as white', async () => {
    expect(
      await detectWhiteBackground(await productOn({ r: 0, g: 0, b: 0, alpha: 0 }, 800, 800)),
    ).toBe(true)
  })
  it('tolerates a little noise on the border (95% rule)', async () => {
    expect(await detectWhiteBackground(await whiteWithBorderNoise(0.04))).toBe(true)
    expect(await detectWhiteBackground(await whiteWithBorderNoise(0.08))).toBe(false)
  })
  it('handles a 40x40 image', async () => {
    expect(await detectWhiteBackground(await productOn('#FFFFFF', 40, 40))).toBe(true)
  })
  it('handles a very wide banner', async () => {
    expect(await detectWhiteBackground(await productOn('#FFFFFF', 4000, 300))).toBe(true)
  })
})
