'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Gift, Plus, Settings, Users, Calendar, Package, Eye,
  Trash2, Edit3, ChevronRight, Copy, Check, ExternalLink,
  Mail, Send, X, Search, GripVertical
} from 'lucide-react'
import { toast } from 'sonner'

interface RegistryItem {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: number
  originalPrice: number | null
  quantity: number
  purchasedCount: number
  priority: string
  category: string | null
  notes: string | null
  sortOrder: number
  product: {
    id: string
    slug: string
    name: string
    images: Array<{ url: string }>
    variants: Array<{ price: number }>
  } | null
  purchases: Array<{ id: string; purchaserName: string }>
  contributions: Array<{ amountCents: number }>
}

interface RegistryGuest {
  id: string
  email: string
  name: string | null
  phone: string | null
  rsvpStatus: string
  invitedAt: string | null
  viewedAt: string | null
}

interface RegistryEvent {
  id: string
  name: string
  eventType: string
  date: string
  location: string | null
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
  password: string | null
  status: string
  viewCount: number
  allowGiftMessages: boolean
  allowPartialPurchases: boolean
  allowThankYouNotes: boolean
  showPurchaserInfo: boolean
  items: RegistryItem[]
  guests: RegistryGuest[]
  events: RegistryEvent[]
  stats: {
    totalValue: number
    purchasedValue: number
    completionPercentage: number
    totalItems: number
    purchasedItems: number
    totalGuests: number
    attendingGuests: number
  }
}

const priorityOptions = [
  { value: 'must_have', label: 'Must Have' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'nice_to_have', label: 'Nice to Have' },
]

interface ManageRegistryClientProps {
  initialRegistry?: Registry | null
}

