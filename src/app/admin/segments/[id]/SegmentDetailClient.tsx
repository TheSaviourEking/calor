'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Users, Mail, Target, Loader2, Send, Calendar,
  DollarSign, ShoppingBag, Clock, TrendingUp, AlertTriangle,
  Plus, X, ChevronDown
} from 'lucide-react'

interface Segment {
  id: string
  slug: string
  name: string
  description: string | null
  color: string
  iconName: string
  customerCount: number
  totalRevenue: number
  avgOrderValue: number
  suggestedActions?: string[]
}

interface Member {
  id: string
  recencyScore: number
  frequencyScore: number
  monetaryScore: number
  rfmScore: string
  daysSinceLastOrder: number
  totalOrders: number
  totalSpentCents: number
  avgOrderCents: number
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
    createdAt: string
  }
}

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  recipientsCount: number
  opensCount: number
  clicksCount: number
  revenueCents: number
  sentAt: string | null
  createdAt: string
}

const COLOR_MAP: Record<string, string> = {
  gold: 'bg-gold/10 border-gold text-gold',
  sage: 'bg-sage/10 border-sage text-sage',
  terracotta: 'bg-terracotta/10 border-terracotta text-terracotta',
  ember: 'bg-ember/10 border-ember text-ember',
  'warm-gray': 'bg-warm-gray/10 border-warm-gray text-warm-gray',
  charcoal: 'bg-charcoal/10 border-charcoal text-charcoal',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-sand text-charcoal',
  scheduled: 'bg-gold/20 text-gold',
  sent: 'bg-sage/20 text-sage',
  completed: 'bg-terracotta/20 text-terracotta',
}

