// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { db, getSession, runCompositeJob, getBackgroundRemover, scheduled } = vi.hoisted(() => ({
  db: {
    customer: { findUnique: vi.fn() },
    productImage: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  },
  getSession: vi.fn(),
  runCompositeJob: vi.fn(),
  getBackgroundRemover: vi.fn(),
  scheduled: [] as Array<() => unknown>,
}))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth/session', () => ({ getSession }))
vi.mock('@/lib/photos/background', () => ({ getBackgroundRemover }))
vi.mock('@/lib/photos/job', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/photos/job')>()),
  runCompositeJob,
}))
// Capture after() callbacks so a test can see what was scheduled, and when
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => unknown) => {
    scheduled.push(task)
  },
}))

import { POST as composite } from '@/app/api/admin/products/[id]/images/[imageId]/composite/route'
import { POST as review } from '@/app/api/admin/products/[id]/images/[imageId]/review/route'

const PRODUCT = 'prod_1'
const IMAGE = 'img_1'

type Row = {
  id: string
  productId: string
  url: string
  originalUrl: string | null
  treatment: string
  reviewStatus: string
  whiteBackground: boolean
  compositeUrl: string | null
  backdrop: string | null
  reviewNote: string | null
}

function row(overrides: Partial<Row> = {}): Row {
  return {
    id: IMAGE,
    productId: PRODUCT,
    url: 'https://cdn.example.com/products/a.webp',
    originalUrl: 'https://cdn.example.com/originals/a.png',
    treatment: 'blend',
    reviewStatus: 'approved',
    whiteBackground: true,
    compositeUrl: null,
    backdrop: null,
    reviewNote: null,
    ...overrides,
  }
}

// An in-memory productImage table: updateMany honours the where clause the
// way Postgres would, so conditional writes are actually exercised
let table: Row[] = []

function matches(r: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = (r as Record<string, unknown>)[key]
    if (cond && typeof cond === 'object' && 'not' in cond) return value !== (cond as { not: unknown }).not
    return value === cond
  })
}

function json(body: unknown) {
  return new NextRequest('http://localhost/api/admin', { method: 'POST', body: JSON.stringify(body) })
}

const params = (id = PRODUCT, imageId = IMAGE) => ({ params: Promise.resolve({ id, imageId }) })

beforeEach(() => {
  vi.clearAllMocks()
  scheduled.length = 0
  table = [row()]
  getSession.mockResolvedValue({ customerId: 'admin' })
  db.customer.findUnique.mockResolvedValue({ isAdmin: true, isHost: false })
  getBackgroundRemover.mockReturnValue({ remove: vi.fn() })
  db.productImage.findUnique.mockImplementation(async ({ where }) => {
    const found = table.find((r) => matches(r, where))
    return found ? { ...found } : null
  })
  db.productImage.findFirst.mockImplementation(async ({ where }) => {
    const found = table.find((r) => matches(r, where))
    return found ? { ...found } : null
  })
  db.productImage.updateMany.mockImplementation(async ({ where, data }) => {
    const hits = table.filter((r) => matches(r, where))
    for (const r of hits) Object.assign(r, data)
    return { count: hits.length }
  })
})

