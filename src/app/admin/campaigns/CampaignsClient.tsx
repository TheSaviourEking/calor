'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Mail, Send, Users, BarChart3, Plus, ArrowLeft, Loader2, 
  Copy, Trash2, Eye, Calendar, Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  subject: string
  targetSegment: string
  status: string
  recipientCount: number
  deliveredCount: number
  openCount: number
  clickCount: number
  scheduledFor: string | null
  sentAt: string | null
  createdAt: string
  _count?: { recipients: number }
}

const statusColors: Record<string, string> = {
  draft: 'text-warm-gray',
  scheduled: 'text-terracotta',
  sending: 'text-charcoal',
  sent: 'text-green-600',
  cancelled: 'text-ember'
}

const segmentLabels: Record<string, string> = {
  all: 'All Customers',
  customers: 'Purchasing Customers',
  newsletter: 'Newsletter Subscribers',
  custom: 'Custom Segment'
}

export default function CampaignsClient() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [filter])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const url = filter !== 'all' ? `/api/admin/campaigns?status=${filter}` : '/api/admin/campaigns'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Campaign deleted')
        fetchCampaigns()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign.name} (Copy)`,
          subject: campaign.subject,
          targetSegment: campaign.targetSegment,
          contentHtml: '<p>Copy content from original campaign</p>'
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Campaign duplicated')
        fetchCampaigns()
      } else {
        toast.error(data.error || 'Failed to duplicate')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  // Calculate stats
  const stats = {
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + c.deliveredCount, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/admin"
              className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-4 hover:text-terracotta"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
              Email Campaigns
            </h1>
            <p className="font-body text-warm-gray mt-1">
              Manage your email marketing campaigns
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="flex items-center gap-2 bg-charcoal text-cream px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-warm-white border border-sand p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-warm-gray" />
              <span className="font-body text-warm-gray text-xs">Drafts</span>
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {stats.draft}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-terracotta" />
              <span className="font-body text-warm-gray text-xs">Scheduled</span>
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {stats.scheduled}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-green-600" />
              <span className="font-body text-warm-gray text-xs">Sent</span>
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {stats.sent}
            </p>
          </div>
          <div className="bg-warm-white border border-sand p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-terracotta" />
              <span className="font-body text-warm-gray text-xs">Total Delivered</span>
            </div>
            <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
              {stats.totalRecipients.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <span className="font-body text-warm-gray text-sm">Filter:</span>
          {['all', 'draft', 'scheduled', 'sent'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 font-body text-sm border ${
                filter === status 
                  ? 'border-terracotta text-terracotta' 
                  : 'border-sand text-warm-gray hover:border-terracotta/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Campaigns Table */}
        <div className="bg-warm-white border border-sand">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sand">
                  <th className="text-left p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Campaign</th>
                  <th className="text-left p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Segment</th>
                  <th className="text-left p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Recipients</th>
                  <th className="text-right p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Opens</th>
                  <th className="text-right p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Clicks</th>
                  <th className="text-left p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Date</th>
                  <th className="text-right p-4 font-body text-warm-gray text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-sand/30">
                    <td className="p-4">
                      <p className="font-body text-charcoal text-sm">{campaign.name}</p>
                      <p className="font-body text-warm-gray text-xs">{campaign.subject}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-body text-warm-gray text-sm">
                        {segmentLabels[campaign.targetSegment] || campaign.targetSegment}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-body text-sm capitalize ${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-body text-charcoal text-sm">
                        {campaign.deliveredCount || campaign.recipientCount}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-body text-charcoal text-sm">
                        {campaign.openCount}
                        {campaign.deliveredCount > 0 && (
                          <span className="text-warm-gray">
                            {' '}({Math.round((campaign.openCount / campaign.deliveredCount) * 100)}%)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-body text-charcoal text-sm">
                        {campaign.clickCount}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-body text-warm-gray text-xs">
                        {campaign.sentAt 
                          ? `Sent ${format(new Date(campaign.sentAt), 'MMM d')}`
                          : campaign.scheduledFor
                          ? `Scheduled ${format(new Date(campaign.scheduledFor), 'MMM d')}`
                          : format(new Date(campaign.createdAt), 'MMM d')
                        }
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === 'draft' && (
                          <Link 
                            href={`/admin/campaigns/${campaign.id}`}
                            className="p-1 hover:text-terracotta"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        <button 
                          onClick={() => handleDuplicate(campaign)}
                          className="p-1 hover:text-terracotta"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {campaign.status !== 'sending' && (
                          <button 
                            onClick={() => handleDelete(campaign.id)}
                            disabled={deleting === campaign.id}
                            className="p-1 hover:text-ember disabled:opacity-50"
                          >
                            {deleting === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <p className="font-body text-warm-gray">No campaigns found</p>
                      <Link 
                        href="/admin/campaigns/new"
                        className="inline-block mt-4 font-body text-sm text-terracotta hover:underline"
                      >
                        Create your first campaign
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
