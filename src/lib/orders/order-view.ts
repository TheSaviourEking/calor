import { db } from '@/lib/db'
import { canAccessOrder } from '@/lib/orders/access'

export interface OrderView {
  reference: string
  status: string
  trackingNumber: string | null
  estimatedDelivery: Date | null
  createdAt: Date
  // Set only for the order's owner or an admin; null for everyone else
  full: null | {
    items: { name: string; quantity: number; priceCents: number }[]
    address: {
      line1: string
      line2: string | null
      city: string
      state: string | null
      postcode: string
      country: string
    }
    totalCents: number
    currency: string
    plainPackaging: boolean
  }
}

// The tracking link is shareable, so a stranger gets status only. What is in the
// box and where it is going are read only after the viewer is shown to own it.
export async function getOrderView(
  reference: string,
  viewer: { customerId: string | null; isAdmin: boolean },
): Promise<OrderView | null> {
  const order = await db.order.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      trackingNumber: true,
      estimatedDelivery: true,
      createdAt: true,
      customerId: true,
      guestEmail: true,
    },
  })
  if (!order) return null

  const view: OrderView = {
    reference: order.reference,
    status: order.status,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
    full: null,
  }

  const entitled = viewer.isAdmin || canAccessOrder(order, { customerId: viewer.customerId })
  if (!entitled) return view

  const detail = await db.order.findUnique({
    where: { reference },
    select: {
      items: { select: { name: true, quantity: true, priceCents: true } },
      address: {
        select: { line1: true, line2: true, city: true, state: true, postcode: true, country: true },
      },
      totalCents: true,
      currency: true,
      plainPackaging: true,
    },
  })
  if (!detail) return view

  view.full = {
    items: detail.items,
    address: detail.address,
    totalCents: detail.totalCents,
    currency: detail.currency,
    plainPackaging: detail.plainPackaging,
  }
  return view
}
