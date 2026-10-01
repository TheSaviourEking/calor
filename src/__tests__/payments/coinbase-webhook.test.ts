// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { markOrderPaid, cancelOrderAndRelease } = vi.hoisted(() => ({
  markOrderPaid: vi.fn(),
  cancelOrderAndRelease: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/config', () => ({
  config: { coinbase: { apiKey: 'k', webhookSecret: 's' }, app: { baseUrl: 'http://localhost:3000' } },
}))
vi.mock('@/lib/orders/lifecycle', () => ({ markOrderPaid, cancelOrderAndRelease }))

import { handleCryptoWebhook } from '@/lib/payments/coinbase'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('handleCryptoWebhook', () => {
  it('marks the order paid on charge:confirmed', async () => {
    await handleCryptoWebhook({ type: 'charge:confirmed', data: { id: 'CHG1', metadata: { orderId: 'ord_1' } } })
    expect(markOrderPaid).toHaveBeenCalledWith('ord_1')
  })

  it('cancels with the charge id on charge:failed', async () => {
    await handleCryptoWebhook({ type: 'charge:failed', data: { id: 'CHG1', metadata: { orderId: 'ord_1' } } })
    expect(cancelOrderAndRelease).toHaveBeenCalledWith('ord_1', 'CHG1')
  })

  it('does not cancel when the charge id is missing', async () => {
    await handleCryptoWebhook({ type: 'charge:failed', data: { metadata: { orderId: 'ord_1' } } })
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })

  it('ignores events without metadata', async () => {
    await handleCryptoWebhook({ type: 'charge:confirmed', data: { id: 'CHG1' } })
    await handleCryptoWebhook({ type: 'charge:canceled', data: { id: 'CHG1' } })
    expect(markOrderPaid).not.toHaveBeenCalled()
    expect(cancelOrderAndRelease).not.toHaveBeenCalled()
  })
})
