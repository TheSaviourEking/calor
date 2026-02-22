'use client'

import { useState } from 'react'
import { 
  Search, Mail, Shield, ShoppingBag, Award, ChevronDown,
  Eye, Calendar, MapPin
} from 'lucide-react'

interface Order {
  id: string
  totalCents: number
  status: string
  createdAt: string
}

interface LoyaltyAccount {
  id: string
  points: number
  tier: string
  totalEarned: number
}

interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  locale: string
  createdAt: string
  orders: Order[]
  loyaltyAccount: LoyaltyAccount | null
  _count: {
    orders: number
    sessions: number
  }
}

interface AdminCustomersClientProps {
  initialCustomers: Customer[]
}

export default function AdminCustomersClient({ initialCustomers }: AdminCustomersClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalCents, 0)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'vip' && totalSpent >= 50000) ||
      (statusFilter === 'admin' && customer.isAdmin) ||
      (statusFilter === 'new' && new Date(customer.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalCustomers = customers.length
  const vipCustomers = customers.filter(c => c.orders.reduce((s, o) => s + o.totalCents, 0) >= 50000).length
  const adminCount = customers.filter(c => c.isAdmin).length

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const toggleAdmin = async (customerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setCustomers(customers.map(c => 
        c.id === customerId ? { ...c, isAdmin: !currentStatus } : c
      ))

      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer({ ...selectedCustomer, isAdmin: !currentStatus })
      }
    } catch {
      console.error('Failed to update admin status')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-700'
      case 'gold': return 'bg-yellow-100 text-yellow-700'
      case 'silver': return 'bg-gray-100 text-gray-700'
      default: return 'bg-orange-100 text-orange-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
          Customers
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {totalCustomers} customers total
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-warm-white p-4 border border-sand">
          <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">Total</p>
          <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>{totalCustomers}</p>
        </div>
        <div className="bg-warm-white p-4 border border-sand">
          <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">VIP ($500+)</p>
          <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>{vipCustomers}</p>
        </div>
        <div className="bg-warm-white p-4 border border-sand">
          <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">Admins</p>
          <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>{adminCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-warm-white p-4 border border-sand">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
              <option value="all">All Customers</option>
              <option value="vip">VIP ($500+ spent)</option>
              <option value="admin">Admins</option>
              <option value="new">New (30 days)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand bg-sand/20">
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Loyalty</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Orders</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Mail className="w-12 h-12 text-sand mb-2" />
                      <p className="font-body text-warm-gray text-sm">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalCents, 0)
                  const isVip = totalSpent >= 50000
                  
                  return (
                    <tr key={customer.id} className="hover:bg-sand/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-terracotta/20 to-terracotta/40 flex items-center justify-center">
                            <span className="font-display text-charcoal text-sm">
                              {customer.firstName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-body text-charcoal text-sm">
                                {customer.firstName} {customer.lastName}
                              </p>
                              {customer.isAdmin && (
                                <Shield className="w-3 h-3 text-terracotta" />
                              )}
                            </div>
                            <p className="font-body text-warm-gray text-xs">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {customer.loyaltyAccount ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-body ${getTierColor(customer.loyaltyAccount.tier)}`}>
                            <Award className="w-3 h-3" />
                            {customer.loyaltyAccount.tier} ({customer.loyaltyAccount.points} pts)
                          </span>
                        ) : (
                          <span className="font-body text-warm-gray text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-charcoal text-sm">
                          {customer._count.orders}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-body text-sm ${isVip ? 'text-terracotta font-medium' : 'text-charcoal'}`}>
                          {formatPrice(totalSpent)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-warm-gray text-sm">
                          {formatDate(customer.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleAdmin(customer.id, customer.isAdmin)}
                            className={`p-1.5 transition-colors ${
                              customer.isAdmin 
                                ? 'bg-terracotta/10 text-terracotta' 
                                : 'hover:bg-sand text-warm-gray'
                            }`}
                            title={customer.isAdmin ? 'Remove admin' : 'Make admin'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="p-1.5 hover:bg-sand transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-warm-gray" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-warm-white border-b border-sand p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-terracotta/20 to-terracotta/40 flex items-center justify-center">
                  <span className="font-display text-charcoal text-lg">
                    {selectedCustomer.firstName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </h2>
                  <p className="font-body text-warm-gray text-sm">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-sand transition-colors"
              >
                <span className="font-body text-warm-gray text-sm">Close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-sand/20 border border-sand">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-4 h-4 text-warm-gray" />
                    <span className="font-body text-warm-gray text-xs uppercase">Orders</span>
                  </div>
                  <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                    {selectedCustomer._count.orders}
                  </p>
                </div>
                <div className="p-4 bg-sand/20 border border-sand">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-warm-gray" />
                    <span className="font-body text-warm-gray text-xs uppercase">Points</span>
                  </div>
                  <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                    {selectedCustomer.loyaltyAccount?.points || 0}
                  </p>
                </div>
                <div className="p-4 bg-sand/20 border border-sand">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-warm-gray" />
                    <span className="font-body text-warm-gray text-xs uppercase">Locale</span>
                  </div>
                  <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
                    {selectedCustomer.locale}
                  </p>
                </div>
              </div>

              {/* Loyalty Info */}
              {selectedCustomer.loyaltyAccount && (
                <div className="p-4 bg-terracotta/5 border border-terracotta/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-charcoal text-sm font-medium">Loyalty Tier</span>
                    <span className={`px-2 py-1 text-xs font-body ${getTierColor(selectedCustomer.loyaltyAccount.tier)}`}>
                      {selectedCustomer.loyaltyAccount.tier}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-body text-warm-gray text-xs">Total Earned</span>
                      <p className="font-body text-charcoal">{selectedCustomer.loyaltyAccount.totalEarned} pts</p>
                    </div>
                    <div>
                      <span className="font-body text-warm-gray text-xs">Current Balance</span>
                      <p className="font-body text-charcoal">{selectedCustomer.loyaltyAccount.points} pts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Toggle */}
              <div className="flex items-center justify-between p-4 border border-sand">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-warm-gray" />
                  <span className="font-body text-charcoal text-sm">Admin Access</span>
                </div>
                <button
                  onClick={() => toggleAdmin(selectedCustomer.id, selectedCustomer.isAdmin)}
                  className={`px-3 py-1 text-xs font-body uppercase tracking-wider transition-colors ${
                    selectedCustomer.isAdmin
                      ? 'bg-terracotta text-warm-white'
                      : 'bg-sand text-warm-gray hover:bg-terracotta hover:text-warm-white'
                  }`}
                >
                  {selectedCustomer.isAdmin ? 'Admin' : 'Make Admin'}
                </button>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-body text-charcoal text-sm font-medium mb-3">Recent Orders</h3>
                {selectedCustomer.orders.length === 0 ? (
                  <p className="font-body text-warm-gray text-sm">No orders yet</p>
                ) : (
                  <div className="border border-sand divide-y divide-sand">
                    {selectedCustomer.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-body text-charcoal text-sm">
                            {formatPrice(order.totalCents)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-warm-gray" />
                            <span className="font-body text-warm-gray text-xs">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-body ${
                          order.status === 'DELIVERED' 
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="pt-4 border-t border-sand">
                <p className="font-body text-warm-gray text-xs">
                  Customer since {formatDate(selectedCustomer.createdAt)}
                </p>
                <p className="font-body text-warm-gray text-xs">
                  {selectedCustomer._count.sessions} active sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
