// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import sharp from 'sharp'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { planBackfill, createLoader, checkDatabaseSafety } from '@/lib/photos/backfill'

async function whitePhoto(w = 400, h = 300): Promise<Buffer> {
  const square = await sharp({ create: { width: 100, height: 80, channels: 4, background: '#202020' } }).png().toBuffer()
  return sharp({ create: { width: w, height: h, channels: 4, background: '#ffffff' } })
    .composite([{ input: square, left: 150, top: 110 }])
    .png()
    .toBuffer()
}

async function darkPhoto(): Promise<Buffer> {
  return sharp({ create: { width: 200, height: 100, channels: 3, background: '#303030' } }).jpeg().toBuffer()
}

describe('planBackfill', () => {
  it('fills originalUrl and picks blend for white photos', async () => {
    const white = await whitePhoto()
    const dark = await darkPhoto()
    const images: Record<string, Buffer> = { '/a.png': white, '/b.jpg': dark }
    const plan = await planBackfill(
      [
        { id: 'a', url: '/a.png', originalUrl: null, treatment: 'original' },
        { id: 'b', url: '/b.jpg', originalUrl: null, treatment: 'original' },
      ],
      async (u) => images[u],
    )
    expect(plan).toEqual([
      { id: 'a', data: { originalUrl: '/a.png', treatment: 'blend', whiteBackground: true, width: 400, height: 300 } },
      { id: 'b', data: { originalUrl: '/b.jpg', treatment: 'original', whiteBackground: false, width: 200, height: 100 } },
    ])
  })

  it('leaves composites and rows that already have originalUrl alone', async () => {
    const load = vi.fn(async () => whitePhoto())
    const plan = await planBackfill(
      [
        { id: 'c', url: '/c.png', originalUrl: null, treatment: 'composite' },
        { id: 'd', url: '/d.png', originalUrl: '/orig.png', treatment: 'original' },
      ],
      load,
    )
    expect(plan).toEqual([])
    expect(load).not.toHaveBeenCalled()
  })

  it('skips a row whose image cannot be loaded and reports it', async () => {
    const white = await whitePhoto()
    const skipped: { id: string; reason: string }[] = []
    const plan = await planBackfill(
      [
        { id: 'bad', url: '/missing.png', originalUrl: null, treatment: 'original' },
        { id: 'junk', url: '/junk.png', originalUrl: null, treatment: 'original' },
        { id: 'ok', url: '/ok.png', originalUrl: null, treatment: 'original' },
      ],
      async (u) => {
        if (u === '/missing.png') throw new Error('not found')
        if (u === '/junk.png') return Buffer.from('not an image')
        return white
      },
      (id, reason) => skipped.push({ id, reason }),
    )
    expect(plan.map((p) => p.id)).toEqual(['ok'])
    expect(skipped.map((s) => s.id)).toEqual(['bad', 'junk'])
    expect(skipped[0].reason).toContain('not found')
  })

  it('reports width and height as displayed, honouring EXIF orientation', async () => {
    const rotated = await sharp({ create: { width: 300, height: 100, channels: 3, background: '#303030' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const [row] = await planBackfill([{ id: 'r', url: '/r.jpg', originalUrl: null, treatment: 'original' }], async () => rotated)
    expect(row.data.width).toBe(100)
    expect(row.data.height).toBe(300)
  })
})

describe('createLoader', () => {
  it('reads site-relative paths from the public directory and rejects traversal', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'backfill-'))
    const pub = path.join(root, 'public')
    await fs.mkdir(path.join(pub, 'images'), { recursive: true })
    await fs.writeFile(path.join(pub, 'images', 'x.png'), 'hello')
    await fs.writeFile(path.join(root, 'secret.txt'), 'nope')
    const load = createLoader(pub)
    expect((await load('/images/x.png')).toString()).toBe('hello')
    await expect(load('/../secret.txt')).rejects.toThrow(/outside/i)
    await expect(load('/images/../../secret.txt')).rejects.toThrow(/outside/i)
  })

  it('decodes data: URLs and refuses anything else', async () => {
    const load = createLoader('/nonexistent')
    const url = `data:text/plain;base64,${Buffer.from('hi').toString('base64')}`
    expect((await load(url)).toString()).toBe('hi')
    await expect(load('https://evil.example.com/a.png')).rejects.toThrow()
    await expect(load('images/relative.png')).rejects.toThrow(/unsupported/i)
  })
})

describe('checkDatabaseSafety', () => {
  const remote = 'postgresql://u:p@db.abc.supabase.co:5432/postgres'
  it('allows localhost and 127.0.0.1', () => {
    expect(checkDatabaseSafety('postgresql://u:p@localhost:5432/x', false)).toEqual({ ok: true })
    expect(checkDatabaseSafety('postgresql://u:p@127.0.0.1:5432/x', false)).toEqual({ ok: true })
  })
  it('refuses remote hosts without the override', () => {
    const r = checkDatabaseSafety(remote, false)
    expect(r.ok).toBe(false)
    expect(JSON.stringify(r)).not.toContain('u:p')
  })
  it('allows a remote host with the override', () => {
    expect(checkDatabaseSafety(remote, true)).toEqual({ ok: true })
  })
  it('refuses a missing or unparseable URL even with the override', () => {
    expect(checkDatabaseSafety(undefined, true).ok).toBe(false)
    expect(checkDatabaseSafety('not a url', true).ok).toBe(false)
  })
})
