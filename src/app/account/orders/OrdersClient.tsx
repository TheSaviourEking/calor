'use client'

import { useState } from 'react'
import { Package, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  name: string
  quantity: number
  priceCents: number
  product: { isDigital: boolean } | null
}

interface Order {
  id: string
  reference: string
  status: string
  totalCents: number
  createdAt: string
  items: OrderItem[]
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-sand text-warm-gray',
  PAYMENT_RECEIVED: 'bg-terracotta/10 text-terracotta',
  PROCESSING: 'bg-cream text-charcoal border border-sand',
  SHIPPED: 'bg-gold/20 text-gold',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-ember/10 text-ember',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

const CANCELLABLE = ['PENDING', 'PAYMENT_RECEIVED']

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const handleCancel = async (orderId: string, reference: string) => {
    if (!confirm(`Cancel order ${reference}? This cannot be undone.`)) return
    setCancelling(orderId)
    try {
      const res = await fetch(`/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'CANCELLED' }),
      })
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
      } else {
        alert('Could not cancel this order. Please contact support if you need assistance.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setCancelling(null)
  }

  return (
    <>
      <h1
        className="font-display text-charcoal mb-2"
        style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
      >
        Order History
      </h1>
      <p className="font-body text-warm-gray mb-8">View, track, and manage your orders</p>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-warm-white border border-sand">
          <Package className="w-12 h-12 text-warm-gray mx-auto mb-4" />
          <p className="font-body text-warm-gray">No orders yet.</p>
          <Link href="/shop" className="font-body text-terracotta text-sm hover:underline mt-4 inline-block">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = CANCELLABLE.includes(order.status)
            const hasDigital = order.items.some((i) => i.product?.isDigital)
            return (
              <div key={order.id} className="bg-warm-white p-6 border border-sand">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                      {order.reference}
                    </p>
                    <p className="font-body text-warm-gray text-sm">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-charcoal">{formatPrice(order.totalCents)}</p>
                    <p className="font-body text-warm-gray text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-body uppercase tracking-wider ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>

                  <div className="flex items-center gap-3">
                    {hasDigital && order.status === 'DELIVERED' && (
                      <Link
                        href="/account/digital"
                        className="font-body text-terracotta text-sm hover:underline"
                      >
                        Access Downloads
                      </Link>
                    )}
                    <Link
                      href={`/order/${order.reference}`}
                      className="font-body text-terracotta text-sm hover:underline"
                    >
                      View Details
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order.id, order.reference)}
                        disabled={cancelling === order.id}
                        className="inline-flex items-center gap-1.5 font-body text-xs text-ember hover:text-ember/80 transition-colors disabled:opacity-50"
                      >
                        {cancelling === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
