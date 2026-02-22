'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  MessageSquare, Send, User, Clock, AlertCircle, CheckCircle,
  ArrowLeft, ChevronDown, Loader2, Package, Link2, Lock,
  CheckSquare
} from 'lucide-react'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Admin {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Message {
  id: string
  senderType: string
  senderId: string | null
  senderName: string | null
  content: string
  attachments: string | null
  isInternal: boolean
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  internalNotes: string | null
  customerId: string | null
  customer: Customer | null
  guestEmail: string | null
  guestName: string | null
  categoryId: string | null
  category: Category | null
  assignedToId: string | null
  assignedTo: Admin | null
  orderId: string | null
  productId: string | null
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  messages: Message[]
}

interface RelatedOrder {
  id: string
  reference: string
  status: string
  totalCents: number
  createdAt: string
}

interface RelatedProduct {
  id: string
  name: string
  slug: string
}

interface InitialData {
  ticket: Ticket
  relatedOrder: RelatedOrder | null
  relatedProduct: RelatedProduct | null
  admins: Admin[]
  categories: Category[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-terracotta/10 text-terracotta', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  waiting_customer: { label: 'Waiting Customer', color: 'bg-yellow-100 text-yellow-700', icon: User },
  waiting_third_party: { label: 'Waiting Third Party', color: 'bg-orange-100 text-orange-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckSquare },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'border-warm-gray text-warm-gray' },
  normal: { label: 'Normal', color: 'border-charcoal text-charcoal' },
  high: { label: 'High', color: 'border-orange-500 text-orange-600' },
  urgent: { label: 'Urgent', color: 'border-red-500 text-red-600' },
}

export default function AdminTicketDetailClient({ initialData }: { initialData: InitialData }) {
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket>(initialData.ticket)
  const [isUpdating, setIsUpdating] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [internalNotes, setInternalNotes] = useState(ticket.internalNotes || '')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket.messages.length])

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      const data = await response.json()
      setTicket(prev => ({ ...prev, ...data.ticket }))
      toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (!response.ok) throw new Error('Failed to update priority')

      const data = await response.json()
      setTicket(prev => ({ ...prev, ...data.ticket }))
      toast.success(`Priority updated to ${priorityConfig[newPriority]?.label || newPriority}`)
    } catch {
      toast.error('Failed to update priority')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssigneeChange = async (adminId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: adminId || null }),
      })

      if (!response.ok) throw new Error('Failed to update assignment')

      const data = await response.json()
      setTicket(prev => ({ ...prev, ...data.ticket }))
      const admin = initialData.admins.find(a => a.id === adminId)
      toast.success(admin ? `Assigned to ${admin.firstName} ${admin.lastName}` : 'Unassigned')
    } catch {
      toast.error('Failed to update assignment')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCategoryChange = async (categoryId: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId || null }),
      })

      if (!response.ok) throw new Error('Failed to update category')

      const data = await response.json()
      setTicket(prev => ({ ...prev, ...data.ticket, category: data.ticket.category }))
      const category = initialData.categories.find(c => c.id === categoryId)
      toast.success(category ? `Category set to ${category.name}` : 'Category removed')
    } catch {
      toast.error('Failed to update category')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveInternalNotes = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes }),
      })

      if (!response.ok) throw new Error('Failed to save notes')

      setTicket(prev => ({ ...prev, internalNotes }))
      toast.success('Internal notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          isInternal: isInternalNote,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      setTicket(prev => ({
        ...prev,
        messages: [...prev.messages, data.message],
        status: isInternalNote ? prev.status : 'in_progress',
      }))
      setReplyContent('')
      setIsInternalNote(false)
      toast.success(isInternalNote ? 'Internal note added' : 'Reply sent')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
  }

  const formatShortDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, h:mm a')
  }

  const config = statusConfig[ticket.status] || statusConfig.open
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/support"
            className="p-2 border border-sand hover:border-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {ticket.subject}
            </h1>
            <p className="font-body text-warm-gray text-sm mt-1">
              Ticket #{ticket.id.slice(0, 8)} • Created {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-body ${config.color}`}>
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Customer Info */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer
            </h3>
            {ticket.customer ? (
              <div className="space-y-2">
                <p className="font-body text-charcoal text-sm">
                  {ticket.customer.firstName} {ticket.customer.lastName}
                </p>
                <p className="font-body text-warm-gray text-sm">{ticket.customer.email}</p>
                <Link
                  href={`/admin/customers?search=${ticket.customer.email}`}
                  className="inline-flex items-center gap-1 text-terracotta text-xs font-body hover:underline"
                >
                  <Link2 className="w-3 h-3" />
                  View Customer
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-body text-charcoal text-sm">{ticket.guestName || 'Guest'}</p>
                <p className="font-body text-warm-gray text-sm">{ticket.guestEmail}</p>
              </div>
            )}
          </div>

          {/* Status Selector */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Status</h3>
            <div className="relative">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none disabled:opacity-50"
              >
                {Object.entries(statusConfig).map(([status, cfg]) => (
                  <option key={status} value={status}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
            </div>
          </div>

          {/* Priority Selector */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Priority</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(priorityConfig).map(([priority, cfg]) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 border font-body text-xs transition-colors ${
                    ticket.priority === priority
                      ? `${cfg.color} border-current`
                      : 'border-sand text-warm-gray hover:border-terracotta'
                  } disabled:opacity-50`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign To */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Assigned To</h3>
            <div className="relative">
              <select
                value={ticket.assignedToId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {initialData.admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.firstName} {admin.lastName} ({admin.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
            </div>
          </div>

          {/* Category */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Category</h3>
            <div className="relative">
              <select
                value={ticket.categoryId || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={isUpdating}
                className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none disabled:opacity-50"
              >
                <option value="">No Category</option>
                {initialData.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
            </div>
          </div>

          {/* Related Order */}
          {initialData.relatedOrder && (
            <div className="bg-warm-white p-4 border border-sand">
              <h3 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Related Order
              </h3>
              <div className="space-y-2">
                <p className="font-body text-charcoal text-sm">{initialData.relatedOrder.reference}</p>
                <p className="font-body text-warm-gray text-sm">
                  ${(initialData.relatedOrder.totalCents / 100).toFixed(2)} • {initialData.relatedOrder.status}
                </p>
                <Link
                  href={`/admin/orders?search=${initialData.relatedOrder.reference}`}
                  className="inline-flex items-center gap-1 text-terracotta text-xs font-body hover:underline"
                >
                  <Link2 className="w-3 h-3" />
                  View Order
                </Link>
              </div>
            </div>
          )}

          {/* Related Product */}
          {initialData.relatedProduct && (
            <div className="bg-warm-white p-4 border border-sand">
              <h3 className="font-body text-charcoal text-sm font-medium mb-3">Related Product</h3>
              <div className="space-y-2">
                <p className="font-body text-charcoal text-sm">{initialData.relatedProduct.name}</p>
                <Link
                  href={`/product/${initialData.relatedProduct.slug}`}
                  className="inline-flex items-center gap-1 text-terracotta text-xs font-body hover:underline"
                >
                  <Link2 className="w-3 h-3" />
                  View Product
                </Link>
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Internal Notes
            </h3>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes (not visible to customer)..."
              rows={4}
              className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
            />
            <button
              onClick={handleSaveInternalNotes}
              disabled={isUpdating}
              className="mt-2 w-full px-3 py-2 border border-sand font-body text-sm text-charcoal hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Notes'}
            </button>
          </div>

          {/* Timestamps */}
          <div className="bg-warm-white p-4 border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Timeline</h3>
            <div className="space-y-2 font-body text-xs text-warm-gray">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{formatShortDate(ticket.createdAt)}</span>
              </div>
              {ticket.firstResponseAt && (
                <div className="flex justify-between">
                  <span>First Response</span>
                  <span>{formatShortDate(ticket.firstResponseAt)}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span>Resolved</span>
                  <span>{formatShortDate(ticket.resolvedAt)}</span>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span>Closed</span>
                  <span>{formatShortDate(ticket.closedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Messages */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Messages Thread */}
          <div className="bg-warm-white border border-sand flex-1 flex flex-col">
            <div className="p-4 border-b border-sand">
              <h3 className="font-body text-charcoal text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation ({ticket.messages.length} messages)
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
              {ticket.messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-sand mx-auto mb-2" />
                  <p className="font-body text-warm-gray text-sm">No messages yet</p>
                </div>
              ) : (
                ticket.messages.map((message) => {
                  // Customer messages - left aligned, cream background
                  // Admin messages - right aligned, different background
                  // System messages - centered, subtle
                  // Internal notes - right aligned, special styling

                  if (message.senderType === 'system') {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="px-4 py-2 bg-sand/30 text-warm-gray text-xs font-body text-center max-w-md">
                          {message.content}
                        </div>
                      </div>
                    )
                  }

                  if (message.isInternal) {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[80%] p-4 bg-yellow-50 border border-yellow-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock className="w-3 h-3 text-yellow-600" />
                            <span className="font-body text-xs text-yellow-700">Internal Note</span>
                            {message.senderName && (
                              <span className="font-body text-xs text-warm-gray">by {message.senderName}</span>
                            )}
                          </div>
                          <p className="font-body text-charcoal text-sm">{message.content}</p>
                          <p className="font-body text-xs text-warm-gray mt-2">
                            {formatShortDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (message.senderType === 'customer') {
                    return (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-[80%] p-4 bg-cream border border-sand">
                          <p className="font-body text-warm-gray text-xs mb-1">
                            {ticket.customer?.firstName || ticket.guestName || 'Customer'}
                          </p>
                          <p className="font-body text-charcoal text-sm">{message.content}</p>
                          <p className="font-body text-xs text-warm-gray/60 mt-2">
                            {formatShortDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  // Admin message
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[80%] p-4 bg-charcoal text-cream">
                        <p className="font-body text-cream/60 text-xs mb-1">
                          {message.senderName || 'Support Team'}
                        </p>
                        <p className="font-body text-sm">{message.content}</p>
                        <p className="font-body text-xs text-cream/40 mt-2">
                          {formatShortDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Section */}
            <div className="p-4 border-t border-sand">
              <form onSubmit={handleSendReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-4 h-4 border-sand"
                    />
                    <span className="font-body text-warm-gray text-sm flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Internal note (not visible to customer)
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    {ticket.status === 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={isUpdating}
                        className="px-4 py-2 border border-sand font-body text-sm text-charcoal hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isUpdating}
                      className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isInternalNote ? 'Add Note' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 p-4 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal text-sm font-medium mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {ticket.status === 'open' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 border border-sand font-body text-xs text-charcoal hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
                >
                  Mark In Progress
                </button>
              )}
              {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                <button
                  onClick={() => handleStatusChange('waiting_customer')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 border border-sand font-body text-xs text-charcoal hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50"
                >
                  Waiting for Customer
                </button>
              )}
              {(ticket.status === 'open' || ticket.status === 'in_progress' || ticket.status === 'waiting_customer') && (
                <>
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 border border-green-200 font-body text-xs text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 border border-gray-200 font-body text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                </>
              )}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <button
                  onClick={() => handleStatusChange('open')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 border border-terracotta font-body text-xs text-terracotta hover:bg-terracotta/10 transition-colors disabled:opacity-50"
                >
                  Reopen Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
