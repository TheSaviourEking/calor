// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { db } = vi.hoisted(() => ({
  db: { order: { findUnique: vi.fn() } },
}))
vi.mock('@/lib/db', () => ({ db }))

import { getOrderView } from '@/lib/orders/order-view'

const STATUS_ROW = {
  reference: 'CAL-1',
  status: 'SHIPPED',
  trackingNumber: 'TRK123',
  estimatedDelivery: null,
  createdAt: new Date('2026-11-01'),
  customerId: 'owner',
  guestEmail: null,
}
const FULL_ROW = {
  items: [{ name: 'Secret Item Name', quantity: 2, priceCents: 1500 }],
  address: { line1: '12 Hidden Lane', line2: null, city: 'Leeds', state: 'WYK', postcode: 'LS1', country: 'GB' },
  totalCents: 3000,
  currency: 'USD',
}

beforeEach(() => {
  vi.clearAllMocks()
  db.order.findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
    args.select.items ? FULL_ROW : STATUS_ROW,
  )
})

describe('getOrderView', () => {
  it('anonymous viewer gets status only, with no item or address data', async () => {
    const view = await getOrderView('CAL-1', { customerId: null, isAdmin: false })
    expect(view?.status).toBe('SHIPPED')
    expect(view?.trackingNumber).toBe('TRK123')
    expect(view?.full).toBeNull()
    const json = JSON.stringify(view)
    expect(json).not.toContain('Secret Item Name')
    expect(json).not.toContain('Hidden Lane')
    expect(json).not.toContain('owner')
    // only the status query ran, and it did not select items or address
    expect(db.order.findUnique).toHaveBeenCalledTimes(1)
    const select = db.order.findUnique.mock.calls[0][0].select
    expect(select.items).toBeUndefined()
    expect(select.address).toBeUndefined()
  })

  it('owner gets the full view', async () => {
    const view = await getOrderView('CAL-1', { customerId: 'owner', isAdmin: false })
    expect(view?.full?.items).toEqual([{ name: 'Secret Item Name', quantity: 2, priceCents: 1500 }])
    expect(view?.full?.address.line1).toBe('12 Hidden Lane')
    expect(view?.full?.totalCents).toBe(3000)
    expect(view?.full?.currency).toBe('USD')
    expect(JSON.stringify(view)).not.toContain('"customerId"')
  })

  it('another signed-in customer gets status only', async () => {
    const view = await getOrderView('CAL-1', { customerId: 'stranger', isAdmin: false })
    expect(view?.full).toBeNull()
    expect(JSON.stringify(view)).not.toContain('Secret Item Name')
  })

  it('admin gets the full view', async () => {
    const view = await getOrderView('CAL-1', { customerId: 'admin1', isAdmin: true })
    expect(view?.full?.items).toHaveLength(1)
  })

  it('guest order is status only for a signed-in customer', async () => {
    db.order.findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
      args.select.items ? FULL_ROW : { ...STATUS_ROW, customerId: null, guestEmail: 'g@x.com' },
    )
    const view = await getOrderView('CAL-1', { customerId: 'owner', isAdmin: false })
    expect(view?.full).toBeNull()
  })

  it('unknown reference returns null', async () => {
    db.order.findUnique.mockResolvedValue(null)
    expect(await getOrderView('nope', { customerId: null, isAdmin: false })).toBeNull()
  })
})
