'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Clock, Lock,
  MessageCircle, HelpCircle, Loader2, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

interface EditStreamClientProps {
  params: Promise<{ streamId: string }>
}

export default function EditStreamClient({ params }: EditStreamClientProps) {
  const { streamId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    scheduledEndDate: '',
    scheduledEndTime: '',
    category: '',
    tags: '' as string,
    isPrivate: false,
    password: '',
    allowChat: true,
    allowQuestions: true,
    moderatedChat: false,
  })

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await fetch(`/api/streams/${streamId}`)
        if (!res.ok) {
          toast.error('Failed to load stream')
          router.push(`/host/streams/${streamId}`)
          return
        }
        const data = await res.json()
        const stream = data.stream

        const startDate = stream.scheduledStart ? new Date(stream.scheduledStart) : null
        const endDate = stream.scheduledEnd ? new Date(stream.scheduledEnd) : null

        let tags = ''
        if (stream.tags) {
          try {
            const parsed = JSON.parse(stream.tags)
            tags = Array.isArray(parsed) ? parsed.join(', ') : stream.tags
          } catch {
            tags = stream.tags
          }
        }

        setFormData({
          title: stream.title || '',
          description: stream.description || '',
          scheduledDate: startDate ? startDate.toISOString().split('T')[0] : '',
          scheduledTime: startDate ? startDate.toTimeString().slice(0, 5) : '',
          scheduledEndDate: endDate ? endDate.toISOString().split('T')[0] : '',
          scheduledEndTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
          category: stream.category || '',
          tags,
          isPrivate: stream.isPrivate || false,
          password: '',
          allowChat: stream.allowChat ?? true,
          allowQuestions: stream.allowQuestions ?? true,
          moderatedChat: stream.moderatedChat || false,
        })
      } catch {
        toast.error('Something went wrong loading the stream')
        router.push(`/host/streams/${streamId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStream()
  }, [streamId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.isPrivate && !formData.password) {
      toast.error('Private streams require a password')
      return
    }

    setSaving(true)
    try {
      const scheduledStart = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
      const scheduledEnd = formData.scheduledEndDate && formData.scheduledEndTime
        ? new Date(`${formData.scheduledEndDate}T${formData.scheduledEndTime}`)
        : undefined

      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : undefined

      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd?.toISOString(),
        isPrivate: formData.isPrivate,
        allowChat: formData.allowChat,
        allowQuestions: formData.allowQuestions,
        moderatedChat: formData.moderatedChat,
        category: formData.category || null,
        tags,
      }

      if (formData.isPrivate && formData.password) {
        body.password = formData.password
      }

      const res = await fetch(`/api/streams/${streamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success('Stream updated!')
        router.push(`/host/streams/${streamId}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update stream')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const categories = [
    'new_products',
    'sale',
    'tutorial',
    'q&a',
    'seasonal',
    'behind_the_scenes',
  ]

  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </ClientWrapper>
    )
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/host/streams/${streamId}`}
              className="w-10 h-10 border border-sand flex items-center justify-center hover:border-terracotta"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </Link>
            <div>
              <h1
                className="font-display text-charcoal"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
              >
                Edit Stream
              </h1>
              <p className="font-body text-warm-gray text-sm">
                Update your stream details
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Collection Reveal"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Tell viewers what to expect..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta resize-none"
                  />
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., fashion, summer, sale (comma separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Schedule
              </h2>

              <div className="space-y-4">
                <p className="font-body text-warm-gray text-xs uppercase tracking-wider">Start</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                      <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                        required
                      />
                    </div>
                  </div>
                </div>

                <p className="font-body text-warm-gray text-xs uppercase tracking-wider pt-2">End (optional)</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                      <input
                        type="date"
                        value={formData.scheduledEndDate}
                        onChange={(e) => setFormData({ ...formData, scheduledEndDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-charcoal text-sm mb-2 block">
                      Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
                      <input
                        type="time"
                        value={formData.scheduledEndTime}
                        onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-warm-white p-6 border border-sand">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Settings
              </h2>

              <div className="space-y-4">
                {/* Privacy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Private Stream</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                    className={`w-12 h-6 relative transition-colors ${formData.isPrivate ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.isPrivate ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {formData.isPrivate && (
                  <input
                    type="password"
                    placeholder="New stream password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                )}

                {/* Chat */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Enable Chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowChat: !formData.allowChat })}
                    className={`w-12 h-6 relative transition-colors ${formData.allowChat ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.allowChat ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Questions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Allow Questions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowQuestions: !formData.allowQuestions })}
                    className={`w-12 h-6 relative transition-colors ${formData.allowQuestions ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.allowQuestions ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Moderated Chat */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-warm-gray" />
                    <span className="font-body text-charcoal text-sm">Moderated Chat</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, moderatedChat: !formData.moderatedChat })}
                    className={`w-12 h-6 relative transition-colors ${formData.moderatedChat ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-cream transition-all ${formData.moderatedChat ? 'left-7' : 'left-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Link
                href={`/host/streams/${streamId}`}
                className="flex-1 py-4 border border-sand font-body text-sm text-center text-charcoal hover:border-terracotta"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-terracotta text-cream py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ClientWrapper>
  )
}
