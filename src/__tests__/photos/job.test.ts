// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sharp from 'sharp'

const { db, getObject, putObject } = vi.hoisted(() => ({
  db: { productImage: { findUnique: vi.fn(), update: vi.fn() } },
  getObject: vi.fn(),
  putObject: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/photos/storage', () => ({
  getObject,
  putObject,
  isStorageConfigured: () => true,
  publicUrl: (key: string) => `https://cdn.example.com/${key}`,
}))

import { runCompositeJob } from '@/lib/photos/job'
import type { BackgroundRemover } from '@/lib/photos/background'

const ORIGINAL_URL = 'https://cdn.example.com/originals/a.png'
const PRODUCT = '#3366aa'
const SHAPE = { w: 300, h: 500, left: 250, top: 150 }

// 800x800 product photo on a white studio background
async function original(): Promise<Buffer> {
  const block = await sharp({ create: { width: SHAPE.w, height: SHAPE.h, channels: 3, background: PRODUCT } }).png().toBuffer()
  return sharp({ create: { width: 800, height: 800, channels: 3, background: '#ffffff' } })
    .composite([{ input: block, left: SHAPE.left, top: SHAPE.top }])
    .png()
    .toBuffer()
}

async function cutout(size = 800, colour = PRODUCT, shape = SHAPE): Promise<Buffer> {
  const block = await sharp({ create: { width: shape.w, height: shape.h, channels: 4, background: colour } }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: block, left: shape.left, top: shape.top }])
    .png()
    .toBuffer()
}

async function backdrop(): Promise<Buffer> {
  return sharp({ create: { width: 300, height: 300, channels: 3, background: '#EADFD2' } }).jpeg().toBuffer()
}

function remover(output: () => Promise<Buffer>): BackgroundRemover {
  return { remove: vi.fn(output) }
}

function updates(): Array<Record<string, unknown>> {
  return db.productImage.update.mock.calls.map((c) => c[0].data)
}

function lastUpdate(): Record<string, unknown> {
  const all = updates()
  return all[all.length - 1]
}

