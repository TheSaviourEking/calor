'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  MessageSquare, Send, Clock, ArrowLeft, Loader2, 
  User, Headphones, CheckCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import AccountNav from '@/components/account/AccountNav'

interface Message {
  id: string
  senderType: string
  senderId: string | null
  senderName: string | null
  content: string
  createdAt: string
  isInternal: boolean
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  firstResponseAt: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  messages: Message[]
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

export default function TicketDetailClient() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket?.messages])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      const data = await res.json()

      if (res.ok) {
        setTicket(data.ticket)
      } else {
        toast.error(data.error || 'Failed to load ticket')
        router.push('/account/support')
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      toast.error('Failed to load ticket')
      router.push('/account/support')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyMessage.trim() })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Reply sent')
        setReplyMessage('')
        fetchTicket()
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return <Headphones className="h-4 w-4" />
      case 'system':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getSenderName = (message: Message) => {
    switch (message.senderType) {
      case 'admin':
        return message.senderName || 'Support Team'
      case 'system':
        return 'System'
      default:
        return 'You'
    }
  }

  // Generate status timeline
  const getStatusTimeline = () => {
    if (!ticket) return []
    
    const timeline = [
      {
        status: 'created',
        label: 'Ticket Created',
        date: ticket.createdAt,
        completed: true
      }
    ]

    if (ticket.firstResponseAt) {
      timeline.push({
        status: 'first_response',
        label: 'First Response',
        date: ticket.firstResponseAt,
        completed: true
      })
    }

    if (ticket.resolvedAt) {
      timeline.push({
        status: 'resolved',
        label: 'Resolved',
        date: ticket.resolvedAt,
        completed: true
      })
    }

    if (ticket.closedAt) {
      timeline.push({
        status: 'closed',
        label: 'Closed',
        date: ticket.closedAt,
        completed: true
      })
    }

    return timeline
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'
  const timeline = getStatusTimeline()

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AccountNav />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Back Link */}
            <Link
              href="/account/support"
              className="inline-flex items-center gap-2 text-warm-gray hover:text-terracotta mb-6 font-body text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Support Tickets
            </Link>

            {/* Ticket Header */}
            <div className="bg-warm-white border border-sand p-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 
                  className="font-display text-charcoal text-xl md:text-2xl"
                  style={{ fontWeight: 300 }}
                >
                  {ticket.subject}
                </h1>
                <span
                  className={`shrink-0 px-3 py-1 text-sm font-body border ${statusColors[ticket.status] || statusColors.open}`}
                >
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {ticket.category && (
                  <span className="font-body text-warm-gray">
                    Category: <span className="text-charcoal">{ticket.category.name}</span>
                  </span>
                )}
                <span className="font-body text-warm-gray">
                  Priority: <span className={`${priorityColors[ticket.priority]} capitalize`}>{ticket.priority}</span>
                </span>
                <span className="font-body text-warm-gray flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Status Timeline */}
            {timeline.length > 1 && (
              <div className="bg-warm-white border border-sand p-6 mb-6">
                <h3 
                  className="font-display text-charcoal text-sm mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Status Timeline
                </h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {timeline.map((item, index) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-6 h-6 flex items-center justify-center ${item.completed ? 'bg-green-500' : 'bg-sand'}`}>
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-body text-charcoal text-xs whitespace-nowrap">{item.label}</p>
                          <p className="font-body text-warm-gray text-xs whitespace-nowrap">
                            {format(new Date(item.date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-8 h-px bg-sand mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Thread */}
            <div className="bg-warm-white border border-sand mb-6">
              <div className="p-4 border-b border-sand">
                <h3 
                  className="font-display text-charcoal"
                  style={{ fontWeight: 400 }}
                >
                  Conversation
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto p-6 space-y-4">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.senderType === 'customer' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {/* Customer messages on left */}
                    <div
                      className={`max-w-[80%] ${
                        message.senderType === 'customer'
                          ? 'order-1'
                          : 'order-2'
                      }`}
                    >
                      <div
                        className={`p-4 ${
                          message.senderType === 'customer'
                            ? 'bg-sand/50 border border-sand'
                            : message.senderType === 'system'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-terracotta/5 border border-terracotta/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${
                            message.senderType === 'customer'
                              ? 'text-charcoal'
                              : message.senderType === 'system'
                              ? 'text-blue-600'
                              : 'text-terracotta'
                          }`}>
                            {getSenderIcon(message.senderType)}
                          </span>
                          <span className="font-body text-charcoal text-sm">
                            {getSenderName(message)}
                          </span>
                        </div>
                        <p className="font-body text-charcoal text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <p className="font-body text-warm-gray text-xs mt-1">
                        {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Form */}
            {!isClosed ? (
              <form onSubmit={handleSubmitReply} className="bg-warm-white border border-sand p-6">
                <h3 
                  className="font-display text-charcoal mb-4"
                  style={{ fontWeight: 400 }}
                >
                  Reply
                </h3>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none mb-4"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyMessage.trim()}
                  className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-warm-white border border-sand p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 
                  className="font-display text-charcoal mb-2"
                  style={{ fontWeight: 400 }}
                >
                  This ticket is {ticket.status}
                </h3>
                <p className="font-body text-warm-gray text-sm mb-4">
                  If you need further assistance, please create a new support ticket.
                </p>
                <Link
                  href="/account/support"
                  className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Create New Ticket
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
