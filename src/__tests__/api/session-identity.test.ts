// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// The customer must come from the session cookie, never from the request.

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    order: { findMany: vi.fn() },
    product: { findMany: vi.fn(), findFirst: vi.fn() },
    productView: { findMany: vi.fn() },
    customerPreferences: { findUnique: vi.fn() },
    userRecommendation: { findMany: vi.fn() },
    chatbotConversation: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    chatbotMessage: { create: vi.fn() },
    chatbotKnowledge: { findFirst: vi.fn(), update: vi.fn() },
    abandonedCart: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(null)
  db.order.findMany.mockResolvedValue([])
  db.product.findMany.mockResolvedValue([])
  db.productView.findMany.mockResolvedValue([])
  db.customerPreferences.findUnique.mockResolvedValue(null)
  db.userRecommendation.findMany.mockResolvedValue([])
  db.chatbotConversation.findUnique.mockResolvedValue(null)
  db.chatbotConversation.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'conv-1',
    intent: null,
    ...data,
  }))
  db.chatbotConversation.update.mockResolvedValue({})
  db.chatbotMessage.create.mockImplementation(async ({ data }: { data: unknown }) => data)
  db.chatbotKnowledge.findFirst.mockResolvedValue(null)
  db.abandonedCart.findUnique.mockResolvedValue(null)
  db.abandonedCart.create.mockImplementation(async ({ data }: { data: unknown }) => data)
})

const post = (url: string, body: unknown) =>
  new NextRequest(url, { method: 'POST', body: JSON.stringify(body) })

describe('POST /api/chatbot', () => {
  it('does not look up the orders of a customerId named in the body', async () => {
    const { POST } = await import('@/app/api/chatbot/route')
    const res = await POST(post('http://localhost/api/chatbot', { message: 'where is my order', customerId: 'victim' }))

    expect(res.status).toBe(200)
    expect(db.order.findMany).not.toHaveBeenCalled()
    expect(db.chatbotConversation.create.mock.calls[0][0].data.customerId).toBeNull()
    const body = await res.json()
    expect(body.message.content).toMatch(/log in/i)
  })

  it('looks up the session customer\'s orders', async () => {
    getSession.mockResolvedValue({ customerId: 'me' })
    const { POST } = await import('@/app/api/chatbot/route')
    await POST(post('http://localhost/api/chatbot', { message: 'where is my order', customerId: 'victim' }))

    expect(db.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: 'me' } }))
  })
})

describe('GET /api/recommendations', () => {
  it('personalises for the session customer, not ?customerId=', async () => {
    getSession.mockResolvedValue({ customerId: 'me' })
    const { GET } = await import('@/app/api/recommendations/route')
    await GET(new NextRequest('http://localhost/api/recommendations?customerId=victim'))

    expect(db.productView.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: 'me' } }))
    expect(db.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId: 'me' } }))
    for (const call of [...db.productView.findMany.mock.calls, ...db.order.findMany.mock.calls]) {
      expect(JSON.stringify(call)).not.toContain('victim')
    }
  })

  it('ignores ?customerId= without a session', async () => {
    const { GET } = await import('@/app/api/recommendations/route')
    await GET(new NextRequest('http://localhost/api/recommendations?customerId=victim'))

    expect(db.order.findMany).not.toHaveBeenCalled()
    expect(db.productView.findMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/abandoned-cart', () => {
  it('stores the session customer\'s id and email, not the body\'s', async () => {
    getSession.mockResolvedValue({ customerId: 'me' })
    db.customer.findUnique.mockResolvedValue({ email: 'me@example.com' })
    const { POST } = await import('@/app/api/abandoned-cart/route')
    const res = await POST(post('http://localhost/api/abandoned-cart', {
      sessionId: 's1',
      customerId: 'victim',
      email: 'victim@example.com',
      cartData: { items: [], total: 0 },
    }))

    expect(res.status).toBe(200)
    const data = db.abandonedCart.create.mock.calls[0][0].data
    expect(data.customerId).toBe('me')
    expect(data.email).toBe('me@example.com')
  })
})
