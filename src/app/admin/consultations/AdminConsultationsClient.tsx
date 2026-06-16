'use client'

import { useState } from 'react'
import { Calendar, User, Video, Phone, MessageSquare, CheckCircle, XCircle, Clock, Loader2, Plus, ChevronDown } from 'lucide-react'

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Consultant {
  id: string
  name: string
  title: string
  isAvailable: boolean
  rating: number
  reviewCount: number
  hourlyRate: number
  _count: { bookings: number; reviews: number }
  availability: Availability[]
}

interface Booking {
  id: string
  scheduledAt: string
  duration: number
  status: string
  type: string
  priceCents: number
  isPaid: boolean
  notes: string | null
  consultant: { name: string }
  customer: { firstName: string; lastName: string; email: string }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const bookingStatusColors: Record<string, string> = {
  pending: 'bg-sand text-mid-gray',
  confirmed: 'bg-terracotta/10 text-terracotta',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  no_show: 'bg-ember/10 text-ember',
}

const typeIcons = {
  video: Video,
  phone: Phone,
  chat: MessageSquare,
}

export default function AdminConsultationsClient({
  consultants: initial,
  bookings: initialBookings,
}: {
  consultants: Consultant[]
  bookings: Booking[]
}) {
  const [consultants, setConsultants] = useState(initial)
  const [bookings, setBookings] = useState(initialBookings)
  const [tab, setTab] = useState<'bookings' | 'consultants'>('bookings')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddConsultant, setShowAddConsultant] = useState(false)
  const [newConsultant, setNewConsultant] = useState({ name: '', title: '', hourlyRate: 100 })

