'use client'

import { useState } from 'react'
import { RefreshCw, Pause, X, ChevronDown, Loader2, Search } from 'lucide-react'

interface Plan { id: string; name: string; priceCents: number; interval: string }

interface Subscription {
  id: string
  status: string
  startDate: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  stripeSubscriptionId: string | null
  plan: { id: string; name: string; priceCents: number; interval: string }
  customer: { firstName: string; lastName: string; email: string }
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gold/10 text-gold',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-sand text-warm-gray',
}

export default function AdminSubscriptionsClient({
  initialSubscriptions,
  plans,
}: {
  initialSubscriptions: Subscription[]
  plans: Plan[]
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')

  const filtered = subscriptions.filter((s) => {
    const matchSearch = s.customer.email.toLowerCase().includes(search.toLowerCase()) ||
      `${s.customer.firstName} ${s.customer.lastName}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchPlan = planFilter === 'all' || s.plan.id === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  const updateSub = async (id: string, action: 'cancel' | 'pause' | 'resume') => {
    if (action === 'cancel' && !confirm('Cancel this subscription at period end?')) return
    setLoading(id)
    try {
      const statusMap = { cancel: 'cancelled', pause: 'paused', resume: 'active' }
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: statusMap[action], cancelAtPeriodEnd: action === 'cancel' }),
      })
      if (res.ok) {
        setSubscriptions((s) => s.map((q) => q.id === id ? {
          ...q,
          status: statusMap[action],
          cancelAtPeriodEnd: action === 'cancel',
        } : q))
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Subscriptions</h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {subscriptions.filter((s) => s.status === 'active').length} active ·
          MRR: ${(subscriptions.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.plan.priceCents, 0) / 100).toFixed(0)}/mo
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer..."
            className="pl-9 pr-4 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta">
            <option value="all">All Statuses</option>
            {['active', 'paused', 'cancelled', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative">
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta">
            <option value="all">All Plans</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
        </div>
      </div>

      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              {['Customer', 'Plan', 'Status', 'Period End', 'MRR', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center font-body text-warm-gray text-sm">No subscriptions found.</td></tr>
            ) : filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-sand/10 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-body text-charcoal text-sm">{sub.customer.firstName} {sub.customer.lastName}</p>
                  <p className="font-body text-warm-gray text-xs">{sub.customer.email}</p>
                </td>
                <td className="px-4 py-3 font-body text-warm-gray text-sm">{sub.plan.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-body ${statusColors[sub.status] || 'bg-sand text-warm-gray'}`}>
                    {sub.status}
                    {sub.cancelAtPeriodEnd && <span className="ml-1 opacity-60">(ends)</span>}
                  </span>
                </td>
                <td className="px-4 py-3 font-body text-warm-gray text-sm">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-body text-charcoal text-sm">
                  ${(sub.plan.priceCents / 100).toFixed(0)}/{sub.plan.interval.slice(0, 2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
                      <>
                        <button onClick={() => updateSub(sub.id, 'pause')} disabled={loading === sub.id}
                          className="p-1.5 hover:bg-sand transition-colors" title="Pause">
                          {loading === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4 text-warm-gray" />}
                        </button>
                        <button onClick={() => updateSub(sub.id, 'cancel')} disabled={loading === sub.id}
                          className="p-1.5 hover:bg-red-50 transition-colors" title="Cancel">
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                    {(sub.status === 'paused' || sub.cancelAtPeriodEnd) && (
                      <button onClick={() => updateSub(sub.id, 'resume')} disabled={loading === sub.id}
                        className="px-2 py-1 border border-sand font-body text-xs hover:bg-sand transition-colors flex items-center gap-1">
                        {loading === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Resume
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
