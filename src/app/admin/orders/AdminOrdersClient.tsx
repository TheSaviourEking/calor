'use client'

import { useState } from 'react'
import { 
  Search, Package, Truck, CheckCircle, XCircle, Clock,
  ChevronDown, Eye, Loader2, AlertCircle, CreditCard
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  priceCents: number
  quantity: number
  product: {
    id: string
    name: string
    slug: string
  }
}

interface Address {
  id: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postcode: string
  country: string
}

interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface Order {
  id: string
  reference: string
  customerId: string | null
  customer: Customer | null
  guestEmail: string | null
  address: Address
  items: OrderItem[]
  status: string
  paymentMethod: string
  paymentProvider: string | null
  paymentRef: string | null
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
  isGift: boolean
  giftMessage: string | null
  trackingNumber: string | null
  createdAt: string
}

interface AdminOrdersClientProps {
  initialOrders: Order[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PAYMENT_RECEIVED: { label: 'Paid', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: XCircle },
}

export default function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.firstName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Status counts
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          trackingNumber: newStatus === 'SHIPPED' ? trackingNumber : undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to update order')

      const data = await response.json()
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...data.order } : o))
      setSuccess(`Order status updated to ${newStatus}`)
      setTimeout(() => setSuccess(null), 3000)
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch {
      setError('Failed to update order status')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
          Orders
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {orders.length} orders total
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="font-body text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="font-body text-sm">{success}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`p-3 border transition-colors ${
              statusFilter === status 
                ? 'border-terracotta bg-terracotta/5' 
                : 'border-sand bg-warm-white hover:border-terracotta/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <config.icon className="w-4 h-4 text-terracotta" />
              <span className={`font-body text-xs ${config.color} px-1.5 py-0.5`}>
                {statusCounts[status] || 0}
              </span>
            </div>
            <p className="font-body text-warm-gray text-xs">{config.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-warm-white p-4 border border-sand">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              placeholder="Search by reference, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none"
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand bg-sand/20">
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Items</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Payment</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-sand mb-2" />
                      <p className="font-body text-warm-gray text-sm">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const config = statusConfig[order.status] || statusConfig.PENDING
                  const StatusIcon = config.icon
                  
                  return (
                    <tr key={order.id} className="hover:bg-sand/10 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-body text-charcoal text-sm font-medium">
                          {order.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-body text-charcoal text-sm">
                            {order.customer 
                              ? `${order.customer.firstName} ${order.customer.lastName}`
                              : 'Guest'}
                          </p>
                          <p className="font-body text-warm-gray text-xs">
                            {order.customer?.email || order.guestEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-warm-gray text-sm">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-charcoal text-sm font-medium">
                          {formatPrice(order.totalCents)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-body text-charcoal text-sm capitalize">
                            {order.paymentMethod}
                          </p>
                          <p className="font-body text-warm-gray text-xs">
                            {order.paymentProvider || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-body ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-warm-gray text-sm">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 hover:bg-sand transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-warm-gray" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-warm-white border-b border-sand p-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                  Order {selectedOrder.reference}
                </h2>
                <p className="font-body text-warm-gray text-sm">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-sand transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Status Update */}
              <div className="p-4 bg-sand/20 border border-sand">
                <h3 className="font-body text-charcoal text-sm font-medium mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const StatusIcon = config.icon
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                        disabled={isUpdating || selectedOrder.status === status}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-body border transition-colors ${
                          selectedOrder.status === status
                            ? `${config.color} border-current`
                            : 'border-sand hover:border-terracotta'
                        } disabled:opacity-50`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
                
                {selectedOrder.status === 'PROCESSING' && (
                  <div className="mt-4 pt-4 border-t border-sand">
                    <label className="block font-body text-charcoal text-sm mb-2">
                      Add Tracking Number (to mark as shipped)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number..."
                        className="flex-1 px-3 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      />
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'SHIPPED')}
                        disabled={isUpdating || !trackingNumber}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-terracotta text-warm-white font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                        Ship
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-body text-charcoal text-sm font-medium mb-2">Customer</h3>
                <div className="bg-warm-white p-4 border border-sand">
                  <p className="font-body text-charcoal text-sm">
                    {selectedOrder.customer 
                      ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`
                      : 'Guest Checkout'}
                  </p>
                  <p className="font-body text-warm-gray text-sm">
                    {selectedOrder.customer?.email || selectedOrder.guestEmail}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-body text-charcoal text-sm font-medium mb-2">Shipping Address</h3>
                <div className="bg-warm-white p-4 border border-sand">
                  <p className="font-body text-charcoal text-sm">
                    {selectedOrder.address.line1}
                    {selectedOrder.address.line2 && <><br />{selectedOrder.address.line2}</>}
                  </p>
                  <p className="font-body text-warm-gray text-sm">
                    {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postcode}
                  </p>
                  <p className="font-body text-warm-gray text-sm">
                    {selectedOrder.address.country}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-body text-charcoal text-sm font-medium mb-2">Items</h3>
                <div className="bg-warm-white border border-sand divide-y divide-sand">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-body text-charcoal text-sm">{item.name}</p>
                        <p className="font-body text-warm-gray text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-charcoal text-sm">
                        {formatPrice(item.priceCents * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-warm-white p-4 border border-sand">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-warm-gray text-sm">Subtotal</span>
                    <span className="font-body text-charcoal text-sm">{formatPrice(selectedOrder.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-body text-warm-gray text-sm">Shipping</span>
                    <span className="font-body text-charcoal text-sm">
                      {selectedOrder.shippingCents === 0 ? 'Free' : formatPrice(selectedOrder.shippingCents)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-sand">
                    <span className="font-display text-charcoal" style={{ fontWeight: 400 }}>Total</span>
                    <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                      {formatPrice(selectedOrder.totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gift Info */}
              {selectedOrder.isGift && (
                <div className="p-4 bg-terracotta/10 border border-terracotta/20">
                  <p className="font-body text-terracotta text-sm font-medium mb-1">Gift Order</p>
                  {selectedOrder.giftMessage && (
                    <p className="font-body text-warm-gray text-sm italic">
                      &quot;{selectedOrder.giftMessage}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Tracking */}
              {selectedOrder.trackingNumber && (
                <div className="p-4 bg-green-50 border border-green-200">
                  <p className="font-body text-green-700 text-sm">
                    Tracking: {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
