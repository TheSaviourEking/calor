import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ ref?: string; order_id?: string }>
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const { ref, order_id } = await searchParams

  // If we have a reference or order_id, try to fetch the order
  let order = null
  if (ref) {
    order = await db.order.findUnique({
      where: { reference: ref },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    })
  } else if (order_id) {
    order = await db.order.findUnique({
      where: { id: order_id },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    })
  }

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-16 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-terracotta/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-terracotta" />
          </div>

          {/* Headline */}
          <h1 
            className="font-display text-charcoal mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
          >
            Your warmth is on its way.
          </h1>

          <p className="font-body text-warm-gray text-base mb-8 max-w-md mx-auto">
            Thank you for your order. We&apos;ll send you an email confirmation shortly.
          </p>

          {/* Order Details */}
          <div className="bg-warm-white p-8 border border-sand mb-8">
            <div className="grid grid-cols-2 gap-6 text-left">
              <div>
                <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">Order Number</p>
                <p className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                  {order?.reference || ref || 'Processing...'}
                </p>
              </div>
              <div>
                <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">Estimated Delivery</p>
                <p className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                  {order?.estimatedDelivery 
                    ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    : estimatedDelivery
                  }
                </p>
              </div>
            </div>

            {/* Order Items */}
            {order && order.items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-sand">
                <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-3">Order Items</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-body text-charcoal">{item.name} x{item.quantity}</span>
                      <span className="font-body text-warm-gray">${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-sand mt-2">
                    <span className="font-body text-charcoal">Total</span>
                    <span className="font-display text-charcoal">${(order.totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discreet Shipping Notice */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Package className="w-5 h-5 text-terracotta" />
            <p className="font-body text-warm-gray text-sm">
              Your order will arrive in plain, unmarked packaging.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="bg-charcoal text-cream px-8 py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta"
            >
              Continue Shopping
            </Link>
            {order && (
              <Link
                href={`/order/${order.reference}`}
                className="border border-charcoal text-charcoal px-8 py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-charcoal hover:text-cream"
              >
                View Order Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}
