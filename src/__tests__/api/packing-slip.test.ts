import { describe, it, expect } from 'vitest'
import { buildPackingSlip } from '@/lib/orders/packing-slip'
import { shipFromName } from '@/lib/discretion'

const order = {
  reference: 'CAL-1042',
  plainPackaging: true,
  discreetLabel: true,
  deliveryInstructions: 'Leave with concierge',
  items: [
    { quantity: 2, productId: 'abcdef1234567', variant: { sku: 'WND-01' }, name: 'Warm Touch Wand' },
    { quantity: 1, productId: 'zyxwvu9876543', variant: null, name: 'Secret Oil' },
    { quantity: 3, productId: 'qrstuvwxyz', variant: { sku: null } },
  ],
}

describe('buildPackingSlip', () => {
  it('lists SKU and quantity, falling back to a short product id', () => {
    const slip = buildPackingSlip(order)
    expect(slip.reference).toBe('CAL-1042')
    expect(slip.lines).toEqual([
      { sku: 'WND-01', quantity: 2 },
      { sku: 'ZYXWVU98', quantity: 1 },
      { sku: 'QRSTUVWX', quantity: 3 },
    ])
  })

  it('never carries a product name', () => {
    const json = JSON.stringify(buildPackingSlip(order))
    expect(json).not.toContain('Warm Touch Wand')
    expect(json).not.toContain('Secret Oil')
    expect(json).not.toMatch(/"name"/)
  })

  it('uses the neutral ship-from name and passes packaging through', () => {
    const slip = buildPackingSlip({ ...order, plainPackaging: false })
    expect(slip.returnName).toBe(shipFromName())
    expect(slip.plainPackaging).toBe(false)
    expect(slip.instructions).toBe('Leave with concierge')
    expect(buildPackingSlip({ ...order, deliveryInstructions: null }).instructions).toBeNull()
  })
})
