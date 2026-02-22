'use client'

import { useEffect, useState } from 'react'
import { Heart, Share2, Link as LinkIcon, Copy, Check, X, Loader2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useWishlistStore, useLocaleStore, useCartStore } from '@/stores'
import { toast } from 'sonner'

interface WishlistProduct {
  id: string
  slug: string
  name: string
  shortDescription: string
  category: { name: string; slug: string }
  variants: Array<{ id: string; price: number; stock: number }>
  images: Array<{ url: string; altText: string }>
}

interface SharedWishlist {
  id: string
  shareCode: string
  title: string | null
  viewCount: number
  createdAt: string
}

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const { formatPrice } = useLocaleStore()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [sharedWishlists, setSharedWishlists] = useState<SharedWishlist[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [creatingShare, setCreatingShare] = useState(false)
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch products
  useEffect(() => {
    async function fetchWishlistProducts() {
      if (items.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: items }),
        })

        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistProducts()
  }, [items])

  // Fetch shared wishlists
  useEffect(() => {
    async function fetchSharedWishlists() {
      try {
        const res = await fetch('/api/wishlist/share')
        if (res.ok) {
          const data = await res.json()
          setSharedWishlists(data.wishlists || [])
        }
      } catch (error) {
        console.error('Error fetching shared wishlists:', error)
      }
    }

    fetchSharedWishlists()
  }, [])

  const handleAddToCart = (product: WishlistProduct) => {
    const variant = product.variants[0]
    addToCart({
      id: product.id,
      name: product.name,
      price: variant?.price || 0,
      quantity: 1,
      variantId: variant?.id,
      image: product.images[0]?.url,
    })
    toast.success(`Added ${product.name} to bag`)
  }

  const handleCreateShare = async () => {
    if (items.length === 0) {
      toast.error('Your wishlist is empty')
      return
    }

    setCreatingShare(true)
    try {
      const res = await fetch('/api/wishlist/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: items,
          title: shareTitle || 'My Wishlist',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewShareUrl(data.shareUrl)
        setSharedWishlists(prev => [{
          id: data.wishlist.id,
          shareCode: data.shareCode,
          title: data.wishlist.title,
          viewCount: 0,
          createdAt: data.wishlist.createdAt,
        }, ...prev])
        toast.success('Share link created!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create share link')
      }
    } catch (error) {
      toast.error('Failed to create share link')
    } finally {
      setCreatingShare(false)
    }
  }

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteShare = async (shareCode: string) => {
    try {
      const res = await fetch(`/api/wishlist/share?shareCode=${shareCode}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSharedWishlists(prev => prev.filter(w => w.shareCode !== shareCode))
        toast.success('Share link deleted')
      }
    } catch (error) {
      toast.error('Failed to delete share link')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 
            className="font-display text-charcoal mb-2"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
          >
            Wishlist
          </h1>
          <p className="font-body text-warm-gray">Your saved items</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 bg-warm-white border border-sand">
          <Loader2 className="w-8 h-8 text-warm-gray animate-spin mx-auto mb-4" />
          <p className="font-body text-warm-gray">Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-warm-white border border-sand">
          <Heart className="w-12 h-12 text-warm-gray mx-auto mb-4" />
          <p className="font-body text-warm-gray mb-4">
            Nothing saved yet. Take your time.
          </p>
          <Link href="/shop" className="font-body text-terracotta text-sm hover:underline">
            Explore the collection
          </Link>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product) => (
              <div key={product.id} className="group bg-warm-white border border-sand p-4">
                <div className="relative aspect-square bg-gradient-to-br from-cream to-sand mb-4 overflow-hidden">
                  {product.images[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
                        {product.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-warm-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-warm-white"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="w-4 h-4 fill-terracotta text-terracotta" />
                  </button>
                </div>
                <div>
                  <span className="eyebrow text-[0.65rem]">{product.category.name}</span>
                  <Link href={`/product/${product.slug}`}>
                    <h3 
                      className="font-display text-charcoal mt-1 mb-2 hover:text-terracotta transition-colors"
                      style={{ fontSize: '1.1rem', fontWeight: 400 }}
                    >
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-body text-charcoal text-sm tracking-wide">
                      {formatPrice(product.variants[0]?.price || 0)}
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="font-body text-terracotta text-sm hover:underline flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      Add to Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shared Wishlists */}
          {sharedWishlists.length > 0 && (
            <div className="border-t border-sand pt-8">
              <h2 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
                Shared Links
              </h2>
              <div className="space-y-3">
                {sharedWishlists.map((wishlist) => (
                  <div 
                    key={wishlist.id}
                    className="flex items-center justify-between p-4 bg-warm-white border border-sand"
                  >
                    <div>
                      <p className="font-body text-charcoal text-sm">
                        {wishlist.title || 'My Wishlist'}
                      </p>
                      <p className="font-body text-warm-gray text-xs mt-1">
                        {wishlist.viewCount} views · Created {new Date(wishlist.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(`${window.location.origin}/wishlist/${wishlist.shareCode}`)}
                        className="p-2 hover:bg-sand transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4 text-warm-gray" />
                      </button>
                      <Link
                        href={`/wishlist/${wishlist.shareCode}`}
                        className="p-2 hover:bg-sand transition-colors"
                        target="_blank"
                        title="View"
                      >
                        <LinkIcon className="w-4 h-4 text-warm-gray" />
                      </Link>
                      <button
                        onClick={() => handleDeleteShare(wishlist.shareCode)}
                        className="p-2 hover:bg-sand transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-warm-gray" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50">
          <div className="bg-warm-white p-6 max-w-md w-full mx-4 border border-sand">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                Share Your Wishlist
              </h3>
              <button
                onClick={() => {
                  setShowShareModal(false)
                  setNewShareUrl(null)
                  setShareTitle('')
                }}
                className="p-1 hover:bg-sand transition-colors"
              >
                <X className="w-5 h-5 text-warm-gray" />
              </button>
            </div>

            {newShareUrl ? (
              <div className="space-y-4">
                <p className="font-body text-charcoal text-sm">
                  Your wishlist is now shareable!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newShareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-sand bg-cream font-body text-sm"
                  />
                  <button
                    onClick={() => handleCopyLink(newShareUrl)}
                    className="px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="font-body text-warm-gray text-xs">
                  Anyone with this link can view your wishlist
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="font-body text-charcoal text-sm mb-2 block">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                    placeholder="My Wishlist"
                    className="w-full px-3 py-2 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>
                <p className="font-body text-warm-gray text-xs">
                  This will create a shareable link with {items.length} items
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 px-4 py-2 border border-charcoal text-charcoal font-body text-sm uppercase tracking-wider hover:bg-charcoal hover:text-cream transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShare}
                    disabled={creatingShare}
                    className="flex-1 px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors disabled:opacity-50"
                  >
                    {creatingShare ? 'Creating...' : 'Create Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
