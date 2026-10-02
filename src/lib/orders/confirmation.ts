export type ConfirmationView = 'success' | 'awaiting_transfer' | 'payment_failed' | 'not_found'

// What the confirmation page should show. Webhooks lag behind the redirect,
// so a PENDING order after a successful redirect still counts as success.
export function confirmationView(
  order: { status: string; paymentProvider: string | null } | null,
  redirectStatus: string | undefined
): ConfirmationView {
  if (!order) return 'not_found'
  if (order.status === 'CANCELLED' || redirectStatus === 'failed') return 'payment_failed'
  if (order.status === 'PENDING' && order.paymentProvider === 'bank_transfer') return 'awaiting_transfer'
  return 'success'
}