export default function ManageRegistryClient({ initialRegistry = null }: ManageRegistryClientProps) {
  const params = useParams()
  const router = useRouter()
  const registrySlug = params.slug as string

  const [registry, setRegistry] = useState<Registry | null>(initialRegistry)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'items' | 'guests' | 'events' | 'settings'>('items')
  const [copied, setCopied] = useState(false)

  // Add item modal
  const [showAddItem, setShowAddItem] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    name: string
    slug: string
    images: Array<{ url: string }>
    variants: Array<{ price: number }>
  }>>([])

  // Add guest modal
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [newGuests, setNewGuests] = useState('')

  // Add event modal
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    name: '',
    eventType: 'ceremony',
    date: '',
    location: '',
  })

  // Removed useEffect initial fetch

  const fetchRegistry = async () => {
    try {
      // Fetch by slug to get the registry data
      const res = await fetch(`/api/registry/slug/${registrySlug}?includeAll=true`)
      if (res.ok) {
        const data = await res.json()
        setRegistry(data.registry)
      } else {
        router.push('/registry')
      }
    } catch (error) {
      console.error('Error fetching registry:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    if (!registry) return
    const url = `${window.location.origin}/registry/${registry.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Share link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const searchProducts = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.products || [])
      }
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  const addProductToRegistry = async (product: { id: string; name: string; variants: Array<{ price: number }>; images: Array<{ url: string }> }) => {
    if (!registry) return
    try {
      const res = await fetch(`/api/registry/${registry.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.variants[0]?.price || 0,
          imageUrl: product.images[0]?.url,
        }),
      })
      if (res.ok) {
        toast.success('Product added!')
        setShowAddItem(false)
        setSearchQuery('')
        setSearchResults([])
        fetchRegistry()
      }
    } catch {
      toast.error('Failed to add product')
    }
  }

  const removeItem = async (itemId: string) => {
    if (!registry) return
    if (!confirm('Remove this item from the registry?')) return
    try {
      const res = await fetch(`/api/registry/${registry.id}/items?itemId=${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Item removed')
        fetchRegistry()
      }
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const addGuests = async () => {
    if (!registry) return
    const emails = newGuests.split('\n').map(e => e.trim()).filter(e => e.includes('@'))
    if (emails.length === 0) {
      toast.error('Please enter valid email addresses')
      return
    }

    try {
      const res = await fetch(`/api/registry/${registry.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guests: emails.map(email => ({ email })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.added} guest(s) added`)
        setShowAddGuest(false)
        setNewGuests('')
        fetchRegistry()
      }
    } catch {
      toast.error('Failed to add guests')
    }
  }

  const addEvent = async () => {
    if (!registry) return
    if (!newEvent.name || !newEvent.date) {
      toast.error('Please fill in event name and date')
      return
    }

    try {
      const res = await fetch(`/api/registry/${registry.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
      if (res.ok) {
        toast.success('Event added!')
        setShowAddEvent(false)
        setNewEvent({ name: '', eventType: 'ceremony', date: '', location: '' })
        fetchRegistry()
      }
    } catch {
      toast.error('Failed to add event')
    }
  }

  const updateSettings = async (updates: Record<string, unknown>) => {
    if (!registry) return
    try {
      const res = await fetch(`/api/registry/${registry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        toast.success('Settings updated')
        fetchRegistry()
      }
    } catch {
      toast.error('Failed to update settings')
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-warm-gray">Loading...</p>
      </div>
    )
  }

  if (!registry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-warm-gray">Registry not found</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link href="/registry" className="font-body text-warm-gray hover:text-terracotta">
            Registries
          </Link>
          <ChevronRight className="w-4 h-4 text-sand" />
          <span className="font-body text-charcoal">{registry.title}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="font-display text-charcoal"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
            >
              {registry.title}
            </h1>
            <p className="font-body text-warm-gray text-sm mt-1">
              {registry.stats.totalItems} items · {registry.stats.completionPercentage}% complete
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 border border-sand px-4 py-2 font-body text-sm text-charcoal hover:border-terracotta transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-terracotta" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
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
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-warm-white border border-sand">
            <p className="font-body text-warm-gray text-xs">Total Value</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {formatPrice(registry.stats.totalValue)}
            </p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <p className="font-body text-warm-gray text-xs">Purchased</p>
            <p className="font-display text-terracotta text-xl" style={{ fontWeight: 400 }}>
              {formatPrice(registry.stats.purchasedValue)}
            </p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <p className="font-body text-warm-gray text-xs">Guests</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {registry.stats.totalGuests}
            </p>
          </div>
          <div className="p-4 bg-warm-white border border-sand">
            <p className="font-body text-warm-gray text-xs">Views</p>
            <p className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
              {registry.viewCount}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand mb-6">
        {[
          { id: 'items', label: 'Items', count: registry.items.length },
          { id: 'guests', label: 'Guests', count: registry.guests.length },
          { id: 'events', label: 'Events', count: registry.events.length },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-body text-sm transition-colors ${activeTab === tab.id
                ? 'text-charcoal border-b-2 border-charcoal'
                : 'text-warm-gray hover:text-terracotta'
              }`}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-body text-charcoal text-sm">
              {registry.items.filter(i => i.purchasedCount >= i.quantity).length} of {registry.items.length} items purchased
            </p>
            <button
              onClick={() => setShowAddItem(true)}
              className="inline-flex items-center gap-2 bg-charcoal text-cream px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {registry.items.length === 0 ? (
            <div className="text-center py-12 bg-warm-white border border-sand">
              <Package className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray">No items yet</p>
              <button
                onClick={() => setShowAddItem(true)}
                className="mt-4 text-terracotta font-body text-sm hover:underline"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {registry.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-warm-white border border-sand">
                  {/* Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-cream to-sand flex-shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-charcoal text-sm truncate">{item.name}</p>
                    <p className="font-body text-warm-gray text-xs">
                      {formatPrice(item.price)} · {item.purchasedCount}/{item.quantity} purchased
                    </p>
                  </div>

                  {/* Status */}
                  {item.purchasedCount >= item.quantity ? (
                    <span className="px-2 py-1 bg-gold/20 text-gold text-xs font-body">Purchased</span>
                  ) : item.purchasedCount > 0 ? (
                    <span className="px-2 py-1 bg-terracotta/10 text-terracotta text-xs font-body">
                      {item.quantity - item.purchasedCount} remaining
                    </span>
                  ) : null}

                  {/* Actions */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-warm-gray hover:text-ember transition-colors"
                    disabled={item.purchasedCount > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guests Tab */}
      {activeTab === 'guests' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-body text-charcoal text-sm">
              {registry.stats.attendingGuests} of {registry.stats.totalGuests} attending
            </p>
            <button
              onClick={() => setShowAddGuest(true)}
              className="inline-flex items-center gap-2 bg-charcoal text-cream px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Guests
            </button>
          </div>

          {registry.guests.length === 0 ? (
            <div className="text-center py-12 bg-warm-white border border-sand">
              <Users className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray">No guests invited yet</p>
            </div>
          ) : (
            <div className="border border-sand divide-y divide-sand">
              {registry.guests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-4 bg-warm-white">
                  <div>
                    <p className="font-body text-charcoal text-sm">
                      {guest.name || guest.email}
                    </p>
                    <p className="font-body text-warm-gray text-xs">{guest.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-body ${guest.rsvpStatus === 'attending' ? 'bg-green-100 text-green-700' :
                      guest.rsvpStatus === 'declined' ? 'bg-ember/10 text-ember' :
                        'bg-sand text-mid-gray'
                    }`}>
                    {guest.rsvpStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-body text-charcoal text-sm">{registry.events.length} events scheduled</p>
            <button
              onClick={() => setShowAddEvent(true)}
              className="inline-flex items-center gap-2 bg-charcoal text-cream px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>

          {registry.events.length === 0 ? (
            <div className="text-center py-12 bg-warm-white border border-sand">
              <Calendar className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray">No events scheduled</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {registry.events.map((event) => (
                <div key={event.id} className="p-4 bg-warm-white border border-sand">
                  <p className="font-body text-terracotta text-xs uppercase tracking-wider">
                    {event.eventType}
                  </p>
                  <p className="font-display text-charcoal mt-1" style={{ fontWeight: 400 }}>
                    {event.name}
                  </p>
                  <p className="font-body text-warm-gray text-sm mt-2">
                    {formatDate(event.date)}
                  </p>
                  {event.location && (
                    <p className="font-body text-warm-gray text-xs">{event.location}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Status */}
          <div className="p-6 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal font-medium mb-4">Registry Status</h3>
            <div className="flex gap-2">
              {['draft', 'active', 'completed', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateSettings({ status })}
                  className={`px-4 py-2 font-body text-sm capitalize ${registry.status === status
                      ? 'bg-charcoal text-cream'
                      : 'border border-sand text-charcoal hover:border-terracotta'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="p-6 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal font-medium mb-4">Privacy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-charcoal text-sm">Public Registry</p>
                  <p className="font-body text-warm-gray text-xs">Anyone with the link can view</p>
                </div>
                <button
                  onClick={() => updateSettings({ isPublic: !registry.isPublic })}
                  className={`relative w-12 h-6 transition-colors ${registry.isPublic ? 'bg-terracotta' : 'bg-sand'
                    }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${registry.isPublic ? 'right-1' : 'left-1'
                    }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="p-6 bg-warm-white border border-sand">
            <h3 className="font-body text-charcoal font-medium mb-4">Features</h3>
            <div className="space-y-4">
              {[
                { key: 'allowGiftMessages', label: 'Gift Messages', desc: 'Allow guests to include messages' },
                { key: 'allowPartialPurchases', label: 'Group Gifting', desc: 'Allow contributions toward items' },
                { key: 'allowThankYouNotes', label: 'Thank You Notes', desc: 'Send thank you messages' },
                { key: 'showPurchaserInfo', label: 'Show Purchasers', desc: 'Display who bought each item' },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-charcoal text-sm">{feature.label}</p>
                    <p className="font-body text-warm-gray text-xs">{feature.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ [feature.key]: !registry[feature.key as keyof Registry] })}
                    className={`relative w-12 h-6 transition-colors ${registry[feature.key as keyof Registry] ? 'bg-terracotta' : 'bg-sand'
                      }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-cream transition-transform ${registry[feature.key as keyof Registry] ? 'right-1' : 'left-1'
                      }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 border border-ember/20 bg-ember/5">
            <h3 className="font-body text-ember font-medium mb-4">Danger Zone</h3>
            <button
              onClick={async () => {
                if (!registry) return
                if (!confirm('Are you sure you want to delete this registry? This cannot be undone.')) return
                try {
                  const res = await fetch(`/api/registry/${registry.id}`, { method: 'DELETE' })
                  if (res.ok) {
                    toast.success('Registry deleted')
                    router.push('/registry')
                  }
                } catch {
                  toast.error('Failed to delete registry')
                }
              }}
              className="border border-ember text-ember px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-ember hover:text-warm-white transition-colors"
            >
              Delete Registry
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white border border-sand w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>Add Item</h3>
              <button onClick={() => setShowAddItem(false)} className="text-warm-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => searchProducts(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="mt-2 border border-sand max-h-64 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProductToRegistry(product)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-cream text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-cream to-sand flex-shrink-0">
                        {product.images[0]?.url && (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-body text-charcoal text-sm">{product.name}</p>
                        <p className="font-body text-warm-gray text-xs">
                          {formatPrice(product.variants[0]?.price || 0)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white border border-sand w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>Add Guests</h3>
              <button onClick={() => setShowAddGuest(false)} className="text-warm-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={newGuests}
                onChange={(e) => setNewGuests(e.target.value)}
                placeholder="Enter email addresses (one per line)"
                rows={5}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
              />
              <button
                onClick={addGuests}
                className="w-full mt-4 bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Add Guests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white border border-sand w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-sand">
              <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>Add Event</h3>
              <button onClick={() => setShowAddEvent(false)} className="text-warm-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                placeholder="Event name"
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              />
              <select
                value={newEvent.eventType}
                onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              >
                <option value="ceremony">Ceremony</option>
                <option value="reception">Reception</option>
                <option value="shower">Shower</option>
                <option value="party">Party</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              />
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Location (optional)"
                className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              />
              <button
                onClick={addEvent}
                className="w-full bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
