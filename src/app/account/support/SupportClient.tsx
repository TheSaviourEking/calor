'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  MessageSquare, Plus, Clock, AlertCircle, CheckCircle,
  Loader2, Send, ChevronRight, X
} from 'lucide-react'
import { toast } from 'sonner'

export interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    slug: string
  } | null
  messages: Array<{
    createdAt: string
    senderType: string
  }>
  _count: {
    messages: number
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  iconName: string | null
}

export interface Order {
  id: string
  reference: string
  createdAt: string
}

interface SupportClientProps {
  initialTickets: Ticket[]
  initialCategories: Category[]
  initialOrders: Order[]
}

const statusColors: Record<string, string> = {
  open: 'bg-terracotta/10 text-terracotta border-terracotta',
  in_progress: 'bg-charcoal/10 text-charcoal border-charcoal',
  waiting_customer: 'bg-yellow-100 text-yellow-700 border-yellow-500',
  waiting_third_party: 'bg-blue-100 text-blue-700 border-blue-500',
  resolved: 'bg-green-100 text-green-700 border-green-500',
  closed: 'bg-warm-gray/20 text-warm-gray border-warm-gray'
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_customer: 'Waiting for You',
  waiting_third_party: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed'
}

const priorityColors: Record<string, string> = {
  low: 'text-warm-gray',
  normal: 'text-charcoal',
  high: 'text-terracotta',
  urgent: 'text-red-600'
}

export default function SupportClient({ initialTickets, initialCategories, initialOrders }: SupportClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [categories] = useState<Category[]>(initialCategories)
  const [orders] = useState<Order[]>(initialOrders)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [subject, setSubject] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [orderId, setOrderId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          categoryId: categoryId || null,
          message: message.trim(),
          priority,
          orderId: orderId || null
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Ticket created successfully')
        setShowCreateForm(false)
        setSubject('')
        setCategoryId('')
        setMessage('')
        setPriority('normal')
        setOrderId('')
        window.location.reload() // Just reload to get newest tickets
      } else {
        toast.error(data.error || 'Failed to create ticket')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link href="/account" className="font-body text-warm-gray hover:text-terracotta">
              Account
            </Link>
            <span className="text-sand">/</span>
            <span className="font-body text-charcoal">Support</span>
          </nav>
          <h1
            className="font-display text-charcoal text-3xl"
            style={{ fontWeight: 300 }}
          >
            Support Tickets
          </h1>
          <p className="font-body text-warm-gray mt-2">
            Get help with orders, products, and your account
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="hidden md:flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Mobile New Ticket Button */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="md:hidden w-full flex items-center justify-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors mb-6"
      >
        <Plus className="h-4 w-4" />
        New Ticket
      </button>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-charcoal/50 z-50 flex items-center justify-center p-4">
          <div className="bg-cream w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-cream border-b border-sand p-4 flex items-center justify-between">
              <h2
                className="font-display text-charcoal text-xl"
                style={{ fontWeight: 400 }}
              >
                Create Support Ticket
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-sand transition-colors"
              >
                <X className="h-5 w-5 text-warm-gray" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Subject */}
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Subject <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Reference */}
              {orders.length > 0 && (
                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">
                    Related Order (Optional)
                  </label>
                  <select
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="">Select an order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.reference} - {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'High' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 px-4 py-2 border font-body text-sm transition-colors ${priority === p.value
                        ? 'border-terracotta bg-terracotta/10 text-terracotta'
                        : 'border-sand bg-warm-white text-warm-gray hover:border-charcoal'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Message <span className="text-terracotta">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows={6}
                  className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border border-sand px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-sand transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/account/support/${ticket.id}`}
              className="block bg-warm-white border border-sand p-6 hover:border-terracotta transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3
                      className="font-display text-charcoal truncate"
                      style={{ fontWeight: 400 }}
                    >
                      {ticket.subject}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-1 text-xs font-body border ${statusColors[ticket.status] || statusColors.open}`}
                    >
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {ticket.category && (
                      <span className="font-body text-warm-gray">
                        {ticket.category.name}
                      </span>
                    )}
                    <span className={`font-body ${priorityColors[ticket.priority]}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="font-body text-warm-gray flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}
                    </span>
                    <span className="font-body text-warm-gray flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket._count.messages} {ticket._count.messages === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-sand group-hover:text-terracotta transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-warm-white border border-sand p-12 text-center">
          <MessageSquare className="h-12 w-12 text-sand mx-auto mb-4" />
          <h3
            className="font-display text-charcoal text-xl mb-2"
            style={{ fontWeight: 400 }}
          >
            No Support Tickets
          </h3>
          <p className="font-body text-warm-gray text-sm max-w-md mx-auto mb-6">
            You haven&apos;t created any support tickets yet. If you need help with an order, product, or your account, click the button above to get started.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Ticket
          </button>
        </div>
      )}

      {/* Help Info */}
      <div className="mt-8 bg-warm-white border border-sand p-6">
        <h3
          className="font-display text-charcoal text-lg mb-4"
          style={{ fontWeight: 400 }}
        >
          Need Quick Help?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/returns"
            className="flex items-center gap-3 p-4 border border-sand hover:border-terracotta transition-colors"
          >
            <AlertCircle className="h-5 w-5 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm">Start a Return</p>
              <p className="font-body text-warm-gray text-xs">Easy returns within 30 days</p>
            </div>
          </Link>
          <Link
            href="/size-guide"
            className="flex items-center gap-3 p-4 border border-sand hover:border-terracotta transition-colors"
          >
            <CheckCircle className="h-5 w-5 text-terracotta" />
            <div>
              <p className="font-body text-charcoal text-sm">Size Guide</p>
              <p className="font-body text-warm-gray text-xs">Find your perfect fit</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
