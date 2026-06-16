'use client'

import { useState } from 'react'
import { Package, RotateCcw, ChevronDown, Loader2 } from 'lucide-react'

interface ReturnItem {
  id: string
  orderItemId: string
  quantity: number
  reason: string | null
  condition: string
}

interface ReturnRequest {
  id: string
  status: string
  reason: string
  reasonDetails: string | null
  refundMethod: string
  refundAmount: number | null
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  order: { reference: string; totalCents: number; createdAt: string }
  customer: { firstName: string; lastName: string; email: string } | null
  guestEmail: string | null
  items: ReturnItem[]
}

interface Props { returns: ReturnRequest[] }

const statusColors: Record<string, string> = {
  pending: 'bg-sand text-mid-gray',
  approved: 'bg-terracotta/10 text-terracotta',
  received: 'bg-gold/10 text-gold',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}

const allStatuses = ['pending', 'approved', 'received', 'processing', 'completed', 'rejected']

export default function AdminReturnsClient({ returns: initial }: Props) {
  const [returns, setReturns] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = statusFilter === 'all' ? returns : returns.filter((r) => r.status === statusFilter)

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/returns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      })
      if (res.ok) {
        setReturns((prev) => prev.map((r) => r.id === id ? { ...r, status, notes: notes || r.notes } : r))
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
          Return Requests
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {returns.filter((r) => r.status === 'pending').length} pending · {returns.length} total
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...allStatuses].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 font-body text-xs uppercase tracking-wider transition-colors ${
              statusFilter === s
                ? 'bg-charcoal text-cream'
                : 'border border-sand text-warm-gray hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {s === 'all' ? `All (${returns.length})` : `${s} (${returns.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-warm-white border border-sand p-12 text-center">
          <RotateCcw className="w-12 h-12 text-sand mx-auto mb-3" />
          <p className="font-body text-warm-gray">No returns in this status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ret) => (
            <div key={ret.id} className="bg-warm-white border border-sand overflow-hidden">
              {/* Row header */}
              <div className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-body text-charcoal text-sm font-medium">
                      Order #{ret.order.reference}
                    </span>
                    <span className={`px-2 py-0.5 text-[0.6rem] font-body uppercase tracking-widest ${statusColors[ret.status] || 'bg-sand text-mid-gray'}`}>
                      {ret.status}
                    </span>
                    <span className="font-body text-xs text-warm-gray">
                      {ret.customer
                        ? `${ret.customer.firstName} ${ret.customer.lastName} · ${ret.customer.email}`
                        : ret.guestEmail}
                    </span>
                  </div>
                  <p className="font-body text-xs text-warm-gray">
                    Reason: <strong className="text-charcoal">{ret.reason.replace(/_/g, ' ')}</strong>
                    {' · '}Refund method: <strong className="text-charcoal">{ret.refundMethod.replace(/_/g, ' ')}</strong>
                    {ret.refundAmount && ` · $${(ret.refundAmount / 100).toFixed(2)}`}
                    {' · '}{new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={ret.status}
                      onChange={(e) => updateStatus(ret.id, e.target.value)}
                      disabled={loading === ret.id}
                      className="appearance-none pl-3 pr-8 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta disabled:opacity-50 cursor-pointer"
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
                  </div>
                  {loading === ret.id && <Loader2 className="w-4 h-4 animate-spin text-terracotta" />}
                  <button
                    onClick={() => setExpanded(expanded === ret.id ? null : ret.id)}
                    className="px-3 py-2 border border-sand font-body text-xs uppercase tracking-wider hover:bg-sand transition-colors"
                  >
                    {expanded === ret.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === ret.id && (
                <div className="border-t border-sand p-4 bg-cream/40 space-y-4">
                  {ret.reasonDetails && (
                    <div>
                      <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">Customer Notes</p>
                      <p className="font-body text-sm text-charcoal">{ret.reasonDetails}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-2">Return Items ({ret.items.length})</p>
                    <div className="space-y-1">
                      {ret.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 text-sm font-body">
                          <Package className="w-4 h-4 text-warm-gray flex-shrink-0" />
                          <span className="text-charcoal">Qty: {item.quantity}</span>
                          <span className="text-warm-gray">Condition: {item.condition}</span>
                          {item.reason && <span className="text-warm-gray">· {item.reason.replace(/_/g, ' ')}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {ret.trackingNumber && (
                    <div>
                      <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">Return Tracking</p>
                      <p className="font-body text-sm text-charcoal font-mono">{ret.trackingNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">Internal Notes</p>
                    <textarea
                      defaultValue={ret.notes || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (ret.notes || '')) {
                          updateStatus(ret.id, ret.status, e.target.value)
                        }
                      }}
                      rows={2}
                      placeholder="Add internal notes..."
                      className="w-full px-3 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
