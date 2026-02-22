'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  Package, BarChart3, Loader2, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsData {
  period: string
  dateRange: { start: string; end: string }
  metrics: {
    orders: { total: number; revenue: number; averageValue: number }
    customers: { total: number; new: number }
    products: { total: number; published: number }
    reviews: { pending: number }
    support: { openTickets: number }
    conversion: {
      pageViews: number
      conversionRate: string
      ordersByStatus: Array<{ status: string; count: number }>
    }
  }
  charts: {
    salesByDay: Array<{ date: string; total: number; count: number }>
  }
  recentOrders: Array<{
    id: string
    reference: string
    customer: string
    email: string
    total: number
    status: string
    items: number
    createdAt: string
  }>
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
}

const periods = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' }
]

export default function AnalyticsClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-terracotta',
      PAYMENT_RECEIVED: 'text-charcoal',
      PROCESSING: 'text-charcoal',
      SHIPPED: 'text-blue-600',
      DELIVERED: 'text-green-600',
      CANCELLED: 'text-ember',
      REFUNDED: 'text-warm-gray'
    }
    return colors[status] || 'text-warm-gray'
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <p className="font-body text-warm-gray">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
              Analytics Dashboard
            </h1>
            <p className="font-body text-warm-gray mt-1">
              {format(new Date(data.dateRange.start), 'MMM d, yyyy')} - {format(new Date(data.dateRange.end), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 px-4 py-2 border border-sand font-body text-sm hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-terracotta" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {formatCurrency(data.metrics.orders.revenue)}
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">Total Revenue</p>
          </div>

          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="h-5 w-5 text-terracotta" />
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {data.metrics.orders.total}
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">Total Orders</p>
          </div>

          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-terracotta" />
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {formatCurrency(data.metrics.orders.averageValue)}
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">Average Order Value</p>
          </div>

          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-terracotta" />
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {data.metrics.customers.new}
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">New Customers</p>
          </div>

          <div className="bg-warm-white border border-sand p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-terracotta" />
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {data.metrics.conversion.conversionRate}%
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">Conversion Rate</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-warm-white border border-sand p-4">
            <p className="font-body text-warm-gray text-xs">Total Customers</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {data.metrics.customers.total}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <p className="font-body text-warm-gray text-xs">Published Products</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {data.metrics.products.published} / {data.metrics.products.total}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <p className="font-body text-warm-gray text-xs">Pending Reviews</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {data.metrics.reviews.pending}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <p className="font-body text-warm-gray text-xs">Open Tickets</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {data.metrics.support.openTickets}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-warm-white border border-sand">
            <div className="p-4 border-b border-sand">
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Recent Orders
              </h2>
            </div>
            <div className="divide-y divide-sand max-h-96 overflow-y-auto">
              {data.recentOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-sand/30">
                  <div>
                    <p className="font-body text-charcoal text-sm">#{order.reference}</p>
                    <p className="font-body text-warm-gray text-xs">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-charcoal text-sm">{formatCurrency(order.total)}</p>
                    <p className={`font-body text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
              {data.recentOrders.length === 0 && (
                <div className="p-4 text-center">
                  <p className="font-body text-warm-gray text-sm">No orders in this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-warm-white border border-sand">
            <div className="p-4 border-b border-sand">
              <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Top Selling Products
              </h2>
            </div>
            <div className="divide-y divide-sand max-h-96 overflow-y-auto">
              {data.topProducts.map((product, index) => (
                <div key={product.productId || index} className="p-4 flex items-center justify-between hover:bg-sand/30">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-terracotta w-6">{index + 1}</span>
                    <div>
                      <p className="font-body text-charcoal text-sm">{product.name}</p>
                      <p className="font-body text-warm-gray text-xs">{product.quantity} sold</p>
                    </div>
                  </div>
                  <p className="font-body text-charcoal text-sm">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <div className="p-4 text-center">
                  <p className="font-body text-warm-gray text-sm">No sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="mt-8 bg-warm-white border border-sand">
          <div className="p-4 border-b border-sand">
            <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
              Orders by Status
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {data.metrics.conversion.ordersByStatus.map(item => (
                <div key={item.status} className="text-center p-3 bg-cream border border-sand">
                  <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                    {item.count}
                  </p>
                  <p className={`font-body text-xs ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
