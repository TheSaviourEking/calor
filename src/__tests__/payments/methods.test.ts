import { describe, it, expect, afterEach } from 'vitest'
import { getBankDetails, getAvailablePaymentMethods } from '@/lib/payments/methods'

const details = {
  DEFAULT: { bankName: 'Default Bank', accountName: 'CALO LTD', iban: 'GB00TEST', swiftCode: 'TESTGB00' },
  US: { bankName: 'US Bank', accountName: 'CALO LLC', accountNumber: '111', routingNumber: '222' },
}

afterEach(() => {
  delete process.env.BANK_TRANSFER_DETAILS
  delete process.env.COINBASE_COMMERCE_API_KEY
})

describe('getBankDetails', () => {
  it('returns null when bank transfer is not configured', () => {
    expect(getBankDetails('US')).toBeNull()
  })

  it('returns null for malformed JSON instead of throwing', () => {
    process.env.BANK_TRANSFER_DETAILS = '{not json'
    expect(getBankDetails('US')).toBeNull()
  })

  it('returns the country entry and fills missing fields with null', () => {
    process.env.BANK_TRANSFER_DETAILS = JSON.stringify(details)
    expect(getBankDetails('us')).toEqual({
      bankName: 'US Bank',
      accountName: 'CALO LLC',
      accountNumber: '111',
      routingNumber: '222',
      swiftCode: null,
      iban: null,
      sortCode: null,
    })
  })

  it('falls back to DEFAULT for a country without its own entry', () => {
    process.env.BANK_TRANSFER_DETAILS = JSON.stringify(details)
    expect(getBankDetails('DE')?.bankName).toBe('Default Bank')
  })
})

describe('getAvailablePaymentMethods', () => {
  it('offers only card when nothing else is configured', () => {
    expect(getAvailablePaymentMethods()).toEqual({ card: true, bank: false, crypto: false })
  })

  it('offers bank and crypto once configured', () => {
    process.env.BANK_TRANSFER_DETAILS = JSON.stringify(details)
    process.env.COINBASE_COMMERCE_API_KEY = 'key'
    expect(getAvailablePaymentMethods()).toEqual({ card: true, bank: true, crypto: true })
  })
})
