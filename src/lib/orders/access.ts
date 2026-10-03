interface OrderOwner {
  customerId: string | null
  guestEmail: string | null
}

interface OrderViewer {
  customerId?: unknown
  guestEmail?: unknown
}

// One rule for "may this caller act on this order", shared by every payment route.
// A customer order is only open to that customer's session. A guest order is
// only open to someone who knows the email it was placed with.
export function canAccessOrder(order: OrderOwner, viewer: OrderViewer): boolean {
  if (order.customerId) {
    return typeof viewer.customerId === 'string' && viewer.customerId === order.customerId
  }

  // Request bodies are untyped: anything that is not a string counts as absent
  if (!order.guestEmail || typeof viewer.guestEmail !== 'string') return false

  const supplied = viewer.guestEmail.trim().toLowerCase()
  if (!supplied) return false

  return order.guestEmail.trim().toLowerCase() === supplied
}
