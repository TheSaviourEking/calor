// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import sharp from 'sharp'
import { crc32 } from 'node:zlib'

const { db, getSession, putObject, isStorageConfigured, detectSpy } = vi.hoisted(() => ({
  db: { customer: { findUnique: vi.fn() } },
  getSession: vi.fn(),
  putObject: vi.fn(),
  isStorageConfigured: vi.fn(),
  detectSpy: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/photos/storage', () => ({ putObject, isStorageConfigured }))
// Real detection, observed: lets a test prove an image never reached the decoder
vi.mock('@/lib/photos/detect', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/photos/detect')>()
  detectSpy.mockImplementation(actual.detectWhiteBackground)
  return { detectWhiteBackground: detectSpy }
})

import { POST } from '@/app/api/upload/route'

let adminCount = 0
function asAdmin() {
  // A fresh admin per test keeps the in-memory rate limit from leaking between tests
  getSession.mockResolvedValue({ customerId: `admin-${++adminCount}` })
  db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
}

async function whiteProduct(width = 800, height = 800): Promise<Buffer> {
  const product = await sharp({
    create: { width: width / 2, height: height / 2, channels: 3, background: '#202020' },
  })
    .png()
    .toBuffer()
  return sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
    .composite([{ input: product, left: width / 4, top: height / 4 }])
    .png()
    .toBuffer()
}

async function pngFile(name: string, bytes?: Buffer): Promise<File> {
  return new File([new Uint8Array(bytes ?? (await whiteProduct()))], name, { type: 'image/png' })
}

function upload(file: File, fields: Record<string, string> = {}) {
  const form = new FormData()
  form.append('file', file)
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return POST(new NextRequest('http://localhost/api/upload', { method: 'POST', body: form }))
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  isStorageConfigured.mockReturnValue(true)
  putObject.mockImplementation(async (key: string) => `https://cdn.example.com/${key}`)
})

describe('POST /api/upload', () => {
  it('returns 401 without a session', async () => {
    const res = await upload(await pngFile('photo.png'))
    expect(res.status).toBe(401)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('returns 403 for a signed-in customer', async () => {
    getSession.mockResolvedValue({ customerId: 'cust_1' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
    const res = await upload(await pngFile('photo.png'))
    expect(res.status).toBe(403)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('stores the original under originals/ with a detected extension', async () => {
    asAdmin()
    const res = await upload(await pngFile('photo.exe'))
    expect(res.status).toBe(200)
    expect(putObject).toHaveBeenCalledWith(
      expect.stringMatching(/^originals\/[0-9a-f-]{36}\.png$/),
      expect.any(Buffer),
      'image/png'
    )
    const body = await res.json()
    expect(body).toMatchObject({ treatment: 'blend', whiteBackground: true, width: 800, height: 800 })
    expect(body.url).toBe(body.originalUrl)
    expect(body.url).toBe(`https://cdn.example.com/${putObject.mock.calls[0][0]}`)
  })

  it('uses jpg for a JPEG and reports dimensions after EXIF rotation', async () => {
    asAdmin()
    // 600x400 stored, orientation 6 means it displays as 400x600
    const jpeg = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#808080' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const res = await upload(new File([new Uint8Array(jpeg)], 'x.jpeg', { type: 'image/jpeg' }))
    expect(res.status).toBe(200)
    expect(putObject).toHaveBeenCalledWith(expect.stringMatching(/^originals\/[0-9a-f-]{36}\.jpg$/), expect.any(Buffer), 'image/jpeg')
    expect(await res.json()).toMatchObject({ treatment: 'original', whiteBackground: false, width: 400, height: 600 })
  })

  it('marks studio uploads as original even on white', async () => {
    asAdmin()
    const res = await upload(await pngFile('photo.png'), { studio: 'true' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ treatment: 'original', whiteBackground: true })
  })

  it('rejects a file whose bytes are not an image', async () => {
    asAdmin()
    const res = await upload(new File([new Uint8Array(Buffer.from('not an image at all'))], 'x.png', { type: 'image/png' }))
    expect(res.status).toBe(400)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rejects an image whose pixel count would exhaust memory', async () => {
    asAdmin()
    // A tiny PNG whose header claims 10000x10000 (100 megapixels)
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } }).png().toBuffer()
    png.writeUInt32BE(10_000, 16)
    png.writeUInt32BE(10_000, 20)
    png.writeUInt32BE(crc32(png.subarray(12, 29)) >>> 0, 29)
    const res = await upload(await pngFile('huge.png', png))
    expect(res.status).toBe(400)
    // Rejected from the header alone: the pixel data is never decoded
    expect(detectSpy).not.toHaveBeenCalled()
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rejects GIF bytes sent with an allowed MIME type', async () => {
    asAdmin()
    const gif = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#fff' } }).gif().toBuffer()
    const res = await upload(await pngFile('sneaky.png', gif))
    expect(res.status).toBe(400)
    expect(putObject).not.toHaveBeenCalled()
  })

  it('rate-limits after 60 uploads a minute per admin', async () => {
    asAdmin()
    // Every attempt counts, so 60 cheap rejected uploads use up the minute
    const bad = new File([new Uint8Array([1, 2, 3])], 'x.txt', { type: 'text/plain' })
    const statuses: number[] = []
    for (let i = 0; i < 61; i++) statuses.push((await upload(bad)).status)
    expect(statuses.slice(0, 60).every((s) => s === 400)).toBe(true)
    expect(statuses[60]).toBe(429)
    // the limit is per admin
    asAdmin()
    expect((await upload(bad)).status).toBe(400)
  })

  it('returns 503 when storage is not configured', async () => {
    asAdmin()
    isStorageConfigured.mockReturnValue(false)
    const res = await upload(await pngFile('photo.png'))
    expect(res.status).toBe(503)
    expect(putObject).not.toHaveBeenCalled()
  })
})
