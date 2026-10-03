// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    streamChatMessage: { findMany: vi.fn() },
    returnRequest: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    review: { findMany: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    liveStream: { findMany: vi.fn(), count: vi.fn() },
  },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

const RETURN_ID = 'cjld2cjxh0000qzrmn831i7rn'

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  db.customer.findUnique.mockResolvedValue({ isAdmin: false, isHost: false })
  db.review.findMany.mockResolvedValue([])
  db.liveStream.findMany.mockResolvedValue([])
  db.liveStream.count.mockResolvedValue(0)

  // Behaves like the database: a return owned by 'victim' is only found
  // when the query does not exclude it by customerId
  const victimReturn = { id: RETURN_ID, customerId: 'victim', trackingNumber: null }
  const lookup = async ({ where }: { where: { customerId?: string } }) =>
    where.customerId && where.customerId !== 'victim' ? null : victimReturn
  db.returnRequest.findUnique.mockImplementation(lookup)
  db.returnRequest.findFirst.mockImplementation(lookup)
  db.returnRequest.update.mockResolvedValue(victimReturn)
})

describe('GET /api/streams/[id]/chat', () => {
  it('returns display fields only', async () => {
    db.streamChatMessage.findMany.mockResolvedValue([
      {
        id: 'm1', streamId: 's1', message: 'hi', type: 'chat', createdAt: new Date(),
        isPinned: false, isHighlighted: false, reactionCounts: null,
        customerId: 'victim', guestName: null, guestId: null,
        isModerated: false, approvedBy: null, isDeleted: false, answeredBy: null,
        customer: { firstName: 'Vic', lastName: 'Tim' },
      },
      {
        id: 'm2', streamId: 's1', message: 'yo', type: 'chat', createdAt: new Date(),
        isPinned: false, isHighlighted: false, reactionCounts: null,
        customerId: null, guestName: 'Sam', guestId: 'g-1', customer: null,
      },
    ])
    const { GET } = await import('@/app/api/streams/[id]/chat/route')
    const res = await GET(new NextRequest('http://localhost/api/streams/s1/chat'), { params: Promise.resolve({ id: 's1' }) })
    const { messages } = await res.json()

    expect(messages).toHaveLength(2)
    for (const m of messages) {
      expect(m).not.toHaveProperty('customerId')
      expect(m).not.toHaveProperty('guestId')
      expect(m).not.toHaveProperty('approvedBy')
      expect(JSON.stringify(m)).not.toContain('lastName')
      expect(JSON.stringify(m)).not.toContain('Tim')
    }
    expect(messages.map((m: { displayName: string }) => m.displayName).sort()).toEqual(['Sam', 'Vic'])
    expect(db.streamChatMessage.findMany.mock.calls[0][0].where.isDeleted).toBe(false)
  })
})

describe('PUT /api/returns', () => {
  it('returns 404 for another customer\'s return', async () => {
    getSession.mockResolvedValue({ customerId: 'me' })
    const { PUT } = await import('@/app/api/returns/route')
    const res = await PUT(new NextRequest('http://localhost/api/returns', {
      method: 'PUT',
      body: JSON.stringify({ returnId: RETURN_ID, action: 'add_tracking', trackingNumber: 'TRACK1' }),
    }))

    expect(res.status).toBe(404)
    expect(db.returnRequest.update).not.toHaveBeenCalled()
  })
})

describe('GET /api/reviews', () => {
  it.each([
    ['anonymous', null],
    ['a non-admin customer', { customerId: 'me' }],
  ])('?approved=false as %s still queries isApproved: true', async (_who, session) => {
    getSession.mockResolvedValue(session)
    const { GET } = await import('@/app/api/reviews/route')
    await GET(new NextRequest('http://localhost/api/reviews?approved=false'))

    expect(db.review.findMany.mock.calls[0][0].where.isApproved).toBe(true)
  })

  it('?approved=false as an admin lists unapproved reviews too', async () => {
    getSession.mockResolvedValue({ customerId: 'admin-1' })
    db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
    const { GET } = await import('@/app/api/reviews/route')
    await GET(new NextRequest('http://localhost/api/reviews?approved=false'))

    expect(db.review.findMany.mock.calls[0][0].where).not.toHaveProperty('isApproved')
  })
})

describe('GET /api/streams', () => {
  it('?status=live as anonymous excludes private streams', async () => {
    const { GET } = await import('@/app/api/streams/route')
    await GET(new NextRequest('http://localhost/api/streams?status=live'))

    const where = db.liveStream.findMany.mock.calls[0][0].where
    expect(where.status).toBe('live')
    expect(where.isPrivate).toBe(false)
  })
})
