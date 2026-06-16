'use client'

import { useState } from 'react'
import { Plus, X, Save, Loader2, Tag, Zap, Trash2 } from 'lucide-react'
import { confirm } from '@/lib/confirm'

interface Promotion {
  id: string
  code: string | null
  name: string
  type: string
  value: number
  minOrderCents: number | null
  maxDiscountCents: number | null
  startsAt: string
  endsAt: string
  isActive: boolean
  isFlashSale: boolean
  usageLimit: number | null
  usageCount: number
  createdAt: string
}

const emptyForm = {
  code: '', name: '', type: 'percentage', value: 10,
  minOrderCents: '', maxDiscountCents: '',
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  isFlashSale: false, usageLimit: '',
}

export default function AdminPromotionsClient({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'flash'>('all')

  const filtered = promotions.filter((p) => {
    if (filter === 'active') return p.isActive
    if (filter === 'flash') return p.isFlashSale
    return true
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: parseInt(String(form.value)),
          minOrderCents: form.minOrderCents ? parseInt(form.minOrderCents) * 100 : null,
          maxDiscountCents: form.maxDiscountCents ? parseInt(form.maxDiscountCents) * 100 : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
          code: form.code || null,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPromotions((p) => [data.promotion, ...p])
        setForm(emptyForm)
        setShowForm(false)
      }
    } catch { /* handled silently */ }
    setLoading(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    setActionLoading(id)
    try {
      await fetch(`/api/promotions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      })
      setPromotions((p) => p.map((q) => q.id === id ? { ...q, isActive: !isActive } : q))
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this promotion?', message: 'Any customers with this code will no longer be able to use it.', danger: true, confirmLabel: 'Delete' })
    if (!ok) return
    setActionLoading(id)
    try {
      await fetch(`/api/promotions?id=${id}`, { method: 'DELETE' })
      setPromotions((p) => p.filter((q) => q.id !== id))
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Promotions</h1>
          <p className="font-body text-warm-gray text-sm mt-1">
            {promotions.filter((p) => p.isActive).length} active · {promotions.filter((p) => p.isFlashSale).length} flash sales
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Promo</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-warm-white border border-sand p-6">
          <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>Create Promotion</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Promo Code (leave blank for auto)</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm font-mono uppercase focus:outline-none focus:border-terracotta" placeholder="WELCOME20" />
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="Summer sale 20% off" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta">
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                  <option value="free_shipping">Free shipping</option>
                  <option value="flash_sale">Flash sale</option>
                </select>
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Value {form.type === 'percentage' ? '(%)' : form.type === 'fixed' ? '($)' : ''}</label>
                <input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Usage Limit</label>
                <input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Min Order ($)</label>
                <input type="number" min={0} value={form.minOrderCents} onChange={(e) => setForm({ ...form, minOrderCents: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="No minimum" />
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Max Discount ($)</label>
                <input type="number" min={0} value={form.maxDiscountCents} onChange={(e) => setForm({ ...form, maxDiscountCents: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" placeholder="No cap" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Start Date *</label>
                <input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">End Date *</label>
                <input type="datetime-local" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="flash" checked={form.isFlashSale} onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })} className="w-4 h-4 accent-terracotta" />
              <label htmlFor="flash" className="font-body text-sm text-charcoal flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-terracotta" /> Flash sale (shows countdown)</label>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-sand">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Promotion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'flash'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-body text-xs uppercase tracking-wider transition-colors ${filter === f ? 'bg-charcoal text-cream' : 'border border-sand text-warm-gray hover:border-charcoal'}`}>
            {f === 'all' ? `All (${promotions.length})` : f === 'active' ? `Active (${promotions.filter((p) => p.isActive).length})` : `Flash (${promotions.filter((p) => p.isFlashSale).length})`}
          </button>
        ))}
      </div>

      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              {['Code', 'Name', 'Type', 'Value', 'Usage', 'Validity', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center font-body text-warm-gray text-sm">No promotions yet.</td></tr>
            ) : filtered.map((promo) => {
              const expired = new Date(promo.endsAt) < now
              return (
                <tr key={promo.id} className="hover:bg-sand/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {promo.isFlashSale && <Zap className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />}
                      <span className="font-body text-charcoal text-sm font-mono">{promo.code || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm">{promo.name}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 font-body text-xs"><Tag className="w-3 h-3" />{promo.type.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm">
                    {promo.type === 'percentage' ? `${promo.value}%` : promo.type === 'fixed' ? `$${(promo.value / 100).toFixed(0)} off` : '—'}
                  </td>
                  <td className="px-4 py-3 font-body text-warm-gray text-sm">
                    {promo.usageCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-warm-gray">
                    {new Date(promo.startsAt).toLocaleDateString()} → {new Date(promo.endsAt).toLocaleDateString()}
                    {expired && <span className="ml-1 text-ember font-medium">Expired</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-body ${promo.isActive && !expired ? 'bg-green-100 text-green-700' : 'bg-sand text-warm-gray'}`}>
                      {promo.isActive && !expired ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => handleToggle(promo.id, promo.isActive)} disabled={actionLoading === promo.id}
                        className="px-2 py-1 border border-sand font-body text-xs hover:bg-sand transition-colors disabled:opacity-50">
                        {promo.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(promo.id)} disabled={actionLoading === promo.id}
                        className="p-1.5 hover:bg-red-50 transition-colors">
                        {actionLoading === promo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
