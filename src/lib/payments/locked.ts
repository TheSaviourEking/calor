// Thrown when a buyer tries to switch an order away from crypto or bank
// transfer: money may already be on its way through that method.
export class PaymentMethodLockedError extends Error {
  constructor(public readonly lockedTo: 'coinbase' | 'bank_transfer') {
    super(
      lockedTo === 'coinbase'
        ? 'This order is waiting for your crypto payment. To pay another way, go back and place the order again.'
        : 'This order is waiting for your bank transfer. To pay another way, go back and place the order again.'
    )
    this.name = 'PaymentMethodLockedError'
  }
}
