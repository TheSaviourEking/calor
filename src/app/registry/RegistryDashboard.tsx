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
      <div className="mb-8">
        <h1 
          className="font-display text-charcoal"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 300 }}
        >
          Gift Registry
        </h1>
        <p className="font-body text-warm-gray mt-2">
          Create and manage your gift registries for special occasions.
        </p>
      </div>

      {/* Create Button */}
        <Link
          href="/registry/new"
          className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider mb-8 hover:bg-terracotta transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Registry
        </Link>

        {registries.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-warm-white border border-sand">
            <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center mx-auto mb-6">
              <Gift className="w-8 h-8 text-terracotta" />
            </div>
            <h3 
              className="font-display text-charcoal mb-3"
              style={{ fontSize: '1.5rem', fontWeight: 300 }}
            >
              No registries yet
            </h3>
            <p className="font-body text-warm-gray max-w-md mx-auto mb-8">
              Create your first gift registry for a wedding, anniversary, birthday, or any special occasion.
            </p>
            
            {/* Registry Types Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto px-6">
              {[
                { type: 'wedding', icon: '💒', label: 'Wedding' },
                { type: 'anniversary', icon: '💕', label: 'Anniversary' },
                { type: 'birthday', icon: '🎂', label: 'Birthday' },
                { type: 'baby', icon: '👶', label: 'Baby Shower' },
                { type: 'housewarming', icon: '🏠', label: 'Housewarming' },
                { type: 'custom', icon: '✨', label: 'Custom' },
              ].map((item) => (
                <div
                  key={item.type}
                  className="p-4 border border-sand bg-cream hover:border-terracotta transition-colors cursor-pointer"
                  onClick={() => router.push(`/registry/new?type=${item.type}`)}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-body text-charcoal text-sm mt-2">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Registry List */
          <div className="space-y-6">
            {registries.map((registry) => (
              <div key={registry.id} className="bg-warm-white border border-sand overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-sand">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-body uppercase tracking-wider ${statusStyles[registry.status]}`}>
                          {registry.status}
                        </span>
                        <span className="eyebrow text-[0.6rem]">{registryTypeLabels[registry.registryType]}</span>
                      </div>
                      <h3 
                        className="font-display text-charcoal"
                        style={{ fontSize: '1.25rem', fontWeight: 400 }}
                      >
                        {registry.title}
                      </h3>
                      {registry.description && (
                        <p className="font-body text-warm-gray text-sm mt-1 line-clamp-1">
                          {registry.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Event Date */}
                    {registry.eventDate && (
                      <div className="text-right">
                        <p className="font-body text-warm-gray text-xs">Event Date</p>
                        <p className="font-body text-charcoal text-sm flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {formatDate(registry.eventDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6 bg-cream/50 border-b border-sand">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="font-body text-warm-gray text-xs mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-sand overflow-hidden">
                          <div 
                            className="h-full bg-terracotta transition-all"
                            style={{ width: `${registry.stats.completionPercentage}%` }}
                          />
                        </div>
                        <span className="font-body text-charcoal text-sm">
                          {registry.stats.completionPercentage}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-body text-warm-gray text-xs mb-1">Items</p>
                      <p className="font-body text-charcoal flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {registry.stats.totalItems}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-warm-gray text-xs mb-1">Guests</p>
                      <p className="font-body text-charcoal flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {registry.stats.totalGuests}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-warm-gray text-xs mb-1">Views</p>
                      <p className="font-body text-charcoal flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {registry.viewCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 flex flex-wrap gap-3">
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
                      className="inline-flex items-center gap-2 bg-terracotta text-cream px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Publish
                    </button>
                  )}
                  
                  <button
                    onClick={() => copyShareLink(registry.slug, registry.id)}
                    className="inline-flex items-center gap-2 border border-sand px-4 py-2 font-body text-sm text-charcoal hover:border-terracotta transition-colors"
                  >
                    {copiedId === registry.id ? (
                      <>
                        <Check className="w-4 h-4 text-terracotta" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>

                  {registry.status === 'active' && (
                    <Link
                      href={`/registry/${registry.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 border border-sand px-4 py-2 font-body text-sm text-charcoal hover:border-terracotta transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </Link>
                  )}

                  <Link
                    href={`/registry/${registry.id}/manage`}
                    className="inline-flex items-center gap-2 border border-charcoal text-charcoal px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 p-8 bg-warm-white border border-sand">
          <h3 
            className="font-display text-charcoal mb-6 text-center"
            style={{ fontSize: '1.25rem', fontWeight: 400 }}
          >
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Create', desc: 'Set up your registry with event details and theme' },
              { step: 2, title: 'Add Items', desc: 'Browse products or add custom items to your list' },
              { step: 3, title: 'Share', desc: 'Send your unique link to friends and family' },
              { step: 4, title: 'Receive', desc: 'Track gifts and send thank you notes' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-terracotta/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-display text-terracotta" style={{ fontWeight: 400 }}>
                    {item.step}
                  </span>
                </div>
                <h4 className="font-body text-charcoal text-sm font-medium mb-1">{item.title}</h4>
                <p className="font-body text-warm-gray text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 border border-sand bg-cream/30">
            <Heart className="w-6 h-6 text-terracotta mb-3" />
            <h4 className="font-body text-charcoal text-sm font-medium mb-2">Privacy Controls</h4>
            <p className="font-body text-warm-gray text-xs">
              Make your registry public or password-protected. You control who sees it.
            </p>
          </div>
          <div className="p-6 border border-sand bg-cream/30">
            <Gift className="w-6 h-6 text-terracotta mb-3" />
            <h4 className="font-body text-charcoal text-sm font-medium mb-2">Group Gifting</h4>
            <p className="font-body text-warm-gray text-xs">
              Allow multiple people to contribute toward larger gifts.
            </p>
          </div>
          <div className="p-6 border border-sand bg-cream/30">
            <Sparkles className="w-6 h-6 text-terracotta mb-3" />
            <h4 className="font-body text-charcoal text-sm font-medium mb-2">Thank You Notes</h4>
            <p className="font-body text-warm-gray text-xs">
              Track who gave what and send personalized thank you messages.
            </p>
          </div>
        </div>
    </>
  )
}
