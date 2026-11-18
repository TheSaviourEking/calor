// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payment/methods/route'

const get = (qs = '') => GET(new NextRequest(`http://localhost/api/payment/methods${qs}`))

const saved = { ...process.env }
afterEach(() => {
  process.env = { ...saved }
})

describe('GET /api/payment/methods receipt facts', () => {
  it('returns ship-from and bank account name for the receipt', async () => {
    process.env.SHIP_FROM_NAME = 'Acme Dispatch'
    process.env.BANK_TRANSFER_DETAILS = JSON.stringify({
      DEFAULT: { bankName: 'B', accountName: 'CC Trading Ltd' },
    })
    const body = await (await get()).json()
    expect(body.receipt).toEqual({ shipFromName: 'Acme Dispatch', bankAccountName: 'CC Trading Ltd' })
  })

  it('omits the bank account name when unset', async () => {
    delete process.env.BANK_TRANSFER_DETAILS
    const body = await (await get()).json()
    expect(body.receipt.bankAccountName).toBeNull()
  })

  it('uses the account for the checkout country, falling back to DEFAULT', async () => {
    process.env.BANK_TRANSFER_DETAILS = JSON.stringify({
      DEFAULT: { bankName: 'B', accountName: 'CC Trading Ltd' },
      GB: { bankName: 'UKB', accountName: 'CC Trading UK' },
    })
    expect((await (await get('?country=gb')).json()).receipt.bankAccountName).toBe('CC Trading UK')
    expect((await (await get('?country=FR')).json()).receipt.bankAccountName).toBe('CC Trading Ltd')
    expect((await (await get()).json()).receipt.bankAccountName).toBe('CC Trading Ltd')
  })
})