export default function SegmentDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [segment, setSegment] = useState<Segment | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeTab, setActiveTab] = useState<'members' | 'campaigns'>('members')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [creating, setCreating] = useState(false)

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'email',
    subject: '',
    description: '',
    offerCode: '',
  })

  useEffect(() => {
    fetchSegmentData()
  }, [id])

  const fetchSegmentData = async () => {
    setLoading(true)
    try {
      const [segmentRes, campaignsRes] = await Promise.all([
        fetch(`/api/admin/segments?id=${id}&includeMembers=true`),
        fetch(`/api/admin/segments/campaigns?segmentId=${id}`),
      ])

      if (segmentRes.ok) {
        const data = await segmentRes.json()
        setSegment(data.segment)
        setMembers(data.segment.members || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching segment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.type) return

    setCreating(true)
    try {
      const res = await fetch('/api/admin/segments/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentId: id,
          ...campaignForm,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCampaigns([data.campaign, ...campaigns])
        setShowCreateCampaign(false)
        setCampaignForm({
          name: '',
          type: 'email',
          subject: '',
          description: '',
          offerCode: '',
        })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setCreating(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRFMBadge = (score: string) => {
    const avg = (parseInt(score[0]) + parseInt(score[1]) + parseInt(score[2])) / 3
    if (avg >= 4) return 'bg-sage/20 text-sage'
    if (avg >= 3) return 'bg-gold/20 text-gold'
    if (avg >= 2) return 'bg-terracotta/20 text-terracotta'
    return 'bg-ember/20 text-ember'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!segment) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="font-body text-warm-gray">Segment not found</p>
            <Link href="/admin/segments" className="font-body text-terracotta hover:underline">
              Back to Segments
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const colorClass = COLOR_MAP[segment.color] || 'bg-sand border-warm-gray'

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/segments"
            className="w-10 h-10 flex items-center justify-center border border-sand hover:border-terracotta"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl text-charcoal" style={{ fontWeight: 400 }}>
                {segment.name}
              </h1>
              <span className={`px-2 py-1 text-xs font-body ${colorClass}`}>
                {segment.slug}
              </span>
            </div>
            <p className="font-body text-warm-gray mt-1">{segment.description}</p>
          </div>
          <button
            onClick={() => setShowCreateCampaign(true)}
            className="flex items-center gap-2 px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-charcoal"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-warm-white border border-sand">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-terracotta" />
              <span className="font-body text-warm-gray text-xs">Customers</span>
            </div>
            <p className="font-display text-2xl text-charcoal">{segment.customerCount}</p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-sage" />
              <span className="font-body text-warm-gray text-xs">Total Revenue</span>
            </div>
            <p className="font-display text-2xl text-charcoal">{formatCurrency(segment.totalRevenue)}</p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span className="font-body text-warm-gray text-xs">Avg Order Value</span>
            </div>
            <p className="font-display text-2xl text-charcoal">{formatCurrency(segment.avgOrderValue)}</p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-ember" />
              <span className="font-body text-warm-gray text-xs">Campaigns</span>
            </div>
            <p className="font-display text-2xl text-charcoal">{campaigns.length}</p>
          </div>
        </div>

        {/* Suggested Actions */}
        {segment.suggestedActions && segment.suggestedActions.length > 0 && (
          <div className="mb-8 p-4 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal text-sm uppercase tracking-wider mb-3">
              Suggested Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {segment.suggestedActions.map((action, i) => (
                <span key={i} className="px-3 py-1 bg-sand/50 font-body text-charcoal text-sm">
                  {action}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-sand mb-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 font-body text-sm border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-3 font-body text-sm border-b-2 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'members' && (
          <div>
            {members.length === 0 ? (
              <div className="text-center py-12 bg-warm-white border border-sand">
                <Users className="w-12 h-12 text-sand mx-auto mb-4" />
                <p className="font-body text-warm-gray">No members in this segment</p>
              </div>
            ) : (
              <div className="bg-warm-white border border-sand overflow-hidden">
                <table className="w-full">
                  <thead className="bg-sand/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-body text-xs text-warm-gray uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left font-body text-xs text-warm-gray uppercase tracking-wider">
                        RFM Score
                      </th>
                      <th className="px-4 py-3 text-left font-body text-xs text-warm-gray uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-4 py-3 text-left font-body text-xs text-warm-gray uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-4 py-3 text-left font-body text-xs text-warm-gray uppercase tracking-wider">
                        Last Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-sand/20">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-body text-charcoal text-sm">
                              {member.customer.firstName} {member.customer.lastName}
                            </p>
                            <p className="font-body text-warm-gray text-xs">{member.customer.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 font-body text-xs ${getRFMBadge(member.rfmScore)}`}>
                            {member.rfmScore}
                          </span>
                          <span className="font-body text-warm-gray text-xs ml-2">
                            R{member.recencyScore} F{member.frequencyScore} M{member.monetaryScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-charcoal text-sm">{member.totalOrders}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-charcoal text-sm">
                            {formatCurrency(member.totalSpentCents)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-body text-warm-gray text-sm">
                            {member.daysSinceLastOrder} days ago
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div>
            {campaigns.length === 0 ? (
              <div className="text-center py-12 bg-warm-white border border-sand">
                <Mail className="w-12 h-12 text-sand mx-auto mb-4" />
                <p className="font-body text-warm-gray mb-4">No campaigns yet</p>
                <button
                  onClick={() => setShowCreateCampaign(true)}
                  className="px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-charcoal"
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-warm-white border border-sand">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-body text-charcoal">{campaign.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-body ${STATUS_COLORS[campaign.status]}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <p className="font-body text-warm-gray text-sm">
                          {campaign.recipientsCount} recipients · {campaign.opensCount} opens · {campaign.clicksCount} clicks
                        </p>
                        {campaign.revenueCents > 0 && (
                          <p className="font-body text-sage text-sm mt-1">
                            {formatCurrency(campaign.revenueCents)} revenue
                          </p>
                        )}
                      </div>
                      <span className="font-body text-warm-gray text-xs">
                        {campaign.sentAt ? formatDate(campaign.sentAt) : formatDate(campaign.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateCampaign && (
          <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
            <div className="bg-warm-white p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-charcoal">Create Campaign</h2>
                <button
                  onClick={() => setShowCreateCampaign(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-sand"
                >
                  <X className="w-5 h-5 text-charcoal" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                    placeholder="e.g., Win-back Campaign Q1"
                  />
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Campaign Type</label>
                  <select
                    value={campaignForm.type}
                    onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="email">Email Campaign</option>
                    <option value="promo">Promotional Offer</option>
                    <option value="notification">Push Notification</option>
                    <option value="retarget">Retargeting Ads</option>
                  </select>
                </div>

                {campaignForm.type === 'email' && (
                  <div>
                    <label className="block font-body text-charcoal text-sm mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                      placeholder="e.g., We miss you! Here's 20% off..."
                    />
                  </div>
                )}

                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Description</label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                    rows={3}
                    placeholder="Describe the campaign goal and content..."
                  />
                </div>

                <div>
                  <label className="block font-body text-charcoal text-sm mb-1">Offer Code (Optional)</label>
                  <input
                    type="text"
                    value={campaignForm.offerCode}
                    onChange={(e) => setCampaignForm({ ...campaignForm, offerCode: e.target.value })}
                    className="w-full px-3 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                    placeholder="e.g., WINBACK20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateCampaign(false)}
                    className="flex-1 px-4 py-2 border border-sand font-body text-sm text-charcoal hover:border-terracotta"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={creating || !campaignForm.name}
                    className="flex-1 px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-charcoal disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