  const filteredBookings = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter)

  const updateBookingStatus = async (id: string, status: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setBookings((b) => b.map((q) => q.id === id ? { ...q, status } : q))
      }
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const toggleConsultantAvailability = async (id: string, isAvailable: boolean) => {
    setActionLoading(id)
    try {
      await fetch(`/api/consultants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })
      setConsultants((c) => c.map((q) => q.id === id ? { ...q, isAvailable: !isAvailable } : q))
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  const addConsultant = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading('new')
    try {
      const res = await fetch('/api/consultants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newConsultant, hourlyRate: newConsultant.hourlyRate * 100 }),
      })
      if (res.ok) {
        const data = await res.json()
        setConsultants((c) => [{ ...data.consultant, _count: { bookings: 0, reviews: 0 }, availability: [] }, ...c])
        setNewConsultant({ name: '', title: '', hourlyRate: 100 })
        setShowAddConsultant(false)
      }
    } catch { /* handled silently */ }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
          Consultations
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {bookings.filter((b) => b.status === 'pending').length} pending · {consultants.filter((c) => c.isAvailable).length} consultants available
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-sand">
        {(['bookings', 'consultants'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-body text-sm uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-terracotta text-terracotta' : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            {t === 'bookings' ? `Bookings (${bookings.length})` : `Consultants (${consultants.length})`}
          </button>
        ))}
      </div>

      {/* BOOKINGS TAB */}
      {tab === 'bookings' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 font-body text-xs uppercase tracking-wider transition-colors ${
                  statusFilter === s ? 'bg-charcoal text-cream' : 'border border-sand text-warm-gray hover:border-charcoal'
                }`}>
                {s === 'all' ? `All (${bookings.length})` : `${s.replace('_', ' ')} (${bookings.filter((b) => b.status === s).length})`}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-warm-white border border-sand p-12 text-center">
              <Calendar className="w-12 h-12 text-sand mx-auto mb-3" />
              <p className="font-body text-warm-gray">No bookings in this status.</p>
            </div>
          ) : (
            <div className="bg-warm-white border border-sand overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sand bg-sand/20">
                    {['Customer', 'Consultant', 'Date & Time', 'Type', 'Duration', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {filteredBookings.map((booking) => {
                    const Icon = typeIcons[booking.type as keyof typeof typeIcons] || Video
                    return (
                      <tr key={booking.id} className="hover:bg-sand/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-body text-charcoal text-sm">{booking.customer.firstName} {booking.customer.lastName}</p>
                          <p className="font-body text-warm-gray text-xs">{booking.customer.email}</p>
                        </td>
                        <td className="px-4 py-3 font-body text-warm-gray text-sm">{booking.consultant.name}</td>
                        <td className="px-4 py-3">
                          <p className="font-body text-charcoal text-sm">{new Date(booking.scheduledAt).toLocaleDateString()}</p>
                          <p className="font-body text-warm-gray text-xs">{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-body text-xs text-warm-gray">
                            <Icon className="w-3.5 h-3.5" />{booking.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-body text-warm-gray text-sm">{booking.duration}min</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-body ${bookingStatusColors[booking.status] || 'bg-sand text-mid-gray'}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {booking.status === 'pending' && (
                              <>
                                <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} disabled={actionLoading === booking.id}
                                  className="p-1.5 hover:bg-green-50 transition-colors" title="Confirm">
                                  {actionLoading === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                                </button>
                                <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} disabled={actionLoading === booking.id}
                                  className="p-1.5 hover:bg-red-50 transition-colors" title="Cancel">
                                  <XCircle className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button onClick={() => updateBookingStatus(booking.id, 'completed')} disabled={actionLoading === booking.id}
                                className="px-2 py-1 border border-sand font-body text-xs hover:bg-sand transition-colors">
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CONSULTANTS TAB */}
      {tab === 'consultants' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowAddConsultant(!showAddConsultant)}
              className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors">
              <Plus className="w-4 h-4" /> Add Consultant
            </button>
          </div>

          {showAddConsultant && (
            <div className="bg-warm-white border border-sand p-6">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>New Consultant</h2>
              <form onSubmit={addConsultant} className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Name *</label>
                  <input required value={newConsultant.name} onChange={(e) => setNewConsultant({ ...newConsultant, name: e.target.value })}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                </div>
                <div>
                  <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Title *</label>
                  <input required value={newConsultant.title} onChange={(e) => setNewConsultant({ ...newConsultant, title: e.target.value })}
                    placeholder="Sexual Wellness Expert"
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                </div>
                <div>
                  <label className="block font-body text-charcoal text-xs uppercase tracking-wider mb-1">Hourly Rate ($)</label>
                  <input type="number" min={1} value={newConsultant.hourlyRate} onChange={(e) => setNewConsultant({ ...newConsultant, hourlyRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta" />
                </div>
                <div className="col-span-3 flex justify-end gap-3 pt-2 border-t border-sand">
                  <button type="button" onClick={() => setShowAddConsultant(false)} className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal">Cancel</button>
                  <button type="submit" disabled={actionLoading === 'new'}
                    className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light disabled:opacity-50">
                    {actionLoading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-4">
            {consultants.length === 0 ? (
              <div className="bg-warm-white border border-sand p-12 text-center">
                <User className="w-12 h-12 text-sand mx-auto mb-3" />
                <p className="font-body text-warm-gray">No consultants yet.</p>
              </div>
            ) : consultants.map((c) => (
              <div key={c.id} className="bg-warm-white border border-sand p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>{c.name}</h3>
                      <span className={`px-2 py-0.5 text-[0.6rem] font-body uppercase tracking-widest ${c.isAvailable ? 'bg-green-100 text-green-700' : 'bg-sand text-warm-gray'}`}>
                        {c.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="font-body text-warm-gray text-sm mb-2">{c.title}</p>
                    <div className="flex items-center gap-4 flex-wrap text-xs font-body text-warm-gray">
                      <span>${(c.hourlyRate / 100).toFixed(0)}/hr</span>
                      <span>{c._count.bookings} bookings</span>
                      <span>★ {c.rating.toFixed(1)} ({c._count.reviews} reviews)</span>
                    </div>
                    {c.availability.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {c.availability.map((a) => (
                          <span key={a.id} className={`px-2 py-0.5 text-[0.6rem] font-body border ${a.isAvailable ? 'border-terracotta/30 text-terracotta' : 'border-sand text-warm-gray line-through'}`}>
                            {DAYS[a.dayOfWeek]} {a.startTime}–{a.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleConsultantAvailability(c.id, c.isAvailable)} disabled={actionLoading === c.id}
                      className="px-3 py-2 border border-sand font-body text-xs uppercase tracking-wider hover:bg-sand transition-colors disabled:opacity-50">
                      {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : c.isAvailable ? 'Set Unavailable' : 'Set Available'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
