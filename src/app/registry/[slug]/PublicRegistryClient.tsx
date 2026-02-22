'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Gift, Calendar, MapPin, Lock, ShoppingBag, Heart, Users,
  Package, ChevronRight, Share2, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { useCartStore, useLocaleStore } from '@/stores'

interface RegistryItem {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: number
  originalPrice: number | null
  quantity: number
  purchasedCount: number
  remaining: number
  priority: string
  category: string | null
  notes: string | null
  product: {
    id: string
    slug: string
    name: string
    category: { name: string }
  } | null
  contributionTotal: number
}

interface RegistryEvent {
  id: string
  name: string
  eventType: string
  date: string
  location: string | null
}

interface PublicRegistry {
  id: string
  title: string
  description: string | null
  registryType: string
  eventDate: string | null
  eventLocation: string | null
  theme: string
  primaryColor: string | null
  coverImage: string | null
  allowGiftMessages: boolean
  allowPartialPurchases: boolean
  showPurchaserInfo: boolean
  ownerName: string
  events: RegistryEvent[]
  items: RegistryItem[]
  stats: {
    totalValue: number
    purchasedValue: number
    completionPercentage: number
    totalItems: number
    availableItems: number
  }
}

const priorityLabels: Record<string, string> = {
  must_have: 'Must Have',
  high: 'High Priority',
  medium: 'Medium',
  low: 'Low',
  nice_to_have: 'Nice to Have',
}

const priorityStyles: Record<string, string> = {
  must_have: 'bg-terracotta text-cream',
  high: 'bg-gold/20 text-gold',
  medium: 'bg-sand text-mid-gray',
  low: 'bg-cream text-warm-gray',
  nice_to_have: 'bg-cream text-warm-gray',
}

interface PublicRegistryClientProps {
  initialRegistry?: PublicRegistry | null
  initialRequiresPassword?: boolean
}

