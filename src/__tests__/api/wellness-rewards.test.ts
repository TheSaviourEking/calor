// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession } = vi.hoisted(() => {
  const db = {
    customer: { findUnique: vi.fn() },
    couplesLink: { findFirst: vi.fn(), findUnique: vi.fn() },
    coupleGoal: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    toySession: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    customerSmartToy: { findFirst: vi.fn(), update: vi.fn() },
    loyaltyAccount: { upsert: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    loyaltyTransaction: { create: vi.fn(), aggregate: vi.fn() },
    pointsRedemption: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    pointsReward: { findUnique: vi.fn(), updateMany: vi.fn() },
    promotion: { create: vi.fn() },
    giftCard: { create: vi.fn() },
    dailyCheckIn: { findFirst: vi.fn(), create: vi.fn() },
    dailyReward: { findUnique: vi.fn() },
    userStreak: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    challenge: { findUnique: vi.fn(), update: vi.fn() },
    challengeCompletion: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
  }
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
  return { db, getSession: vi.fn() }
})

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))

import * as coupleGoals from '@/app/api/wellness/couple-goals/route'
import * as toySessions from '@/app/api/wellness/sessions/route'
import * as toys from '@/app/api/wellness/toys/route'
import * as redeem from '@/app/api/points/redeem/route'
import * as checkin from '@/app/api/wellness/checkin/route'
import * as challenge from '@/app/api/wellness/challenges/[id]/route'

const json = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/x', { method, body: JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ customerId: 'me', email: 'me@example.com' })
  db.loyaltyAccount.upsert.mockResolvedValue({ id: 'acct_1' })
  db.loyaltyTransaction.aggregate.mockResolvedValue({ _sum: { points: 0 } })
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
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
  it('stores no points on a client-created goal and records the session customer as creator', async () => {
    db.couplesLink.findFirst.mockResolvedValue({ id: 'link_1' })
    db.coupleGoal.create.mockImplementation(async ({ data }: { data: unknown }) => data)

    const res = await coupleGoals.POST(json('POST', { title: 'Date night', category: 'intimacy', pointsReward: 50, customerId: 'victim' }))
    expect(res.status).toBe(201)
    const data = db.coupleGoal.create.mock.calls[0][0].data
    expect(data.pointsReward).toBe(0)
    expect(data.createdBy).toBe('me')
    expect(data.couplesLinkId).toBe('link_1')
  })

  it('refuses a goal on a couple link the caller is not part of', async () => {
    db.couplesLink.findFirst.mockResolvedValue(null)
    const res = await coupleGoals.POST(json('POST', { title: 'x', category: 'intimacy', couplesLinkId: 'not-mine' }))
    expect(res.status).toBe(400)
    expect(db.coupleGoal.create).not.toHaveBeenCalled()
  })

  it('awards points once, only when the atomic completion flip wins', async () => {
    db.couplesLink.findUnique.mockResolvedValue({ id: 'link_1', customer1Id: 'me', customer2Id: 'partner' })
    db.coupleGoal.findFirst.mockResolvedValue({ id: 'g1', completed: false })
    db.coupleGoal.findUnique.mockResolvedValue({ id: 'g1', couplesLinkId: 'link_1', title: 'Date night', pointsReward: 20 })

    db.coupleGoal.updateMany.mockResolvedValue({ count: 1 })
    await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: true }))
    expect(db.loyaltyAccount.upsert).toHaveBeenCalledTimes(2)
    const flip = db.coupleGoal.updateMany.mock.calls[0][0]
    expect(flip.where.completed).toBe(false)
    expect(flip.where.couplesLink.status).toBe('active')

    db.loyaltyAccount.upsert.mockClear()
    db.coupleGoal.updateMany.mockResolvedValue({ count: 0 })
    await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: true }))
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })

  it('refuses to reopen a completed goal', async () => {
    db.coupleGoal.findFirst.mockResolvedValue({ id: 'g1', completed: true })
    const res = await coupleGoals.PUT(json('PUT', { goalId: 'g1', completed: false }))
    expect(res.status).toBe(409)
    expect(db.coupleGoal.update).not.toHaveBeenCalled()
    expect(db.coupleGoal.updateMany).not.toHaveBeenCalled()
  })

  it('only finds goals on an active couple link the caller belongs to', async () => {
    db.coupleGoal.findFirst.mockResolvedValue(null)
    await coupleGoals.PUT(json('PUT', { goalId: 'g1', progress: 10 }))
    expect(db.coupleGoal.findFirst.mock.calls[0][0].where.couplesLink.status).toBe('active')
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

  const openSession = () => {
    db.toySession.findFirst.mockResolvedValue({ id: 's1', startedAt: new Date(Date.now() - 600_000) })
    db.toySession.updateMany.mockResolvedValue({ count: 1 })
    db.toySession.findUnique.mockResolvedValue({ id: 's1', customerId: 'me', smartToyId: null })
  }

  it('never credits more time than has actually elapsed', async () => {
    db.toySession.findFirst.mockResolvedValue({ id: 's1', startedAt: new Date(Date.now() - 120_000) })
    db.toySession.updateMany.mockResolvedValue({ count: 1 })
    db.toySession.findUnique.mockResolvedValue({ id: 's1', customerId: 'me', smartToyId: null })

    await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 999_999 }))
    const stored = db.toySession.updateMany.mock.calls[0][0].data.duration
    expect(stored).toBeGreaterThanOrEqual(119)
    expect(stored).toBeLessThanOrEqual(121)
    // 2 whole minutes at 5 points per minute
    expect(db.loyaltyAccount.upsert.mock.calls[0][0].create.points).toBe(10)
  })

  it('closes abandoned open sessions without a reward, then starts a new one', async () => {
    db.toySession.updateMany.mockResolvedValue({ count: 1 })
    db.toySession.create.mockResolvedValue({ id: 'new' })
    const res = await toySessions.POST(json('POST', {}))
    expect(res.status).toBe(201)
    expect(db.toySession.updateMany).toHaveBeenCalledWith({
      where: { customerId: 'me', endedAt: null },
      data: { endedAt: expect.any(Date) },
    })
    expect(db.toySession.create).toHaveBeenCalled()
    expect(db.toySession.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      db.toySession.create.mock.invocationCallOrder[0]
    )
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })

  it('takes the per-customer advisory lock before any other query in POST and PUT', async () => {
    db.toySession.updateMany.mockResolvedValue({ count: 1 })
    db.toySession.create.mockResolvedValue({ id: 'new' })
    await toySessions.POST(json('POST', {}))
    expect(db.$executeRaw).toHaveBeenCalledTimes(1)
    expect(db.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(db.toySession.updateMany.mock.invocationCallOrder[0])

    vi.clearAllMocks()
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db))
    db.loyaltyTransaction.aggregate.mockResolvedValue({ _sum: { points: 0 } })
    openSession()
    await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 600 }))
    expect(db.$executeRaw).toHaveBeenCalledTimes(1)
    expect(db.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(db.toySession.updateMany.mock.invocationCallOrder[0])
    expect(db.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(db.loyaltyTransaction.aggregate.mock.invocationCallOrder[0])
  })

  it('credits nothing when the atomic end loses the race', async () => {
    openSession()
    db.toySession.updateMany.mockResolvedValue({ count: 0 })
    const res = await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 600 }))
    expect(res.status).toBe(404)
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })

  it('caps session points per day', async () => {
    openSession()
    db.loyaltyTransaction.aggregate.mockResolvedValue({ _sum: { points: 40 } })
    await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 240 }))
    expect(db.loyaltyAccount.upsert.mock.calls[0][0].create.points).toBe(10)

    db.loyaltyAccount.upsert.mockClear()
    db.loyaltyTransaction.aggregate.mockResolvedValue({ _sum: { points: 50 } })
    await toySessions.PUT(json('PUT', { sessionId: 's1', duration: 240 }))
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })
})

