'use client'

import { useState } from 'react'
import { Crown, Plus, Save, X, Loader2, Edit, Trash2 } from 'lucide-react'

interface Benefit { id: string; name: string; description: string | null; sortOrder: number }
interface VIPTier {
  id: string; name: string; slug: string; level: number
  minPoints: number; minSpent: number; pointsMultiplier: number
  freeShippingThreshold: number | null; birthdayBonus: number
  earlyAccess: boolean; exclusiveProducts: boolean; prioritySupport: boolean; freeReturns: boolean
  colorHex: string | null; description: string | null; isActive: boolean
  benefits: Benefit[]; _count: { customers: number }
}

export default function AdminVIPClient({ initialTiers }: { initialTiers: VIPTier[] }) {
  const [tiers, setTiers] = useState(initialTiers)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<VIPTier>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [newBenefit, setNewBenefit] = useState<Record<string, string>>({})

  const startEdit = (tier: VIPTier) => {
    setEditForm({ ...tier })
    setEditingId(tier.id)
  }

  const handleSave = async (id: string) => {
    setLoading(id)
    try {
      const res = await fetch('/api/vip/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (res.ok) {
        setTiers((t) => t.map((tier) => tier.id === id ? { ...tier, ...editForm } as VIPTier : tier))
        setEditingId(null)
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const addBenefit = async (tierId: string) => {
    const name = newBenefit[tierId]?.trim()
    if (!name) return
    setLoading(`benefit-${tierId}`)
    try {
      const res = await fetch('/api/vip/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addBenefit', tierId, name }),
      })
      if (res.ok) {
        const data = await res.json()
        setTiers((t) => t.map((tier) => tier.id === tierId
          ? { ...tier, benefits: [...tier.benefits, data.benefit] }
          : tier
        ))
        setNewBenefit((b) => ({ ...b, [tierId]: '' }))
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const removeBenefit = async (tierId: string, benefitId: string) => {
    setLoading(`del-${benefitId}`)
    try {
      await fetch('/api/vip/tiers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeBenefit', benefitId }),
      })
      setTiers((t) => t.map((tier) => tier.id === tierId
        ? { ...tier, benefits: tier.benefits.filter((b) => b.id !== benefitId) }
        : tier
      ))
    } catch { /* handled silently */ }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>VIP Tiers</h1>
        <p className="font-body text-warm-gray text-sm mt-1">{tiers.reduce((s, t) => s + t._count.customers, 0)} total VIP members</p>
      </div>

      <div className="grid gap-6">
        {tiers.map((tier) => {
          const isEditing = editingId === tier.id
          const ef = editForm as VIPTier
          return (
            <div key={tier.id} className="bg-warm-white border border-sand overflow-hidden">
              {/* Tier header */}
              <div className="p-5 border-b border-sand flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: tier.colorHex ? `${tier.colorHex}20` : undefined }}>
                    <Crown className="w-5 h-5" style={{ color: tier.colorHex || '#C4785A' }} />
                  </div>
                  <div>
                    <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>{tier.name}</h2>
                    <p className="font-body text-warm-gray text-xs">{tier._count.customers} members · Level {tier.level}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => handleSave(tier.id)} disabled={loading === tier.id}
                        className="inline-flex items-center gap-1.5 bg-terracotta text-warm-white px-3 py-1.5 font-body text-xs uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50">
                        {loading === tier.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 border border-sand hover:bg-sand transition-colors">
                        <X className="w-4 h-4 text-warm-gray" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(tier)} className="p-1.5 hover:bg-sand transition-colors">
                      <Edit className="w-4 h-4 text-warm-gray" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tier settings */}
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Min Points', key: 'minPoints', type: 'number', val: isEditing ? ef.minPoints : tier.minPoints },
                  { label: 'Min Spend ($)', key: 'minSpent', type: 'number', val: isEditing ? (ef.minSpent || 0) / 100 : tier.minSpent / 100 },
                  { label: 'Points Multiplier', key: 'pointsMultiplier', type: 'number', step: 0.25, val: isEditing ? ef.pointsMultiplier : tier.pointsMultiplier },
                  { label: 'Birthday Bonus (pts)', key: 'birthdayBonus', type: 'number', val: isEditing ? ef.birthdayBonus : tier.birthdayBonus },
                ].map(({ label, key, type, step, val }) => (
                  <div key={key}>
                    <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-1">{label}</p>
                    {isEditing ? (
                      <input type={type} step={step} value={val as number}
                        onChange={(e) => setEditForm({ ...ef, [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                    ) : (
                      <p className="font-body text-charcoal text-sm font-medium">{val}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Boolean perks */}
              <div className="px-5 pb-5 flex flex-wrap gap-2">
                {[
                  { key: 'earlyAccess', label: 'Early Access' },
                  { key: 'exclusiveProducts', label: 'Exclusive Products' },
                  { key: 'prioritySupport', label: 'Priority Support' },
                  { key: 'freeReturns', label: 'Free Returns' },
                ].map(({ key, label }) => {
                  const efAny = ef as unknown as Record<string, unknown>
                  const tierAny = tier as unknown as Record<string, unknown>
                  const active = isEditing ? !!efAny[key] : !!tierAny[key]
                  return (
                    <button key={key}
                      onClick={() => isEditing && setEditForm({ ...ef, [key]: !active })}
                      className={`px-3 py-1 font-body text-xs transition-colors ${active ? 'bg-terracotta/10 text-terracotta border border-terracotta/30' : 'bg-sand/50 text-warm-gray border border-transparent'} ${isEditing ? 'cursor-pointer hover:border-terracotta' : 'cursor-default'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Benefits list */}
              <div className="border-t border-sand p-5">
                <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-3">Benefits ({tier.benefits.length})</p>
                <div className="space-y-2 mb-3">
                  {tier.benefits.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <span className="font-body text-sm text-charcoal">{b.name}</span>
                      <button onClick={() => removeBenefit(tier.id, b.id)} disabled={loading === `del-${b.id}`}
                        className="p-1 hover:bg-red-50 transition-colors flex-shrink-0">
                        {loading === `del-${b.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 text-red-500" />}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newBenefit[tier.id] || ''} onChange={(e) => setNewBenefit((b) => ({ ...b, [tier.id]: e.target.value }))}
                    placeholder="Add benefit..." onKeyDown={(e) => e.key === 'Enter' && addBenefit(tier.id)}
                    className="flex-1 px-3 py-1.5 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                  <button onClick={() => addBenefit(tier.id)} disabled={loading === `benefit-${tier.id}`}
                    className="px-3 py-1.5 bg-terracotta text-warm-white font-body text-xs uppercase hover:bg-terracotta-light disabled:opacity-50 flex items-center gap-1">
                    {loading === `benefit-${tier.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