describe('POST …/review', () => {
  it('approves a pending composite and points url at it', async () => {
    table = [row({ reviewStatus: 'pending', backdrop: 'satin', compositeUrl: 'https://cdn.example.com/composites/a.webp' })]

    const res = await review(json({ decision: 'approve' }), params())

    expect(res.status).toBe(200)
    const { image } = await res.json()
    expect(image).toMatchObject({
      url: 'https://cdn.example.com/composites/a.webp',
      treatment: 'composite',
      reviewStatus: 'approved',
    })
    expect(table[0]).toMatchObject({ url: 'https://cdn.example.com/composites/a.webp', treatment: 'composite' })
  })

  it('is idempotent when approving twice', async () => {
    table = [row({ reviewStatus: 'pending', compositeUrl: 'https://cdn.example.com/composites/a.webp' })]

    const first = await review(json({ decision: 'approve' }), params())
    const second = await review(json({ decision: 'approve' }), params())

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect((await second.json()).image).toMatchObject({ treatment: 'composite', reviewStatus: 'approved' })
    expect(db.productImage.updateMany).toHaveBeenCalledTimes(1)
  })

  it('refuses to approve while the job has not produced a composite', async () => {
    table = [row({ reviewStatus: 'pending', compositeUrl: null })]

    const res = await review(json({ decision: 'approve' }), params())

    expect(res.status).toBe(409)
    expect((await res.json()).error).toEqual(expect.any(String))
    expect(table[0]).toMatchObject({ url: 'https://cdn.example.com/products/a.webp', treatment: 'blend' })
  })

  it('refuses to approve a composite whose job failed', async () => {
    table = [row({ reviewStatus: 'rejected', reviewNote: 'The cut-out does not match the original photo.' })]

    const res = await review(json({ decision: 'approve' }), params())

    expect(res.status).toBe(409)
    expect(table[0].url).toBe('https://cdn.example.com/products/a.webp')
  })

  it('cannot point url at a composite that changed after it was read', async () => {
    table = [row({ reviewStatus: 'pending', compositeUrl: 'https://cdn.example.com/composites/old.webp' })]
    // A new job claims the row between the read and the write
    db.productImage.findUnique.mockImplementationOnce(async () => {
      const read = { ...table[0] }
      Object.assign(table[0], { compositeUrl: null })
      return read
    })

    const res = await review(json({ decision: 'approve' }), params())

    expect(res.status).toBe(409)
    expect(table[0]).toMatchObject({ url: 'https://cdn.example.com/products/a.webp', treatment: 'blend' })
  })

  it('rejecting an approved composite restores the original and its treatment', async () => {
    table = [
      row({
        url: 'https://cdn.example.com/composites/a.webp',
        compositeUrl: 'https://cdn.example.com/composites/a.webp',
        treatment: 'composite',
        reviewStatus: 'approved',
        whiteBackground: true,
      }),
    ]

    const res = await review(json({ decision: 'reject' }), params())

    expect(res.status).toBe(200)
    expect((await res.json()).image).toMatchObject({
      url: 'https://cdn.example.com/originals/a.png',
      treatment: 'blend',
      reviewStatus: 'rejected',
      compositeUrl: null,
    })
  })

  it('rejecting restores the original treatment for a photo without a white background', async () => {
    table = [row({ reviewStatus: 'pending', treatment: 'original', whiteBackground: false, compositeUrl: 'https://cdn.example.com/composites/a.webp' })]

    const res = await review(json({ decision: 'reject' }), params())

    expect(res.status).toBe(200)
    expect(table[0]).toMatchObject({ treatment: 'original', reviewStatus: 'rejected', compositeUrl: null })
  })

  it('400s for an unknown decision', async () => {
    const res = await review(json({ decision: 'maybe' }), params())
    expect(res.status).toBe(400)
    expect(db.productImage.updateMany).not.toHaveBeenCalled()
  })

  it('404s for an image on another product', async () => {
    table = [row({ productId: 'prod_other', reviewStatus: 'pending', compositeUrl: 'https://cdn.example.com/composites/a.webp' })]

    const res = await review(json({ decision: 'approve' }), params())

    expect(res.status).toBe(404)
    expect(db.productImage.updateMany).not.toHaveBeenCalled()
  })
})

describe('POST …/composite', () => {
  it('claims the image and schedules the job after responding', async () => {
    const res = await composite(json({ backdrop: 'linen' }), params())

    expect(res.status).toBe(202)
    expect(await res.json()).toEqual({ status: 'pending' })
    expect(table[0].reviewStatus).toBe('pending')
    expect(runCompositeJob).not.toHaveBeenCalled()

    expect(scheduled).toHaveLength(1)
    await scheduled[0]()
    expect(runCompositeJob).toHaveBeenCalledWith(IMAGE, 'linen')
  })

  it('clears an earlier composite when claiming, so it cannot be approved meanwhile', async () => {
    table = [row({ reviewStatus: 'rejected', compositeUrl: 'https://cdn.example.com/composites/stale.webp', reviewNote: 'Old note' })]

    await composite(json({ backdrop: 'satin' }), params())
    const res = await review(json({ decision: 'approve' }), params())

    expect(table[0]).toMatchObject({ reviewStatus: 'pending', compositeUrl: null, reviewNote: null, backdrop: 'satin' })
    expect(res.status).toBe(409)
    expect(table[0].url).toBe('https://cdn.example.com/products/a.webp')
  })

  it('refuses a second composite job while one is pending', async () => {
    const first = await composite(json({ backdrop: 'satin' }), params())
    const second = await composite(json({ backdrop: 'blush' }), params())

    expect(first.status).toBe(202)
    expect(second.status).toBe(409)
    expect(scheduled).toHaveLength(1)
  })

  it('404s for an image on another product', async () => {
    table = [row({ productId: 'prod_other' })]

    const res = await composite(json({ backdrop: 'satin' }), params())

    expect(res.status).toBe(404)
    expect(table[0].reviewStatus).toBe('approved')
    expect(scheduled).toHaveLength(0)
  })

  it('400s for an unknown backdrop', async () => {
    const res = await composite(json({ backdrop: 'velvet' }), params())

    expect(res.status).toBe(400)
    expect(db.productImage.updateMany).not.toHaveBeenCalled()
    expect(scheduled).toHaveLength(0)
  })

  it('409s when background removal is not set up', async () => {
    getBackgroundRemover.mockReturnValue(null)

    const res = await composite(json({ backdrop: 'satin' }), params())

    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('Background removal is not set up yet.')
    expect(table[0].reviewStatus).toBe('approved')
    expect(scheduled).toHaveLength(0)
  })
})