describe('daily check-in', () => {
  it('credits nothing when the atomic gate is already taken today', async () => {
    db.dailyCheckIn.findFirst.mockResolvedValue(null)
    db.userStreak.findUnique.mockResolvedValue({ currentStreak: 3, longestStreak: 3, lastActivityAt: new Date(Date.now() - 3_600_000) })
    db.dailyReward.findUnique.mockResolvedValue({ rewardType: 'points', rewardValue: 10 })
    db.userStreak.upsert.mockResolvedValue({})
    db.userStreak.updateMany.mockResolvedValue({ count: 0 })
    const res = await checkin.POST(json('POST', {}))
    expect(res.status).toBe(400)
    expect(db.dailyCheckIn.create).not.toHaveBeenCalled()
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
  })
})

describe('challenge completion', () => {
  const params = { params: Promise.resolve({ id: 'c1' }) }
  const setup = () => {
    db.challenge.findUnique.mockResolvedValue({ id: 'c1', title: 'Go', points: 25, requirementValue: 1 })
    db.challengeCompletion.findUnique.mockResolvedValue(null)
    db.challengeCompletion.upsert.mockResolvedValue({ id: 'cc1', completed: false })
  }

  it('credits nothing when the completion flip loses the race', async () => {
    setup()
    db.challengeCompletion.updateMany.mockResolvedValue({ count: 0 })
    const res = await challenge.POST(json('POST', { progress: 1 }), params)
    expect(res.status).toBe(200)
    expect(db.loyaltyAccount.upsert).not.toHaveBeenCalled()
    expect(db.loyaltyTransaction.create).not.toHaveBeenCalled()
  })

  it('credits to the upserted account when the customer has no loyalty account yet', async () => {
    setup()
    db.challengeCompletion.updateMany.mockResolvedValue({ count: 1 })
    db.loyaltyAccount.findUnique.mockResolvedValue(null)
    const res = await challenge.POST(json('POST', { progress: 1 }), params)
    expect(res.status).toBe(200)
    expect(db.loyaltyTransaction.create.mock.calls[0][0].data.accountId).toBe('acct_1')
  })
})

describe('points redemption', () => {
  it('creates nothing when the conditional spend finds too few points', async () => {
    db.pointsReward.findUnique.mockResolvedValue({ id: 'r1', isActive: true, type: 'discount', pointsCost: 100, quantityAvailable: null, quantityClaimed: 0, name: 'x' })
    db.loyaltyAccount.findUnique.mockResolvedValue({ id: 'acct_1', points: 100 })
    db.loyaltyAccount.updateMany.mockResolvedValue({ count: 0 })
    const res = await redeem.POST(json('POST', { rewardId: 'r1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Not enough points')
    expect(db.pointsRedemption.create).not.toHaveBeenCalled()
    expect(db.promotion.create).not.toHaveBeenCalled()
  })
})
