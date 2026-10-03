// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, requireStreamOwner } = vi.hoisted(() => ({
  db: {
    liveStream: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    streamHost: { findUnique: vi.fn() },
    streamViewer: { count: vi.fn() },
  },
  getSession: vi.fn(),
  requireStreamOwner: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/auth/guards', () => ({ requireStreamOwner }))
vi.mock('@/lib/config', () => ({
  config: {
    livekit: { apiKey: 'devkey', apiSecret: 'secret-at-least-32-characters-long!!', wsUrl: 'ws://x' },
  },
}))

const OMIT = { streamKey: true, password: true }
const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  db.liveStream.findMany.mockResolvedValue([])
  db.liveStream.count.mockResolvedValue(0)
  getSession.mockResolvedValue(null)
})

describe('public stream lists omit secrets', () => {
  it.each(['live', 'schedule', 'replays'])('GET streams/%s', async (name) => {
    const mod = await import(`@/app/api/streams/${name}/route`)
    await mod.GET(new NextRequest(`http://localhost/api/streams/${name}`))
    expect(db.liveStream.findMany).toHaveBeenCalledWith(expect.objectContaining({ omit: OMIT }))
  })

  it('GET hosts/[id] omits secrets from the streams relation', async () => {
    db.streamHost.findUnique.mockResolvedValue(null)
    const mod = await import('@/app/api/hosts/[id]/route')
    await mod.GET(new NextRequest('http://localhost/api/hosts/h1'), params('h1'))
    const args = db.streamHost.findUnique.mock.calls[0][0]
    expect(args.include.streams.omit).toEqual(OMIT)
  })
})

describe('GET streams/[id] stream key', () => {
  beforeEach(() => {
    db.liveStream.findUnique.mockImplementation(async (args: { select?: unknown }) =>
      args.select ? { streamKey: 'secret-key' } : { id: 's1', status: 'scheduled' }
    )
  })

  it('does not include streamKey for anonymous callers', async () => {
    requireStreamOwner.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) })
    const mod = await import('@/app/api/streams/[id]/route')
    const body = await (await mod.GET(new NextRequest('http://localhost/api/streams/s1'), params('s1'))).json()
    expect(body.stream).not.toHaveProperty('streamKey')
  })

  it('includes streamKey for the owner', async () => {
    requireStreamOwner.mockResolvedValue({ ok: true, customerId: 'c1', isAdmin: false })
    const mod = await import('@/app/api/streams/[id]/route')
    const body = await (await mod.GET(new NextRequest('http://localhost/api/streams/s1'), params('s1'))).json()
    expect(body.stream.streamKey).toBe('secret-key')
  })
})

describe('POST streams/[id]/token viewer identity', () => {
  it('does not put the customer id in the LiveKit identity', async () => {
    db.liveStream.findUnique.mockResolvedValue({ id: 's1' })
    getSession.mockResolvedValue({ customerId: 'cust-12345' })
    const mod = await import('@/app/api/streams/[id]/token/route')
    const req = new NextRequest('http://localhost/api/streams/s1/token', {
      method: 'POST',
      body: JSON.stringify({ role: 'viewer' }),
    })
    const { token } = await (await mod.POST(req, params('s1'))).json()
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    expect(payload.sub).toMatch(/^viewer-[0-9a-f]{16}$/)
    expect(payload.sub).not.toContain('cust-12345')
  })
})
