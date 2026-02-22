'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  ArrowLeft, Package, RefreshCw, Check, Clock, AlertCircle, 
  Loader2, ChevronRight, Shield, Heart, Truck
} from 'lucide-react'
import { toast } from 'sonner'

interface Order {
  id: string
  reference: string
  status: string
  createdAt: string
  totalCents: number
  items: Array<{
    id: string
    name: string
    quantity: number
    priceCents: number
    product?: {
      id: string
      name: string
      images: Array<{ url: string }>
    }
  }>
}

interface ReturnRequest {
  id: string
  status: string
  reason: string
  reasonDetails?: string
  refundMethod: string
  refundAmount: number
  trackingNumber?: string
  createdAt: string
  order: {
    reference: string
  }
  items: Array<{
    id: string
    quantity: number
    condition: string
  }>
}

const returnReasons = [
  { value: 'defective', label: 'Product is defective' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'better_price', label: 'Found better price' },
  { value: 'other', label: 'Other reason' }
]

const refundMethods = [
  { value: 'original', label: 'Original payment method', description: 'Refund to your original payment method' },
  { value: 'store_credit', label: 'Store credit', description: 'Get 10% bonus with store credit' },
  { value: 'exchange', label: 'Exchange', description: 'Exchange for a different item' }
]

function ReturnsContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [reason, setReason] = useState('')
  const [reasonDetails, setReasonDetails] = useState('')
  const [refundMethod, setRefundMethod] = useState('original')
  const [selectedItems, setSelectedItems] = useState<Array<{ orderItemId: string; quantity: number; condition: string }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/returns')
      ])
      
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders || [])
      }
      
      if (returnsRes.ok) {
        const data = await returnsRes.json()
        setReturns(data.returns || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order)
    setSelectedItems(order.items.map(item => ({
      orderItemId: item.id,
      quantity: item.quantity,
      condition: 'unopened'
    })))
    setStep('form')
  }

  const handleItemQuantityChange = (orderItemId: string, quantity: number) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.orderItemId === orderItemId ? { ...item, quantity } : item
      ).filter(item => item.quantity > 0)
    )
  }

  const handleSubmit = async () => {
    if (!selectedOrder || !reason || selectedItems.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reason,
          reasonDetails,
          refundMethod,
          items: selectedItems
        })
      })

      const data = await res.json()
      if (data.success) {
        setStep('success')
        toast.success('Return request submitted!')
      } else {
        toast.error(data.error || 'Failed to submit return')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-terracotta',
      approved: 'text-charcoal',
      received: 'text-charcoal',
      processing: 'text-charcoal',
      completed: 'text-green-600',
      rejected: 'text-ember'
    }
    return colors[status] || 'text-warm-gray'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, typeof Clock> = {
      pending: Clock,
      approved: Check,
      received: Package,
      processing: RefreshCw,
      completed: Check,
      rejected: AlertCircle
    }
    return icons[status] || Clock
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-warm-white border border-sand p-8 text-center">
            <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-terracotta" />
            </div>
            <h1 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 300 }}>
              Return Request Submitted
            </h1>
            <p className="font-body text-warm-gray mb-6">
              Your return request has been received. We'll review it and respond within 1-2 business days.
              You'll receive an email with instructions on how to proceed.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  setStep('select')
                  setSelectedOrder(null)
                }}
                className="border border-charcoal text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
              >
                Submit Another Return
              </button>
              <Link href="/account/orders">
                <span className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors inline-block">
                  View Orders
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back Link */}
        <Link 
          href="/account/orders"
          className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-8 hover:text-terracotta"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        {/* Header */}
        <h1 
          className="font-display text-charcoal mb-4"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
        >
          Returns & Exchanges
        </h1>
        <p className="font-body text-warm-gray mb-12">
          Our satisfaction guarantee ensures you love every purchase. If you're not completely satisfied, 
          we'll make it right.
        </p>

        {/* Guarantee Banner */}
        <div className="bg-warm-white border border-sand p-6 mb-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-terracotta flex-shrink-0" />
              <div>
                <p className="font-body text-charcoal text-sm font-medium">Satisfaction Guaranteed</p>
                <p className="font-body text-warm-gray text-xs">30-day hassle-free returns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-terracotta flex-shrink-0" />
              <div>
                <p className="font-body text-charcoal text-sm font-medium">Discreet Returns</p>
                <p className="font-body text-warm-gray text-xs">No questions asked process</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-terracotta flex-shrink-0" />
              <div>
                <p className="font-body text-charcoal text-sm font-medium">Free Return Shipping</p>
                <p className="font-body text-warm-gray text-xs">On all domestic returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Returns */}
        {returns.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
              Your Return Requests
            </h2>
            <div className="border border-sand divide-y divide-sand">
              {returns.map((ret) => {
                const StatusIcon = getStatusIcon(ret.status)
                return (
                  <div key={ret.id} className="bg-warm-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center ${
                        ret.status === 'completed' ? 'bg-green-100' : 'bg-sand'
                      }`}>
                        <StatusIcon className={`h-5 w-5 ${getStatusColor(ret.status)}`} />
                      </div>
                      <div>
                        <p className="font-body text-charcoal">Order #{ret.order.reference}</p>
                        <p className="font-body text-warm-gray text-xs">
                          {format(new Date(ret.createdAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-body text-sm capitalize ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </p>
                      <p className="font-body text-warm-gray text-xs">
                        ${(ret.refundAmount / 100).toFixed(2)} refund
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 'select' && (
          <div>
            <h2 className="font-display text-charcoal text-xl mb-4" style={{ fontWeight: 400 }}>
              Select an Order to Return
            </h2>
            
            {orders.length === 0 ? (
              <div className="bg-warm-white border border-sand p-8 text-center">
                <p className="font-body text-warm-gray">No orders found.</p>
                <Link 
                  href="/shop"
                  className="mt-4 inline-block bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="border border-sand divide-y divide-sand">
                {orders
                  .filter(o => o.status === 'DELIVERED')
                  .map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className="w-full bg-warm-white p-4 flex items-center justify-between hover:bg-sand/30 transition-colors text-left"
                    >
                      <div>
                        <p className="font-body text-charcoal">Order #{order.reference}</p>
                        <p className="font-body text-warm-gray text-xs">
                          {format(new Date(order.createdAt), 'MMMM d, yyyy')} • {order.items.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-body text-charcoal">
                          ${(order.totalCents / 100).toFixed(2)}
                        </p>
                        <ChevronRight className="h-4 w-4 text-warm-gray" />
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {step === 'form' && selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                Return Items from Order #{selectedOrder.reference}
              </h2>
              <button 
                onClick={() => setStep('select')}
                className="font-body text-warm-gray text-sm hover:text-terracotta"
              >
                Cancel
              </button>
            </div>

            {/* Select Items */}
            <div className="bg-warm-white border border-sand p-6">
              <h3 className="font-body text-charcoal mb-4">Select Items to Return</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => {
                  const selectedItem = selectedItems.find(si => si.orderItemId === item.id)
                  const isSelected = !!selectedItem
                  
                  return (
                    <div 
                      key={item.id}
                      className={`p-4 border ${
                        isSelected ? 'border-terracotta bg-terracotta/5' : 'border-sand'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, {
                                  orderItemId: item.id,
                                  quantity: item.quantity,
                                  condition: 'unopened'
                                }])
                              } else {
                                setSelectedItems(prev => prev.filter(si => si.orderItemId !== item.id))
                              }
                            }}
                            className="w-4 h-4 accent-terracotta"
                          />
                          <div>
                            <p className="font-body text-charcoal text-sm">{item.name}</p>
                            <p className="font-body text-warm-gray text-xs">
                              ${(item.priceCents / 100).toFixed(2)} each
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="font-body text-warm-gray text-xs">Qty:</span>
                            <select
                              value={selectedItem?.quantity || 1}
                              onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                              className="border border-sand px-2 py-1 font-body text-sm bg-warm-white"
                            >
                              {Array.from({ length: item.quantity }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Return Reason */}
            <div className="bg-warm-white border border-sand p-6">
              <h3 className="font-body text-charcoal mb-4">Reason for Return</h3>
              <div className="space-y-2">
                {returnReasons.map((r) => (
                  <label 
                    key={r.value}
                    className={`flex items-center gap-3 p-3 border cursor-pointer ${
                      reason === r.value ? 'border-terracotta bg-terracotta/5' : 'border-sand hover:border-terracotta/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-terracotta"
                    />
                    <span className="font-body text-charcoal text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="font-body text-charcoal text-sm block mb-2">
                  Additional Details (optional)
                </label>
                <textarea
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  placeholder="Tell us more about why you're returning this item..."
                  className="w-full p-3 border border-sand bg-cream font-body text-sm min-h-[80px] focus:outline-none focus:border-terracotta resize-none"
                />
              </div>
            </div>

            {/* Refund Method */}
            <div className="bg-warm-white border border-sand p-6">
              <h3 className="font-body text-charcoal mb-4">Refund Method</h3>
              <div className="space-y-2">
                {refundMethods.map((method) => (
                  <label 
                    key={method.value}
                    className={`flex items-start gap-3 p-4 border cursor-pointer ${
                      refundMethod === method.value ? 'border-terracotta bg-terracotta/5' : 'border-sand hover:border-terracotta/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value={method.value}
                      checked={refundMethod === method.value}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="accent-terracotta mt-1"
                    />
                    <div>
                      <span className="font-body text-charcoal text-sm">{method.label}</span>
                      <p className="font-body text-warm-gray text-xs">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !reason || selectedItems.length === 0}
              className="w-full bg-charcoal text-cream py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReturnsClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    }>
      <ReturnsContent />
    </Suspense>
  )
}
