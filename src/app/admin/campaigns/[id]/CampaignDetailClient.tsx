'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  ArrowLeft, Loader2, Mail, Users, BarChart3, Send, Calendar, 
  Clock, Eye, MousePointer, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  subject: string
  previewText: string | null
  contentHtml: string
  contentText: string | null
  targetSegment: string
  status: string
  recipientCount: number
  deliveredCount: number
  openCount: number
  clickCount: number
  bounceCount: number
  unsubscribeCount: number
  scheduledFor: string | null
  sentAt: string | null
  createdAt: string
  trackingEnabled: boolean
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

const segmentLabels: Record<string, string> = {
  all: 'All Customers',
  customers: 'Purchasing Customers',
  newsletter: 'Newsletter Subscribers',
  custom: 'Custom Segment'
}

export default function CampaignDetailClient({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    previewText: '',
    contentHtml: ''
  })

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/admin/campaigns`)
      const data = await res.json()
      const found = data.campaigns?.find((c: Campaign) => c.id === id)
      if (found) {
        setCampaign(found)
        setForm({
          name: found.name,
          subject: found.subject,
          previewText: found.previewText || '',
          contentHtml: found.contentHtml
        })
      } else {
        toast.error('Campaign not found')
        router.push('/admin/campaigns')
      }
    } catch (error) {
      toast.error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.contentHtml) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Campaign updated')
        fetchCampaign()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <p className="font-body text-warm-gray">Campaign not found</p>
      </div>
    )
  }

  const openRate = campaign.deliveredCount > 0 
    ? ((campaign.openCount / campaign.deliveredCount) * 100).toFixed(1) 
    : '0'
  const clickRate = campaign.deliveredCount > 0 
    ? ((campaign.clickCount / campaign.deliveredCount) * 100).toFixed(1) 
    : '0'

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/admin/campaigns"
              className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-4 hover:text-terracotta"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
            <h1 className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
              {campaign.name}
            </h1>
            <p className="font-body text-warm-gray mt-1">
              {segmentLabels[campaign.targetSegment] || campaign.targetSegment}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 font-body text-sm ${
              campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
              campaign.status === 'scheduled' ? 'bg-terracotta/10 text-terracotta' :
              'bg-sand text-warm-gray'
            }`}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
        </div>

        {campaign.status === 'sent' && (
          /* Stats for sent campaigns */
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <div className="bg-warm-white border border-sand p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-warm-gray" />
                <span className="font-body text-warm-gray text-xs">Delivered</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {campaign.deliveredCount}
              </p>
            </div>
            <div className="bg-warm-white border border-sand p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-terracotta" />
                <span className="font-body text-warm-gray text-xs">Opens</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {campaign.openCount} <span className="text-sm text-warm-gray">({openRate}%)</span>
              </p>
            </div>
            <div className="bg-warm-white border border-sand p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="h-4 w-4 text-terracotta" />
                <span className="font-body text-warm-gray text-xs">Clicks</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {campaign.clickCount} <span className="text-sm text-warm-gray">({clickRate}%)</span>
              </p>
            </div>
            <div className="bg-warm-white border border-sand p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-ember" />
                <span className="font-body text-warm-gray text-xs">Bounced</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {campaign.bounceCount}
              </p>
            </div>
            <div className="bg-warm-white border border-sand p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-warm-gray" />
                <span className="font-body text-warm-gray text-xs">Unsubscribed</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                {campaign.unsubscribeCount}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="space-y-6">
            <div className="bg-warm-white border border-sand p-6">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Campaign Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={campaign.status === 'sent'}
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    disabled={campaign.status === 'sent'}
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">
                    Preview Text
                  </label>
                  <input
                    type="text"
                    value={form.previewText}
                    onChange={(e) => setForm({ ...form, previewText: e.target.value })}
                    disabled={campaign.status === 'sent'}
                    className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-warm-white border border-sand p-6">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Email Content
              </h2>
              <textarea
                value={form.contentHtml}
                onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
                disabled={campaign.status === 'sent'}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm min-h-[300px] focus:outline-none focus:border-terracotta font-mono disabled:opacity-50"
              />
            </div>

            {campaign.status !== 'sent' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-warm-white border border-sand p-6">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Campaign Info
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-sand">
                  <span className="font-body text-warm-gray text-sm">Status</span>
                  <span className="font-body text-charcoal text-sm capitalize">{campaign.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sand">
                  <span className="font-body text-warm-gray text-sm">Segment</span>
                  <span className="font-body text-charcoal text-sm">{segmentLabels[campaign.targetSegment]}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sand">
                  <span className="font-body text-warm-gray text-sm">Recipients</span>
                  <span className="font-body text-charcoal text-sm">{campaign.recipientCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-sand">
                  <span className="font-body text-warm-gray text-sm">Created</span>
                  <span className="font-body text-charcoal text-sm">
                    {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                {campaign.scheduledFor && (
                  <div className="flex justify-between py-2 border-b border-sand">
                    <span className="font-body text-warm-gray text-sm">Scheduled For</span>
                    <span className="font-body text-charcoal text-sm">
                      {format(new Date(campaign.scheduledFor), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
                {campaign.sentAt && (
                  <div className="flex justify-between py-2 border-b border-sand">
                    <span className="font-body text-warm-gray text-sm">Sent At</span>
                    <span className="font-body text-charcoal text-sm">
                      {format(new Date(campaign.sentAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="font-body text-warm-gray text-sm">Tracking</span>
                  <span className="font-body text-charcoal text-sm">
                    {campaign.trackingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {campaign.trackingEnabled && (campaign.utmSource || campaign.utmMedium || campaign.utmCampaign) && (
              <div className="bg-warm-white border border-sand p-6">
                <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                  UTM Parameters
                </h2>
                <div className="space-y-2">
                  {campaign.utmSource && (
                    <p className="font-body text-sm">
                      <span className="text-warm-gray">Source:</span>{' '}
                      <span className="text-charcoal">{campaign.utmSource}</span>
                    </p>
                  )}
                  {campaign.utmMedium && (
                    <p className="font-body text-sm">
                      <span className="text-warm-gray">Medium:</span>{' '}
                      <span className="text-charcoal">{campaign.utmMedium}</span>
                    </p>
                  )}
                  {campaign.utmCampaign && (
                    <p className="font-body text-sm">
                      <span className="text-warm-gray">Campaign:</span>{' '}
                      <span className="text-charcoal">{campaign.utmCampaign}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
