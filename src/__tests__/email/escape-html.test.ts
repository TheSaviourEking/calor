// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))
vi.mock('@/lib/config', () => ({
  config: {
    resend: { apiKey: 're_unit_test_key' },
    app: { baseUrl: 'http://localhost:3000' },
  },
}))

import { escapeHtml, sendAbandonedCartEmail, sendGiftCardEmail } from '@/lib/email'

const EVIL = '<img src=x onerror="alert(1)">'

beforeEach(() => {
  send.mockReset()
  send.mockResolvedValue({ data: { id: 'e1' }, error: null })
})

describe('escapeHtml', () => {
  it('escapes & < > " and \'', () => {
    expect(escapeHtml(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f')
  })

  it('leaves plain text alone', () => {
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe')
  })
})

describe('emails escape customer-entered strings', () => {
  it('abandoned-cart email escapes the name and item names', async () => {
    await sendAbandonedCartEmail({
      email: 'a@example.com',
      name: EVIL,
      cartData: { items: [{ name: EVIL, quantity: 1, price: 100 }], total: 100 },
      discountCode: 'BACK1',
      discountPercent: 10,
    })
    const html: string = send.mock.calls[0][0].html
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  })

  it('gift card email escapes names and the message', async () => {
    await sendGiftCardEmail({
      recipientEmail: 'a@example.com',
      recipientName: EVIL,
      senderName: EVIL,
      code: 'CAL1',
      value: 500,
      message: EVIL,
    })
    expect(send.mock.calls[0][0].html).not.toContain('<img')
  })
})
