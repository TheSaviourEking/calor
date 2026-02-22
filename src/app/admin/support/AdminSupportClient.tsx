'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  MessageSquare, Clock, User, AlertCircle, CheckCircle,
  Filter, Search, ChevronDown, Loader2, Eye, ArrowLeft
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

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  guestEmail: string | null
  guestName: string | null
  createdAt: string
  customerId: string | null
  customer: Customer | null
  categoryId: string | null
  category: Category | null
  assignedToId: string | null
  assignedTo: Admin | null
  messageCount: number
  lastMessage: {
    createdAt: string
    senderType: string
  } | null
}

interface Stats {
  open: number
  in_progress: number
  waiting_customer: number
  waiting_third_party: number
  resolved: number
  closed: number
}

interface InitialData {
  tickets: Ticket[]
  stats: Stats
  categories: Category[]
  admins: Admin[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-terracotta/10 text-terracotta', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  waiting_customer: { label: 'Waiting Customer', color: 'bg-yellow-100 text-yellow-700', icon: User },
  waiting_third_party: { label: 'Waiting Third Party', color: 'bg-orange-100 text-orange-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-warm-gray' },
  normal: { label: 'Normal', color: 'text-charcoal' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
}

export default function AdminSupportClient({ initialData }: { initialData: InitialData }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialData.tickets)
  const [stats] = useState<Stats>(initialData.stats)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || ticket.categoryId === categoryFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const refreshTickets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tickets')
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets.map((ticket: Ticket) => ({
        ...ticket,
        messageCount: ticket._count?.messages || 0,
        lastMessage: ticket.messages?.[0] || null,
      })))
    } catch {
      toast.error('Failed to refresh tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
  }

  const formatShortDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
            Support Tickets
          </h1>
          <p className="font-body text-warm-gray text-sm mt-1">
            Manage customer support requests
          </p>
        </div>
        <button
          onClick={refreshTickets}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          const count = stats[status as keyof Stats] || 0
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-4 border transition-colors ${statusFilter === status
                ? 'border-terracotta bg-terracotta/5'
                : 'border-sand bg-warm-white hover:border-terracotta/50'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className="w-4 h-4 text-terracotta" />
                <span className={`font-body text-lg ${config.color.split(' ')[1]}`}>
                  {count}
                </span>
              </div>
              <p className="font-body text-warm-gray text-xs">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-warm-white p-4 border border-sand">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              placeholder="Search by subject, email, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full sm:w-40 px-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta appearance-none"
              >
                <option value="all">All Categories</option>
                {initialData.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
            </div>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setPriorityFilter('all')
                setCategoryFilter('all')
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-sand font-body text-sm text-warm-gray hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <Filter className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-warm-white border border-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand bg-sand/20">
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Ticket</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Assigned</th>
                <th className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <MessageSquare className="w-12 h-12 text-sand mb-2" />
                      <p className="font-body text-warm-gray text-sm">No tickets found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const config = statusConfig[ticket.status] || statusConfig.open
                  const priority = priorityConfig[ticket.priority] || priorityConfig.normal
                  const StatusIcon = config.icon

                  return (
                    <tr key={ticket.id} className="hover:bg-sand/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="max-w-[200px]">
                          <p className="font-body text-charcoal text-sm font-medium truncate">
                            {ticket.subject}
                          </p>
                          <p className="font-body text-warm-gray text-xs">
                            {ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-body text-charcoal text-sm">
                            {ticket.customer
                              ? `${ticket.customer.firstName} ${ticket.customer.lastName}`
                              : ticket.guestName || 'Guest'}
                          </p>
                          <p className="font-body text-warm-gray text-xs truncate max-w-[150px]">
                            {ticket.customer?.email || ticket.guestEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-warm-gray text-sm">
                          {ticket.category?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-body ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-body text-sm font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.assignedTo ? (
                          <span className="font-body text-charcoal text-sm">
                            {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                          </span>
                        ) : (
                          <span className="font-body text-warm-gray/60 text-sm italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-body text-warm-gray text-sm">
                            {formatShortDate(ticket.createdAt)}
                          </p>
                          {ticket.lastMessage && (
                            <p className="font-body text-warm-gray/60 text-xs">
                              Last: {formatShortDate(ticket.lastMessage.createdAt)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-sand font-body text-sm text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between py-4 border-t border-sand">
        <p className="font-body text-warm-gray text-sm">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </p>
      </div>
    </div>
  )
}