beforeEach(async () => {
  db.productImage.findUnique.mockReset()
  db.productImage.update.mockReset()
  getObject.mockReset()
  putObject.mockReset()
  db.productImage.findUnique.mockResolvedValue({
    id: 'img1',
    url: 'https://cdn.example.com/originals/a.png',
    originalUrl: ORIGINAL_URL,
    treatment: 'original',
  })
  db.productImage.update.mockResolvedValue({})
  const photo = await original()
  getObject.mockImplementation(async (url: string) => {
    if (url === ORIGINAL_URL) return photo
    throw new Error(`unexpected fetch ${url}`)
  })
  putObject.mockImplementation(async (key: string) => `https://cdn.example.com/${key}`)
  vi.stubEnv('PHOTO_BG_PROVIDER', '')
  vi.stubEnv('PHOTO_BG_API_KEY', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('runCompositeJob', () => {
  it('stores a passing composite as pending with a compositeUrl', async () => {
    const loadBackdrop = vi.fn(backdrop)
    await runCompositeJob('img1', 'satin', { remover: remover(() => cutout()), loadBackdrop })

    expect(updates()[0]).toEqual({ reviewStatus: 'pending', backdrop: 'satin', compositeUrl: null, reviewNote: null })
    expect(loadBackdrop).toHaveBeenCalledWith('satin')
    expect(putObject).toHaveBeenCalledTimes(1)
    const [key, body, contentType] = putObject.mock.calls[0]
    expect(key).toMatch(/^composites\/img1-satin-\d+\.webp$/)
    expect(contentType).toBe('image/webp')
    expect((await sharp(body).metadata()).format).toBe('webp')
    expect(lastUpdate()).toEqual({ compositeUrl: `https://cdn.example.com/${key}` })
    expect(updates().some((d) => d.reviewStatus === 'rejected')).toBe(false)
  }, 30_000)

  it('rejects with a note when no provider is configured', async () => {
    await runCompositeJob('img1', 'linen', { loadBackdrop: vi.fn(backdrop) })
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'Background removal is not set up yet.' })
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rejects a cutout without transparency', async () => {
    const jpeg = async () => sharp(await original()).jpeg().toBuffer()
    await runCompositeJob('img1', 'satin', { remover: remover(jpeg), loadBackdrop: vi.fn(backdrop) })
    expect(lastUpdate()).toEqual({
      reviewStatus: 'rejected',
      reviewNote: 'The cut-out came back without a transparent background.',
    })
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rejects a cutout of a different size', async () => {
    const small = () => cutout(400, PRODUCT, { w: 150, h: 250, left: 125, top: 75 })
    await runCompositeJob('img1', 'satin', { remover: remover(small), loadBackdrop: vi.fn(backdrop) })
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'The cut-out does not match the original photo.' })
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rejects when the honesty check fails', async () => {
    const recoloured = () => cutout(800, '#4477bb')
    await runCompositeJob('img1', 'blush', { remover: remover(recoloured), loadBackdrop: vi.fn(backdrop) })
    const last = lastUpdate()
    expect(last.reviewStatus).toBe('rejected')
    expect(String(last.reviewNote)).toMatch(/^The product changed during processing/)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('never changes url or treatment', async () => {
    const scenarios: Array<Parameters<typeof runCompositeJob>[2]> = [
      { remover: remover(() => cutout()), loadBackdrop: vi.fn(backdrop) },
      { loadBackdrop: vi.fn(backdrop) },
      { remover: remover(() => cutout(800, '#4477bb')), loadBackdrop: vi.fn(backdrop) },
      { remover: remover(async () => { throw new Error('provider down') }), loadBackdrop: vi.fn(backdrop) },
    ]
    for (const deps of scenarios) await runCompositeJob('img1', 'satin', deps)
    expect(updates().length).toBeGreaterThan(0)
    for (const data of updates()) {
      expect(data).not.toHaveProperty('url')
      expect(data).not.toHaveProperty('treatment')
    }
    for (const call of db.productImage.update.mock.calls) expect(call[0].where).toEqual({ id: 'img1' })
  }, 60_000)

  it('never throws, turning any failure into a readable rejection', async () => {
    await expect(
      runCompositeJob('img1', 'satin', {
        remover: remover(async () => { throw new Error('provider down') }),
        loadBackdrop: vi.fn(backdrop),
      }),
    ).resolves.toBeUndefined()
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'The background-removal service failed: provider down' })

    db.productImage.update.mockReset()
    db.productImage.findUnique.mockResolvedValue(null)
    await expect(runCompositeJob('missing', 'satin', { remover: remover(() => cutout()) })).resolves.toBeUndefined()
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'This photo no longer exists.' })

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    db.productImage.update.mockReset()
    db.productImage.update.mockRejectedValue(new Error('db down'))
    await expect(runCompositeJob('img1', 'satin', { remover: remover(() => cutout()) })).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })

  it('rejects an unknown backdrop without marking the row pending', async () => {
    await runCompositeJob('img1', 'velvet' as never, { remover: remover(() => cutout()) })
    expect(updates()).toEqual([{ reviewStatus: 'rejected', reviewNote: 'That backdrop is not available.' }])
  })

  it('rejects when the original photo cannot be read', async () => {
    getObject.mockRejectedValue(new Error('Refusing to fetch a URL outside photo storage'))
    await runCompositeJob('img1', 'satin', { remover: remover(() => cutout()), loadBackdrop: vi.fn(backdrop) })
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'The original photo could not be read.' })
  })

  it('rejects when the backdrop cannot be loaded', async () => {
    const loadBackdrop = vi.fn(async () => { throw new Error('404') })
    await runCompositeJob('img1', 'linen', { remover: remover(() => cutout()), loadBackdrop })
    expect(lastUpdate()).toEqual({ reviewStatus: 'rejected', reviewNote: 'The linen backdrop could not be loaded.' })
    expect(putObject).not.toHaveBeenCalled()
  }, 30_000)
})
