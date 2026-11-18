import { EMAIL_SUBJECTS, STATEMENT_DESCRIPTOR } from '@/lib/discretion'

export type ReceiptPaymentMethod = 'card' | 'bank' | 'crypto'

interface PrivacyReceiptProps {
  method: ReceiptPaymentMethod
  plainPackaging: boolean
  anonymousGift: boolean
  /** Computed on the server (SHIP_FROM_NAME is not available in the browser). */
  shipFromName: string
  /** Account name from BANK_TRANSFER_DETAILS; omitted when unset. */
  bankAccountName?: string | null
}

function statementValue(method: ReceiptPaymentMethod, bankAccountName?: string | null): string {
  if (method === 'crypto') return 'No card statement line'
  if (method === 'bank') {
    return bankAccountName ? `A bank transfer to ${bankAccountName}` : 'A bank transfer'
  }
  return STATEMENT_DESCRIPTOR
}

export default function PrivacyReceipt({
  method,
  plainPackaging,
  anonymousGift,
  shipFromName,
  bankAccountName,
}: PrivacyReceiptProps) {
  const rows: Array<[string, string]> = [
    ['The box', plainPackaging ? 'Plain, no logo' : 'calo. box'],
    ['The label', `From ${shipFromName}`],
    ['Your statement', statementValue(method, bankAccountName)],
    ['Email subject', EMAIL_SUBJECTS.orderConfirmed],
    ['Tracking link', 'Shows delivery status only'],
  ]
  if (anonymousGift) rows.push(['The recipient', "Won't see your name"])

  return (
    <section className="bg-warm-white p-6 mb-6 border border-sand" aria-label="Privacy receipt">
      <p
        className="font-body mb-2"
        style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#A35A3F' }}
      >
        Before you pay
      </p>
      <h2
        className="font-display text-charcoal mb-4"
        style={{ fontWeight: 300, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}
      >
        Only <em className="text-terracotta">you</em> will know.
      </h2>
      <dl>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className="flex justify-between gap-4 py-3"
            style={i === 0 ? undefined : { borderTop: '1px solid var(--color-sand, #E8DDD0)' }}
          >
            <dt
              className="font-body"
              style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#A35A3F' }}
            >
              {label}
            </dt>
            <dd className="font-body text-charcoal text-sm text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
