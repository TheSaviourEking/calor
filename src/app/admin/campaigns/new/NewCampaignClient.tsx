'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Loader2, Mail, Users, Calendar, Send, Eye
} from 'lucide-react'
import { toast } from 'sonner'

const segments = [
  { value: 'all', label: 'All Customers', description: 'Send to all registered customers' },
  { value: 'customers', label: 'Purchasing Customers', description: 'Customers who have made at least one purchase' },
  { value: 'newsletter', label: 'Newsletter Subscribers', description: 'Subscribers who opted in to newsletters' }
]

export default function NewCampaignClient() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    previewText: '',
    targetSegment: 'all',
    contentHtml: '',
    contentText: '',
    scheduledFor: '',
    trackingEnabled: true,
    utmSource: 'email',
    utmMedium: 'campaign',
    utmCampaign: ''
  })

  const handleSubmit = async (asDraft: boolean) => {
    if (!form.name || !form.subject || !form.contentHtml) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: asDraft ? 'draft' : (form.scheduledFor ? 'scheduled' : 'draft')
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(asDraft ? 'Campaign saved as draft' : 'Campaign created')
        router.push('/admin/campaigns')
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/campaigns"
            className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-4 hover:text-terracotta"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
          <h1 className="font-display text-charcoal text-3xl" style={{ fontWeight: 300 }}>
            Create Email Campaign
          </h1>
          <p className="font-body text-warm-gray mt-1">
            Design and send an email campaign to your customers
          </p>
        </div>

        <div className="space-y-6">
          {/* Campaign Details */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Campaign Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Campaign Name <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Summer Sale Announcement"
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                />
                <p className="font-body text-warm-gray text-xs mt-1">Internal name, not visible to recipients</p>
              </div>

              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Email Subject <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g., Summer Sale - Up to 30% Off"
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
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
                  placeholder="Short preview shown in email clients"
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  maxLength={100}
                />
                <p className="font-body text-warm-gray text-xs mt-1">{form.previewText.length}/100 characters</p>
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Target Audience
            </h2>
            
            <div className="space-y-2">
              {segments.map(segment => (
                <label 
                  key={segment.value}
                  className={`flex items-start gap-3 p-4 border cursor-pointer ${
                    form.targetSegment === segment.value 
                      ? 'border-terracotta bg-terracotta/5' 
                      : 'border-sand hover:border-terracotta/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetSegment"
                    value={segment.value}
                    checked={form.targetSegment === segment.value}
                    onChange={(e) => setForm({ ...form, targetSegment: e.target.value })}
                    className="accent-terracotta mt-1"
                  />
                  <div>
                    <span className="font-body text-charcoal text-sm">{segment.label}</span>
                    <p className="font-body text-warm-gray text-xs">{segment.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Email Content
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  HTML Content <span className="text-terracotta">*</span>
                </label>
                <textarea
                  value={form.contentHtml}
                  onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
                  placeholder="<html><body><h1>Your email content here</h1>...</body></html>"
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm min-h-[300px] focus:outline-none focus:border-terracotta font-mono"
                />
              </div>

              <div>
                <label className="font-body text-charcoal text-sm block mb-2">
                  Plain Text Version
                </label>
                <textarea
                  value={form.contentText}
                  onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                  placeholder="Plain text version for email clients that don't support HTML"
                  className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm min-h-[150px] focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Scheduling
            </h2>
            
            <div>
              <label className="font-body text-charcoal text-sm block mb-2">
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              />
              <p className="font-body text-warm-gray text-xs mt-1">Leave empty to save as draft</p>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-warm-white border border-sand p-6">
            <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
              Tracking
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.trackingEnabled}
                  onChange={(e) => setForm({ ...form, trackingEnabled: e.target.checked })}
                  className="w-5 h-5 accent-terracotta"
                />
                <div>
                  <span className="font-body text-charcoal text-sm">Enable Tracking</span>
                  <p className="font-body text-warm-gray text-xs">Track opens and clicks</p>
                </div>
              </label>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">UTM Source</label>
                  <input
                    type="text"
                    value={form.utmSource}
                    onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">UTM Medium</label>
                  <input
                    type="text"
                    value={form.utmMedium}
                    onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="font-body text-charcoal text-sm block mb-2">UTM Campaign</label>
                  <input
                    type="text"
                    value={form.utmCampaign}
                    onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/campaigns"
              className="border border-sand px-6 py-3 font-body text-sm hover:border-terracotta hover:text-terracotta transition-colors"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="border border-charcoal text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Draft'
                )}
              </button>
              {form.scheduledFor && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                  className="bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
