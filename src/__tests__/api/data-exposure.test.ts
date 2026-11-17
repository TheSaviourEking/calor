// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    streamChatMessage: { findMany: vi.fn() },
    returnRequest: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    review: { findMany: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    giftRegistry: { findUnique: vi.fn(), update: vi.fn() },
    sharedWishlist: { findUnique: vi.fn(), update: vi.fn() },
    product: { findMany: vi.fn() },
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
    expect(messages.map((m: { displayName: string }) => m.displayName).sort()).toEqual(['Sam', 'Vic T.'])
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

describe('public names', () => {
  const ada = { nickname: null, firstName: 'Ada', lastName: 'Lovelace' }

  it('chat displayName is the nickname when set, else First L.', async () => {
    db.streamChatMessage.findMany.mockResolvedValue([
      { id: 'a', message: 'hi', type: 'chat', createdAt: new Date(), customer: { ...ada, nickname: 'Amber 4821' }, guestName: null },
      { id: 'b', message: 'yo', type: 'chat', createdAt: new Date(), customer: ada, guestName: null },
    ])
    const { GET } = await import('@/app/api/streams/[id]/chat/route')
    const res = await GET(new NextRequest('http://localhost/api/streams/s1/chat'), { params: Promise.resolve({ id: 's1' }) })
    const { messages } = await res.json()
    expect(messages.map((m: { displayName: string }) => m.displayName).sort()).toEqual(['Ada L.', 'Amber 4821'])
    expect(JSON.stringify(messages)).not.toContain('Lovelace')
  })

  it('reviews GET shows display names, never last names or emails', async () => {
    const base = {
      productId: 'p1', rating: 5, title: 't', content: 'c', photos: null, isVerifiedPurchase: false,
      isApproved: true, helpfulCount: 0, notHelpfulCount: 0, createdAt: new Date(),
    }
    db.review.findMany.mockResolvedValue([
      { ...base, id: 'r1', customerId: 'c1', customer: ada, guestName: null, guestEmail: null },
      { ...base, id: 'r2', customerId: null, customer: null, guestName: 'Sam Smith', guestEmail: 'sam@example.com' },
      { ...base, id: 'r3', customerId: null, customer: null, guestName: 'sam@example.com', guestEmail: 'sam@example.com' },
    ])
    const { GET } = await import('@/app/api/reviews/route')
    const res = await GET(new NextRequest('http://localhost/api/reviews'))
    const text = JSON.stringify(await res.json())
    expect(text).not.toContain('lastName')
    expect(text).not.toContain('Lovelace')
    expect(text).not.toContain('guestEmail')
    expect(text).not.toContain('Smith')
    expect(text).not.toMatch(/\S+@\S+/)
    expect(text).toContain('"authorName":"Ada L."')
    expect(text).toContain('"authorName":"Sam"')
    expect(text).toContain('"authorName":"Anonymous"')
  })

  it('registry slug API ownerName is a display name and contributions hide emails', async () => {
    db.giftRegistry.findUnique.mockResolvedValue({
      id: 'g1', slug: 's', title: 'T', status: 'active', isPublic: true, password: null, allowPartialPurchases: true,
      customer: { id: 'c1', ...ada }, events: [], guests: false,
      items: [{
        id: 'i1', name: 'n', price: 1000, quantity: 1, purchasedCount: 0, priority: 1, sortOrder: 0, product: null,
        purchases: [],
        contributions: [{ id: 'k1', registryItemId: 'i1', contributorName: 'Sam Smith', contributorEmail: 'sam@example.com', amountCents: 500, message: 'x', orderId: 'o1', createdAt: new Date() }],
      }],
    })
    db.giftRegistry.update.mockResolvedValue({})
    const { GET } = await import('@/app/api/registry/slug/[slug]/route')
    const res = await GET(new Request('http://localhost/api/registry/slug/s'), { params: Promise.resolve({ slug: 's' }) })
    const body = await res.json()
    expect(body.registry.ownerName).toBe('Ada L.')
    const text = JSON.stringify(body)
    expect(text).not.toContain('sam@example.com')
    expect(text).not.toContain('Smith')
    expect(text).not.toContain('Lovelace')
    expect(body.registry.items[0].contributions[0].contributorName).toBe('Sam')
  })

  it('registry slug API prefers the nickname', async () => {
    db.giftRegistry.findUnique.mockResolvedValue({
      id: 'g1', slug: 's', title: 'T', status: 'active', isPublic: true, password: null,
      customer: { id: 'c1', ...ada, nickname: 'Amber 4821' }, events: [], items: [], guests: false,
    })
    db.giftRegistry.update.mockResolvedValue({})
    const { GET } = await import('@/app/api/registry/slug/[slug]/route')
    const res = await GET(new Request('http://localhost/api/registry/slug/s'), { params: Promise.resolve({ slug: 's' }) })
    expect((await res.json()).registry.ownerName).toBe('Amber 4821')
  })

  it('shared wishlist API returns ownerName only, no raw customer names', async () => {
    db.sharedWishlist.findUnique.mockResolvedValue({
      id: 'w1', shareCode: 'abc', title: 'T', isActive: true, expiresAt: null, productIds: '[]', customerId: 'c1', customer: ada,
    })
    db.sharedWishlist.update.mockResolvedValue({})
    db.product.findMany.mockResolvedValue([])
    const { GET } = await import('@/app/api/wishlist/shared/route')
    const res = await GET(new NextRequest('http://localhost/api/wishlist/shared?code=abc'))
    const body = await res.json()
    expect(body.wishlist.ownerName).toBe('Ada L.')
    const text = JSON.stringify(body)
    expect(text).not.toContain('Lovelace')
    expect(text).not.toContain('lastName')
    expect(text).not.toContain('c1')
  })

  it('registry and wishlist metadata use the display name', async () => {
    const { registryMetadata, wishlistMetadata } = await import('@/lib/public-metadata')
    expect(JSON.stringify(registryMetadata('Our day', 'Ada L.'))).toContain('Ada L.')
    expect(JSON.stringify(wishlistMetadata('Hers', 'Amber 4821'))).toContain('Amber 4821')
    expect(JSON.stringify(wishlistMetadata(null, 'Ada L.'))).not.toContain('Lovelace')
  })
})
