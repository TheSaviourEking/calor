'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Gift, Plus, Calendar, Users, Package, Eye, Copy, Check,
  Settings, ExternalLink, ChevronRight, Sparkles, Heart
} from 'lucide-react'
import { toast } from 'sonner'

interface RegistryStats {
  totalItems: number
  totalGuests: number
  totalPurchases: number
  totalValue: number
  purchasedValue: number
  completionPercentage: number
}

interface Registry {
  id: string
  slug: string
  title: string
  description: string | null
  registryType: string
  eventDate: string | null
  eventLocation: string | null
  theme: string
  isPublic: boolean
  status: string
  viewCount: number
  createdAt: string
  events: Array<{
    id: string
    name: string
    date: string
  }>
  stats: RegistryStats
}

const registryTypeLabels: Record<string, string> = {
  wedding: 'Wedding',
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  baby: 'Baby Shower',
  housewarming: 'Housewarming',
  custom: 'Custom',
}

const statusStyles: Record<string, string> = {
  draft: 'bg-sand text-mid-gray',
  active: 'bg-terracotta/10 text-terracotta',
  completed: 'bg-gold/20 text-gold',
  archived: 'bg-mid-gray/20 text-warm-gray',
}

const themeColors: Record<string, string> = {
  classic: 'terracotta',
  romantic: 'blush',
  modern: 'charcoal',
  minimalist: 'sand',
  bold: 'ember',
}