export default function PublicRegistryClient({
  initialRegistry = null,
  initialRequiresPassword = false
}: PublicRegistryClientProps) {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [registry, setRegistry] = useState<PublicRegistry | null>(initialRegistry)
  const [loading, setLoading] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState(initialRequiresPassword)
  const [password, setPassword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copied, setCopied] = useState(false)

  const { addItem } = useCartStore()
  const { formatPrice } = useLocaleStore()

  const fetchRegistry = async (pwd?: string) => {
    setLoading(true)
    try {
      const url = pwd
        ? `/api/registry/slug/${slug}?password=${encodeURIComponent(pwd)}`
        : `/api/registry/slug/${slug}`

      const res = await fetch(url)

      if (res.status === 401) {
        const data = await res.json()
        if (data.requiresPassword) {
          setRequiresPassword(true)
        }
      } else if (res.ok) {
        const data = await res.json()
        setRegistry(data.registry)
        setRequiresPassword(false)
      }
    } catch (error) {
      console.error('Error fetching registry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRegistry(password)
  }

  const addToCart = (item: RegistryItem) => {
    addItem({
      id: `registry-${item.id}`,
      productId: item.product?.id || '',
      variantId: '',
      name: item.name,
      category: item.category || item.product?.category?.name || 'Registry Item',
      price: item.price,
      quantity: 1,
      image: item.imageUrl || undefined,
    })
    toast.success('Added to bag!')
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get unique categories
  const categories = registry
    ? ['all', ...new Set(registry.items.map(i => i.category).filter(Boolean) as string[])]
    : ['all']

  // Filter items
  const filteredItems = registry?.items.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  ) || []

  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <p className="font-body text-warm-gray">Loading...</p>
        </div>
      </ClientWrapper>
    )
  }

  if (requiresPassword && !registry) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream">
          <div className="max-w-md mx-auto px-6 py-16">
            <div className="text-center mb-8">
              <Lock className="w-12 h-12 text-terracotta mx-auto mb-4" />
              <h1
                className="font-display text-charcoal"
                style={{ fontSize: '1.5rem', fontWeight: 300 }}
              >
                Password Required
              </h1>
              <p className="font-body text-warm-gray text-sm mt-2">
                This registry is password protected.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
              />
              <button
                type="submit"
                className="w-full bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Access Registry
              </button>
            </form>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  if (!registry) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 bg-cream">
          <div className="max-w-md mx-auto px-6 py-16 text-center">
            <Gift className="w-12 h-12 text-warm-gray mx-auto mb-4" />
            <h1 className="font-display text-charcoal text-xl">Registry Not Found</h1>
            <p className="font-body text-warm-gray text-sm mt-2">
              This registry may have been removed or is no longer available.
            </p>
            <Link href="/shop" className="inline-block mt-6 text-terracotta font-body text-sm hover:underline">
              Browse Products
            </Link>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-cream via-sand/50 to-blush/30 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center">
              <span className="eyebrow">{registry.registryType.replace('_', ' ')} Registry</span>
              <h1
                className="font-display text-charcoal mt-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
              >
                {registry.title}
              </h1>
              <p className="font-body text-warm-gray mt-2">
                For {registry.ownerName}
              </p>

              {/* Event Info */}
              {(registry.eventDate || registry.eventLocation) && (
                <div className="flex items-center justify-center gap-6 mt-4 font-body text-sm text-warm-gray">
                  {registry.eventDate && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-terracotta" />
                      {formatDate(registry.eventDate)}
                    </span>
                  )}
                  {registry.eventLocation && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-terracotta" />
                      {registry.eventLocation}
                    </span>
                  )}
                </div>
              )}

              {/* Share Button */}
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-sand font-body text-sm text-charcoal hover:border-terracotta transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-terracotta" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Share Registry
                  </>
                )}
              </button>
            </div>

            {/* Progress */}
            <div className="mt-8 p-4 bg-warm-white border border-sand">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-charcoal text-sm">Progress</span>
                <span className="font-body text-terracotta text-sm">
                  {registry.stats.completionPercentage}% Complete
                </span>
              </div>
              <div className="h-2 bg-sand overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all"
                  style={{ width: `${registry.stats.completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 font-body text-xs text-warm-gray">
                <span>{registry.stats.availableItems} items remaining</span>
                <span>{formatPrice(registry.stats.purchasedValue)} of {formatPrice(registry.stats.totalValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Events Timeline */}
        {registry.events.length > 0 && (
          <div className="bg-warm-white border-y border-sand py-8">
            <div className="max-w-4xl mx-auto px-6">
              <h3 className="font-display text-charcoal mb-4" style={{ fontWeight: 400 }}>
                Events
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {registry.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex-shrink-0 p-4 border border-sand bg-cream"
                  >
                    <p className="font-body text-terracotta text-xs uppercase tracking-wider">
                      {event.eventType}
                    </p>
                    <p className="font-body text-charcoal text-sm mt-1">{event.name}</p>
                    <p className="font-body text-warm-gray text-xs mt-1">
                      {formatDate(event.date)}
                    </p>
                    {event.location && (
                      <p className="font-body text-warm-gray text-xs">{event.location}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Items Section */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 font-body text-sm transition-colors ${selectedCategory === cat
                    ? 'bg-charcoal text-cream'
                    : 'border border-sand text-charcoal hover:border-terracotta'
                    }`}
                >
                  {cat === 'all' ? 'All Items' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-warm-white border border-sand">
              <Package className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray">All items have been purchased!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-warm-white border border-sand overflow-hidden">
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-cream to-sand">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-16 h-16 text-sand" />
                      </div>
                    )}

                    {/* Priority Badge */}
                    <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-body uppercase tracking-wider ${priorityStyles[item.priority] || 'bg-sand text-mid-gray'}`}>
                      {priorityLabels[item.priority] || item.priority}
                    </span>

                    {/* Remaining Badge */}
                    {item.remaining < item.quantity && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-charcoal text-cream text-xs font-body">
                        {item.remaining} of {item.quantity} remaining
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-body text-warm-gray text-xs">
                      {item.category || item.product?.category?.name || 'Gift Item'}
                    </p>
                    <h3
                      className="font-display text-charcoal mt-1"
                      style={{ fontSize: '1.1rem', fontWeight: 400 }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="font-body text-warm-gray text-sm mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.notes && (
                      <p className="font-body text-terracotta text-xs mt-2 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="font-body text-charcoal text-sm">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="font-body text-warm-gray text-xs line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Contribution Progress */}
                    {registry.allowPartialPurchases && item.contributionTotal > 0 && item.contributionTotal < item.price && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-body text-warm-gray mb-1">
                          <span>Contributions</span>
                          <span>{formatPrice(item.contributionTotal)} of {formatPrice(item.price)}</span>
                        </div>
                        <div className="h-1 bg-sand overflow-hidden">
                          <div
                            className="h-full bg-gold"
                            style={{ width: `${(item.contributionTotal / item.price) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {item.product ? (
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="flex-1 bg-charcoal text-cream py-2 font-body text-sm uppercase tracking-wider text-center hover:bg-terracotta transition-colors"
                        >
                          View Details
                        </Link>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="flex-1 bg-charcoal text-cream py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                        >
                          Add to Bag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-warm-white border-t border-sand py-8">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Gift className="w-8 h-8 text-terracotta mx-auto mb-3" />
            <p className="font-body text-charcoal text-sm">
              Your gift will be shipped directly to {registry.ownerName}
            </p>
            <p className="font-body text-warm-gray text-xs mt-1">
              All gifts are packaged discreetly with care
            </p>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}
