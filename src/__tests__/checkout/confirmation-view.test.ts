import { describe, it, expect } from 'vitest'
import { confirmationView } from '@/lib/orders/confirmation'

describe('confirmationView', () => {
  it('shows not_found when there is no order', () => {
    expect(confirmationView(null, undefined)).toBe('not_found')
    expect(confirmationView(null, 'succeeded')).toBe('not_found')
  })

  it('shows payment_failed for a cancelled order', () => {
    expect(confirmationView({ status: 'CANCELLED', paymentProvider: 'stripe' }, undefined)).toBe('payment_failed')
    expect(confirmationView({ status: 'CANCELLED', paymentProvider: 'stripe' }, 'succeeded')).toBe('payment_failed')
  })

  it('shows payment_failed for a pending card order whose redirect failed', () => {
    expect(confirmationView({ status: 'PENDING', paymentProvider: 'stripe' }, 'failed')).toBe('payment_failed')
  })

  it('shows success for a pending card order after a successful redirect (the webhook lags)', () => {
    expect(confirmationView({ status: 'PENDING', paymentProvider: 'stripe' }, 'succeeded')).toBe('success')
  })

  it('shows awaiting_transfer for a pending bank transfer order', () => {
    expect(confirmationView({ status: 'PENDING', paymentProvider: 'bank_transfer' }, undefined)).toBe('awaiting_transfer')
  })

  it('shows success for a paid order', () => {
    expect(confirmationView({ status: 'PAYMENT_RECEIVED', paymentProvider: 'stripe' }, undefined)).toBe('success')
    expect(confirmationView({ status: 'PAYMENT_RECEIVED', paymentProvider: 'bank_transfer' }, undefined)).toBe('success')
    expect(confirmationView({ status: 'PAYMENT_RECEIVED', paymentProvider: null }, undefined)).toBe('success')
  })

  it('shows payment_failed for a pending bank transfer order whose redirect failed', () => {
    expect(confirmationView({ status: 'PENDING', paymentProvider: 'bank_transfer' }, 'failed')).toBe('payment_failed')
  })
})
