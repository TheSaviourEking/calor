'use client'

import { useState } from 'react'
import { Gift, Search, Ban, Loader2 } from 'lucide-react'

interface Transaction { id: string; amountCents: number; type: string; createdAt: string }

interface GiftCard {
  id: string
  code: string
  initialValueCents: number
  balanceCents: number
  recipientEmail: string
  recipientName: string | null
  senderName: string | null
  isDelivered: boolean
  isRedeemed: boolean
  isExpired: boolean
  createdAt: string
  expiresAt: string | null
  purchaser: { firstName: string; lastName: string; email: string } | null
  transactions: Transaction[]
}

export default function AdminGiftCardsClient({ initialGiftCards }: { initialGiftCards: GiftCard[] }) {
  const [cards, setCards] = useState(initialGiftCards)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = cards.filter((c) =>
    c.code.includes(search.toUpperCase()) ||
    c.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
    c.purchaser?.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleVoid = async (id: string) => {
    if (!confirm('Void this gift card? The remaining balance will be set to $0.')) return
    setLoading(id)
    try {
      const res = await fetch(`/api/gift-cards`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, balanceCents: 0, isExpired: true }),
      })
      if (res.ok) {
        setCards((c) => c.map((g) => g.id === id ? { ...g, balanceCents: 0, isExpired: true } : g))
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const status = (c: GiftCard) => {
    if (c.isExpired) return { label: 'Voided/Expired', cls: 'bg-red-50 text-red-600' }
    if (c.isRedeemed || c.balanceCents === 0) return { label: 'Fully Used', cls: 'bg-sand text-warm-gray' }
    if (!c.isDelivered) return { label: 'Pending Delivery', cls: 'bg-gold/10 text-gold' }
    return { label: 'Active', cls: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Gift Cards</h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {cards.filter((c) => !c.isExpired && c.balanceCents > 0).length} active ·
          Total outstanding: ${(cards.reduce((s, c) => s + (c.isExpired ? 0 : c.balanceCents), 0) / 100).toFixed(2)}
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or email..."
          className="w-full pl-10 pr-4 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta" />
      </div>

      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              {['Code', 'Recipient', 'Purchaser', 'Balance', 'Issued', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center">
                <Gift className="w-10 h-10 text-sand mx-auto mb-2" />
                <p className="font-body text-warm-gray text-sm">No gift cards found.</p>
              </td></tr>
            ) : filtered.map((card) => {
              const s = status(card)
              return (
                <>
                  <tr key={card.id} className="hover:bg-sand/10 transition-colors cursor-pointer" onClick={() => setExpanded(expanded === card.id ? null : card.id)}>
                    <td className="px-4 py-3 font-body text-charcoal text-sm font-mono">{card.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-charcoal text-sm">{card.recipientName || '—'}</p>
                      <p className="font-body text-warm-gray text-xs">{card.recipientEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-warm-gray text-xs">{card.purchaser?.email || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-charcoal text-sm">${(card.balanceCents / 100).toFixed(2)}</p>
                      <p className="font-body text-warm-gray text-xs">of ${(card.initialValueCents / 100).toFixed(2)}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-warm-gray text-xs">{new Date(card.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-body ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {!card.isExpired && card.balanceCents > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleVoid(card.id) }} disabled={loading === card.id}
                          className="p-1.5 hover:bg-red-50 transition-colors" title="Void card">
                          {loading === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 text-red-500" />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === card.id && card.transactions.length > 0 && (
                    <tr key={`${card.id}-exp`}>
                      <td colSpan={7} className="px-4 pb-3 bg-cream/40 border-b border-sand">
                        <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-2">Transaction History</p>
                        <div className="space-y-1">
                          {card.transactions.map((t) => (
                            <div key={t.id} className="flex items-center gap-4 font-body text-xs">
                              <span className="text-warm-gray">{new Date(t.createdAt).toLocaleDateString()}</span>
                              <span className={`font-medium ${t.amountCents < 0 ? 'text-green-700' : 'text-charcoal'}`}>
                                {t.amountCents < 0 ? `+$${(Math.abs(t.amountCents) / 100).toFixed(2)} refund` : `-$${(t.amountCents / 100).toFixed(2)}`}
                              </span>
                              <span className="text-warm-gray">{t.type}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
