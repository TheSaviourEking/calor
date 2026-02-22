import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'
import Link from 'next/link'

export default async function OrdersPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/account')
  }

  const orders = await db.order.findMany({
    where: { customerId: session.customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
    },
  })

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-sand text-mid-gray',
    PAYMENT_RECEIVED: 'bg-terracotta/10 text-terracotta',
    PROCESSING: 'bg-cream text-charcoal',
    SHIPPED: 'bg-gold/20 text-gold',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-ember/10 text-ember',
    REFUNDED: 'bg-gray-100 text-gray-700',
  }

  return (
    <>
      <h1 
        className="font-display text-charcoal mb-2"
        style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
      >
        Order History
      </h1>
      <p className="font-body text-warm-gray mb-8">View and track your orders</p>

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
          {orders.map((order) => (
            <div key={order.id} className="bg-warm-white p-6 border border-sand">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                    {order.reference}
                  </p>
                  <p className="font-body text-warm-gray text-sm">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-charcoal">
                    {formatPrice(order.totalCents)}
                  </p>
                  <p className="font-body text-warm-gray text-sm">{order.items.length} items</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-body uppercase tracking-wider ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status.replace('_', ' ')}
                </span>
                <Link 
                  href={`/order/${order.reference}`}
                  className="font-body text-terracotta text-sm hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
