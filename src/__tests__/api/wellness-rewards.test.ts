// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    couplesLink: { findFirst: vi.fn(), findUnique: vi.fn() },
    coupleGoal: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    toySession: { findFirst: vi.fn(), update: vi.fn() },
    customerSmartToy: { findFirst: vi.fn(), update: vi.fn() },
    loyaltyAccount: { upsert: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    pointsRedemption: { findMany: vi.fn() },
  },
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

import * as coupleGoals from '@/app/api/wellness/couple-goals/route'
import * as toySessions from '@/app/api/wellness/sessions/route'
import * as toys from '@/app/api/wellness/toys/route'
import * as redeem from '@/app/api/points/redeem/route'

const json = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/x', { method, body: JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ customerId: 'me', email: 'me@example.com' })
  db.loyaltyAccount.upsert.mockResolvedValue({ id: 'acct_1' })
})

describe('customer id comes from the session', () => {
  it('GET /api/points/redeem lists the caller, not the customerId in the URL', async () => {
    db.pointsRedemption.findMany.mockResolvedValue([])
    await redeem.GET(new NextRequest('http://localhost/api/points/redeem?customerId=victim'))
    expect(db.pointsRedemption.findMany.mock.calls[0][0].where).toEqual({ customerId: 'me' })
  })

  it('PUT /api/wellness/toys refuses a toy that belongs to someone else', async () => {
    db.customerSmartToy.findFirst.mockResolvedValue(null)
    const res = await toys.PUT(json('PUT', { toyId: 't1', nickname: 'x' }))
    expect(res.status).toBe(404)
    expect(db.customerSmartToy.findFirst.mock.calls[0][0].where).toEqual({ id: 't1', customerId: 'me' })
    expect(db.customerSmartToy.update).not.toHaveBeenCalled()
  })
})

describe('couple goals', () => {
  it('caps the reward a client can set and records the session customer as creator', async () => {
    db.couplesLink.findFirst.mockResolvedValue({ id: 'link_1' })
    db.coupleGoal.create.mockImplementation(async ({ data }: { data: unknown }) => data)

    const res = await coupleGoals.POST(json('POST', { title: 'Date night', category: 'intimacy', pointsReward: 1_000_000, customerId: 'victim' }))
    expect(res.status).toBe(201)
    const data = db.coupleGoal.create.mock.calls[0][0].data
    expect(data.pointsReward).toBe(50)
    expect(data.createdBy).toBe('me')
    expect(data.couplesLinkId).toBe('link_1')
  })

  it('refuses a goal on a couple link the caller is not part of', async () => {
    db.couplesLink.findFirst.mockResolvedValue(null)
    const res = await coupleGoals.POST(json('POST', { title: 'x', category: 'intimacy', couplesLinkId: 'not-mine' }))
    expect(res.status).toBe(400)
    expect(db.coupleGoal.create).not.toHaveBeenCalled()
  })

  it('awards points the first time a goal is completed and not again', async () => {
    db.couplesLink.findUnique.mockResolvedValue({ id: 'link_1', customer1Id: 'me', customer2Id: 'partner' })
    db.coupleGoal.update.mockResolvedValue({ id: 'g1', couplesLinkId: 'link_1', title: 'Date night', pointsReward: 20 })

    db.coupleGoal.findFirst.mockResolvedValue({ id: 'g1', completed: false })
    await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: true }))
    expect(db.loyaltyAccount.upsert).toHaveBeenCalledTimes(2)

    db.loyaltyAccount.upsert.mockClear()
    db.coupleGoal.findFirst.mockResolvedValue({ id: 'g1', completed: true })
    await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: true }))
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })

  it('returns 404 for a goal on someone else\'s couple link', async () => {
    db.coupleGoal.findFirst.mockResolvedValue(null)
    const res = await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: true }))
    expect(res.status).toBe(404)
    expect(db.coupleGoal.update).not.toHaveBeenCalled()
  })
})

describe('toy sessions', () => {
  it('refuses to end a session that is not the caller\'s or is already ended', async () => {
    db.toySession.findFirst.mockResolvedValue(null)
    const res = await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 600 }))
    expect(res.status).toBe(404)
    expect(db.toySession.findFirst.mock.calls[0][0].where).toEqual({ id: 's1', customerId: 'me', endedAt: null })
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })

  it('never credits more time than has actually elapsed', async () => {
    db.toySession.findFirst.mockResolvedValue({ id: 's1', startedAt: new Date(Date.now() - 120_000) })
    db.toySession.update.mockImplementation(async ({ data }: { data: { duration: number } }) => ({
      id: 's1', customerId: 'me', smartToyId: null, duration: data.duration,
    }))

    await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 999_999 }))
    const stored = db.toySession.update.mock.calls[0][0].data.duration
    expect(stored).toBeGreaterThanOrEqual(119)
    expect(stored).toBeLessThanOrEqual(121)
    // 2 whole minutes at 5 points per minute
    expect(db.loyaltyAccount.upsert.mock.calls[0][0].create.points).toBe(10)
  })
})