export default function RegistryDashboard() {
  const router = useRouter()
  const [registries, setRegistries] = useState<Registry[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchRegistries()
  }, [])

  const fetchRegistries = async () => {
    try {
      const res = await fetch('/api/registry')
      if (res.ok) {
        const data = await res.json()
        setRegistries(data.registries || [])
      }
    } catch (error) {
      console.error('Error fetching registries:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/registry/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Share link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-warm-gray">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1
            className="font-display text-charcoal mb-2"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
          >
            Gift Registry
          </h1>
          <p className="font-body text-warm-gray">
            Create and manage your gift registries for special occasions.
          </p>
        </div>
        <Link
          href="/registry/new"
          className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Registry
        </Link>
      </div>

      {registries.length === 0 ? (
        /* Empty State */
        <div className="text-center py-24 bg-warm-white border border-sand">
          <div className="w-20 h-20 bg-terracotta/10 flex items-center justify-center mx-auto mb-6 rounded-full">
            <Gift className="w-10 h-10 text-terracotta" />
          </div>
          <h3
            className="font-display text-charcoal mb-4"
            style={{ fontSize: '1.75rem', fontWeight: 300 }}
          >
            No registries yet
          </h3>
          <p className="font-body text-warm-gray max-w-lg mx-auto mb-10 text-sm">
            Start curating your dream wish list. Whether it's for a wedding, anniversary, birthday, or just treating yourself.
          </p>

          {/* Registry Types Preview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto px-6">
            {[
              { type: 'wedding', icon: '💒', label: 'Wedding' },
              { type: 'anniversary', icon: '💕', label: 'Anniversary' },
              { type: 'birthday', icon: '🎂', label: 'Birthday' },
              { type: 'baby', icon: '👶', label: 'Baby Shower' },
              { type: 'housewarming', icon: '🏠', label: 'Housewarming' },
              { type: 'custom', icon: '✨', label: 'Custom' },
            ].map((item) => (
              <button
                key={item.type}
                className="group flex flex-col items-center p-6 border border-sand bg-cream hover:border-terracotta hover:bg-terracotta/5 transition-all text-center"
                onClick={() => router.push(`/registry/new?type=${item.type}`)}
              >
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="font-body text-charcoal text-sm font-medium tracking-wide">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Registry Grid */
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {registries.map((registry) => (
            <div key={registry.id} className="group bg-warm-white border border-sand overflow-hidden hover:border-terracotta/50 transition-colors flex flex-col">
              {/* Card Header */}
              <div className="p-8 border-b border-sand">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest ${statusStyles[registry.status]}`}>
                      {registry.status}
                    </span>
                    <span className="font-body text-xs text-warm-gray uppercase tracking-wider">{registryTypeLabels[registry.registryType]}</span>
                  </div>

                  {registry.eventDate && (
                    <div className="flex items-center gap-1.5 text-warm-gray">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-body text-xs tracking-wider">{formatDate(registry.eventDate)}</span>
                    </div>
                  )}
                </div>

                <h3
                  className="font-display text-charcoal mb-2"
                  style={{ fontSize: '1.5rem', fontWeight: 400 }}
                >
                  {registry.title}
                </h3>

                {registry.description && (
                  <p className="font-body text-warm-gray text-sm line-clamp-2 leading-relaxed">
                    {registry.description}
                  </p>
                )}
              </div>

              {/* Progress & Stats */}
              <div className="p-8 bg-cream border-b border-sand">
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-body text-xs text-warm-gray uppercase tracking-wider">Funded/Gifted</span>
                    <span className="font-body text-charcoal font-medium">{registry.stats.completionPercentage}%</span>
                  </div>
                  <div className="h-1.5 bg-sand overflow-hidden">
                    <div
                      className="h-full bg-terracotta transition-all duration-1000 ease-out"
                      style={{ width: `${registry.stats.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-2">
                  <div>
                    <span className="block font-body text-[0.65rem] text-warm-gray uppercase tracking-widest mb-1">Items</span>
                    <span className="font-body flex items-center gap-1.5 text-charcoal">
                      <Package className="w-3.5 h-3.5 text-terracotta" />
                      {registry.stats.totalItems}
                    </span>
                  </div>
                  <div>
                    <span className="block font-body text-[0.65rem] text-warm-gray uppercase tracking-widest mb-1">Guests</span>
                    <span className="font-body flex items-center gap-1.5 text-charcoal">
                      <Users className="w-3.5 h-3.5 text-terracotta" />
                      {registry.stats.totalGuests}
                    </span>
                  </div>
                  <div>
                    <span className="block font-body text-[0.65rem] text-warm-gray uppercase tracking-widest mb-1">Views</span>
                    <span className="font-body flex items-center gap-1.5 text-charcoal">
                      <Eye className="w-3.5 h-3.5 text-terracotta" />
                      {registry.viewCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-6 mt-auto bg-warm-white flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {registry.status === 'draft' && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/registry/${registry.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'active' }),
                          })
                          if (res.ok) {
                            toast.success('Registry published!')
                            fetchRegistries()
                          }
                        } catch {
                          toast.error('Failed to publish')
                        }
                      }}
                      className="inline-flex items-center justify-center w-10 h-10 bg-terracotta text-cream hover:bg-terracotta-light transition-colors"
                      title="Publish Registry"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => copyShareLink(registry.slug, registry.id)}
                    className="inline-flex items-center justify-center w-10 h-10 border border-sand text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
                    title="Copy Share Link"
                  >
                    {copiedId === registry.id ? <Check className="w-4 h-4 text-terracotta" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {registry.status === 'active' && (
                    <Link
                      href={`/registry/${registry.slug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center w-10 h-10 border border-sand text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
                      title="Preview Public Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                <Link
                  href={`/registry/${registry.id}/manage`}
                  className="inline-flex items-center gap-2 border border-charcoal text-charcoal px-5 py-2 font-body text-xs uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
                >
                  Manage
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Sections */}
      <div className="grid md:grid-cols-2 gap-8 border-t border-sand pt-16">
        {/* How It Works */}
        <div>
          <h3
            className="font-display text-charcoal mb-8"
            style={{ fontSize: '1.5rem', fontWeight: 300 }}
          >
            How It Works
          </h3>
          <div className="space-y-8">
            {[
              { step: 1, title: 'Create', desc: 'Set up your registry with event details and theme' },
              { step: 2, title: 'Add Items', desc: 'Browse products or add custom items to your list' },
              { step: 3, title: 'Share', desc: 'Send your unique link to friends and family' },
              { step: 4, title: 'Receive', desc: 'Track gifts and send thank you notes' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full border border-terracotta text-terracotta flex flex-col items-center justify-center font-display text-sm mt-0.5">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-body text-charcoal text-sm font-bold uppercase tracking-wider mb-1.5">{item.title}</h4>
                  <p className="font-body text-warm-gray text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-sand/30 p-8 lg:p-12">
          <h3
            className="font-display text-charcoal mb-8"
            style={{ fontSize: '1.5rem', fontWeight: 300 }}
          >
            Premium Features
          </h3>
          <div className="space-y-6">
            <div className="bg-cream p-6 border border-sand">
              <Heart className="w-5 h-5 text-terracotta mb-4" />
              <h4 className="font-body text-charcoal text-sm font-bold uppercase tracking-wider mb-2">Privacy Controls</h4>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                Choose between public visibility or password-protected access. You have full control over who gets to see your curated list and details.
              </p>
            </div>
            <div className="bg-cream p-6 border border-sand">
              <Gift className="w-5 h-5 text-terracotta mb-4" />
              <h4 className="font-body text-charcoal text-sm font-bold uppercase tracking-wider mb-2">Group Gifting</h4>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                Allow multiple people to contribute toward larger, high-ticket gifts so everyone can be a part of something truly monumental.
              </p>
            </div>
            <div className="bg-cream p-6 border border-sand">
              <Sparkles className="w-5 h-5 text-terracotta mb-4" />
              <h4 className="font-body text-charcoal text-sm font-bold uppercase tracking-wider mb-2">Thank You Manager</h4>
              <p className="font-body text-warm-gray text-sm leading-relaxed">
                Never miss a beat. Track exactly who gave what and manage personalized thank you notes directly from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
