import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import PrivacyReceipt from '@/components/checkout/PrivacyReceipt'

afterEach(cleanup)

function row(label: string) {
  const dt = screen.getByText(label)
  return within(dt.parentElement as HTMLElement)
}

const base = {
  method: 'card' as const,
  plainPackaging: true,
  anonymousGift: false,
  shipFromName: 'CC Fulfillment',
}

describe('PrivacyReceipt', () => {
  it('card + plain packaging lists exactly what others will see', () => {
    render(<PrivacyReceipt {...base} />)
    expect(row('The box').getByText('Plain, no logo')).toBeTruthy()
    expect(row('The label').getByText('From CC Fulfillment')).toBeTruthy()
    expect(row('Your statement').getByText('CALO CO')).toBeTruthy()
    expect(row('Email subject').getByText('Your order is confirmed')).toBeTruthy()
    expect(row('Tracking link').getByText('Shows delivery status only')).toBeTruthy()
    expect(screen.queryByText("The recipient")).toBeNull()
  })

  it('uses the configured ship-from name', () => {
    render(<PrivacyReceipt {...base} shipFromName="Acme Dispatch" />)
    expect(row('The label').getByText('From Acme Dispatch')).toBeTruthy()
  })

  it('branded packaging says calo. box', () => {
    render(<PrivacyReceipt {...base} plainPackaging={false} />)
    expect(row('The box').getByText('calo. box')).toBeTruthy()
  })

  it('crypto shows no card statement line', () => {
    render(<PrivacyReceipt {...base} method="crypto" />)
    expect(row('Your statement').getByText('No card statement line')).toBeTruthy()
  })

  it('bank transfer names the account when known, stays generic when not', () => {
    const { unmount } = render(
      <PrivacyReceipt {...base} method="bank" bankAccountName="CC Trading Ltd" />
    )
    expect(row('Your statement').getByText('A bank transfer to CC Trading Ltd')).toBeTruthy()
    unmount()
    render(<PrivacyReceipt {...base} method="bank" />)
    expect(row('Your statement').getByText('A bank transfer')).toBeTruthy()
  })

  it('anonymous gift adds the recipient row', () => {
    render(<PrivacyReceipt {...base} anonymousGift />)
    expect(row('The recipient').getByText("Won't see your name")).toBeTruthy()
  })

  it('heading has the italic word in an em', () => {
    const { container } = render(<PrivacyReceipt {...base} />)
    const h = container.querySelector('h2') as HTMLElement
    expect(h.textContent).toBe('Only you will know.')
    expect(h.querySelector('em')?.textContent).toBe('you')
    expect(screen.getByText('Before you pay')).toBeTruthy()
  })

  it('bank transfer shows the payment-instructions subject', () => {
    render(<PrivacyReceipt {...base} method="bank" />)
    expect(row('Email subject').getByText('Your payment details')).toBeTruthy()
  })
})
