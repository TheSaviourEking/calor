interface OrderOwner {
  customerId: string | null
  guestEmail: string | null
}

interface OrderViewer {
  customerId?: string | null
  guestEmail?: string | null
}

// One rule for "may this caller act on this order", shared by every payment route.
// A customer order is only open to that customer's session. A guest order is
// only open to someone who knows the email it was placed with.
export function canAccessOrder(order: OrderOwner, viewer: OrderViewer): boolean {
  if (order.customerId) {
    return !!viewer.customerId && viewer.customerId === order.customerId
  }

  if (!order.guestEmail || !viewer.guestEmail) return false

  return order.guestEmail.trim().toLowerCase() === viewer.guestEmail.trim().toLowerCase()
}
