import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { Package, Truck, CheckCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getOrderView } from '@/lib/orders/order-view'
import { packagingNotice } from '@/lib/discretion'

interface PageProps {
  params: Promise<{ reference: string }>
}

async function getViewer() {
  const session = await getSession()
  if (!session) return { customerId: null, isAdmin: false }
  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: { isAdmin: true },
  })
  return { customerId: session.customerId, isAdmin: customer?.isAdmin ?? false }
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { reference } = await params
  const order = await getOrderView(reference, await getViewer())

  if (!order) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-charcoal text-2xl mb-4">Order not found</h1>
            <Link href="/account/orders" className="font-body text-terracotta hover:underline">
              View all orders
            </Link>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  const statusSteps = [
    { key: 'PENDING', label: 'Order Placed', icon: Package },
    { key: 'PAYMENT_RECEIVED', label: 'Payment Confirmed', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Processing', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: MapPin },
  ]

  const full = order.full
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 
            className="font-display text-charcoal mb-2"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
          >
            Track Your Order
          </h1>
          <p className="font-body text-warm-gray text-sm mb-8">
            Order #{order.reference}
          </p>
          {order.trackingNumber && (
            <p className="font-body text-warm-gray text-sm mb-8 -mt-6">
              Tracking number: {order.trackingNumber}
            </p>
          )}

          {/* Status Timeline */}
          <div className="bg-warm-white p-8 border border-sand mb-8">
            <div className="flex items-start justify-between relative">
              {/* Progress line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-sand">
                <div 
                  className="h-full bg-terracotta transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>

              {statusSteps.map((step, index) => {
                const Icon = step.icon
                const isComplete = index <= currentStepIndex
                const isCurrent = index === currentStepIndex

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div className={`w-12 h-12 flex items-center justify-center ${
                      isComplete ? 'bg-terracotta text-warm-white' : 'bg-sand text-warm-gray'
                    } ${isCurrent ? 'ring-4 ring-terracotta/20' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`font-body text-xs mt-2 text-center ${
                      isComplete ? 'text-charcoal' : 'text-warm-gray'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Details */}
          {full ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Items */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Order Items
              </h2>
              <div className="space-y-4">
                {full.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-body text-charcoal text-sm">{item.name}</p>
                      <p className="font-body text-warm-gray text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-body text-charcoal text-sm">
                      ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="pt-4 border-t border-sand">
                  <div className="flex justify-between">
                    <p className="font-body text-charcoal">Total</p>
                    <p className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                      ${(full.totalCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Shipping Address
              </h2>
              <p className="font-body text-charcoal text-sm">
                {full.address.line1}
                {full.address.line2 && <><br />{full.address.line2}</>}
                <br />
                {full.address.city}, {full.address.state} {full.address.postcode}
                <br />
                {full.address.country}
              </p>

              {packagingNotice(full.plainPackaging) && (
                <div className="mt-6 p-4 bg-cream">
                  <p className="font-body text-warm-gray text-xs">
                    <strong className="text-charcoal">Discreet Packaging</strong><br />
                    {packagingNotice(full.plainPackaging)}
                  </p>
                </div>
              )}
            </div>
          </div>
          ) : (
          <div className="bg-warm-white p-6 border border-sand">
            <p className="font-body text-warm-gray text-sm">
              <Link
                href={`/account?redirect=${encodeURIComponent(`/order/${order.reference}`)}`}
                className="text-terracotta hover:underline"
                style={{ color: '#A35A3F' }}
              >
                Sign in
              </Link>{' '}
              to see what&apos;s inside and where it&apos;s going.
            </p>
          </div>
          )}
        </div>
      </div>
    </ClientWrapper>
  )
}
