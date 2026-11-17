// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = send
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}))

import { getObject, isStorageConfigured, publicUrl, putObject } from '@/lib/photos/storage'

function configure(publicBase = 'https://cdn.example.com/') {
  vi.stubEnv('R2_ACCOUNT_ID', 'acct')
  vi.stubEnv('R2_ACCESS_KEY_ID', 'key')
  vi.stubEnv('R2_SECRET_ACCESS_KEY', 'secret')
  vi.stubEnv('R2_BUCKET_NAME', 'bucket')
  vi.stubEnv('R2_PUBLIC_URL', publicBase)
}

beforeEach(() => {
  send.mockReset()
  send.mockResolvedValue({})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('photo storage', () => {
  it('joins the public URL without a doubled slash', () => {
    configure('https://cdn.example.com/')
    expect(publicUrl('originals/a.png')).toBe('https://cdn.example.com/originals/a.png')
    configure('https://cdn.example.com')
    expect(publicUrl('originals/a.png')).toBe('https://cdn.example.com/originals/a.png')
  })

  it('is not configured without credentials', () => {
    vi.stubEnv('R2_ACCOUNT_ID', '')
    vi.stubEnv('R2_ACCESS_KEY_ID', '')
    vi.stubEnv('R2_SECRET_ACCESS_KEY', '')
    vi.stubEnv('R2_BUCKET_NAME', '')
    expect(isStorageConfigured()).toBe(false)
    configure()
    expect(isStorageConfigured()).toBe(true)
  })

  it('puts the object in the bucket and returns its public URL', async () => {
    configure()
    const body = Buffer.from('bytes')
    const url = await putObject('originals/a.png', body, 'image/png')
    expect(url).toBe('https://cdn.example.com/originals/a.png')
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].input).toEqual({
      Bucket: 'bucket',
      Key: 'originals/a.png',
      Body: body,
      ContentType: 'image/png',
    })
  })

  it('refuses to put when storage is not configured', async () => {
    vi.stubEnv('R2_BUCKET_NAME', '')
    await expect(putObject('originals/a.png', Buffer.from('x'), 'image/png')).rejects.toThrow()
    expect(send).not.toHaveBeenCalled()
  })

  it('decodes a data: URL without the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
    const out = await getObject(`data:image/png;base64,${bytes.toString('base64')}`)
    expect(Buffer.compare(out, bytes)).toBe(0)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches a public URL', async () => {
    const fetchSpy = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])))
    vi.stubGlobal('fetch', fetchSpy)
    const out = await getObject('https://cdn.example.com/originals/a.png')
    expect([...out]).toEqual([1, 2, 3])
    expect(fetchSpy).toHaveBeenCalledWith('https://cdn.example.com/originals/a.png')
  })

  it('throws when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
    await expect(getObject('https://cdn.example.com/missing.png')).rejects.toThrow(/404/)
  })
})
