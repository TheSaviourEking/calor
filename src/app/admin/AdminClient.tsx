'use client'

import { 
  Package, ShoppingBag, Users, DollarSign, AlertTriangle,
  CheckCircle, Clock, XCircle
} from 'lucide-react'

interface Stats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  revenue: number
}

interface RecentOrder {
  id: string
  reference: string
  status: string
  total: number
  createdAt: string
  customer: { name: string; email: string } | null
}

interface LowStockProduct {
  id: string
  name: string
  slug: string
  inventory: number
  price: number
}

interface AdminDashboardProps {
  stats: Stats
  recentOrders: RecentOrder[]
  lowStockProducts: LowStockProduct[]
}

const statusStyles: Record<string, { icon: React.ReactNode; class: string }> = {
  PENDING: { icon: <Clock className="w-4 h-4" />, class: 'bg-sand text-mid-gray' },
  PAYMENT_RECEIVED: { icon: <CheckCircle className="w-4 h-4" />, class: 'bg-terracotta/10 text-terracotta' },
  PROCESSING: { icon: <Package className="w-4 h-4" />, class: 'bg-cream text-charcoal' },
  SHIPPED: { icon: <ShoppingBag className="w-4 h-4" />, class: 'bg-gold/20 text-gold' },
  DELIVERED: { icon: <CheckCircle className="w-4 h-4" />, class: 'bg-green-100 text-green-700' },
  CANCELLED: { icon: <XCircle className="w-4 h-4" />, class: 'bg-ember/10 text-ember' },
  REFUNDED: { icon: <XCircle className="w-4 h-4" />, class: 'bg-gray-100 text-gray-700' },
}

export default function AdminDashboard({ 
  stats, 
  recentOrders, 
  lowStockProducts 
}: AdminDashboardProps) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-warm-white p-6 border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Products</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
            {stats.totalProducts}
          </p>
        </div>

        <div className="bg-warm-white p-6 border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Orders</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-warm-white p-6 border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Customers</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
            {stats.totalCustomers}
          </p>
        </div>

        <div className="bg-warm-white p-6 border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-terracotta" />
            <span className="font-body text-warm-gray text-sm">Revenue</span>
          </div>
          <p className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
            ${stats.revenue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-warm-white p-6 border border-sand">
          <h2 className="font-display text-charcoal text-xl mb-6" style={{ fontWeight: 400 }}>
            Recent Orders
          </h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-sand last:border-0">
                <div>
                  <p className="font-body text-charcoal text-sm">{order.reference}</p>
                  <p className="font-body text-warm-gray text-xs">
                    {order.customer?.name || 'Guest'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-charcoal text-sm">
                    ${(order.total / 100).toFixed(2)}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-body ${statusStyles[order.status]?.class || 'bg-gray-100 text-gray-700'}`}>
                    {statusStyles[order.status]?.icon}
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-warm-white p-6 border border-sand">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-ember" />
            <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              Low Stock Alert
            </h2>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <p className="font-body text-warm-gray text-sm">All products are well stocked.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-sand last:border-0">
                  <div>
                    <p className="font-body text-charcoal text-sm">{product.name}</p>
                    <p className="font-body text-warm-gray text-xs">
                      ${((product.price || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-body ${
                    product.inventory < 5 
                      ? 'bg-ember/10 text-ember' 
                      : 'bg-gold/10 text-gold'
                  }`}>
                    {product.inventory} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
