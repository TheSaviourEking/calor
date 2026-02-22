'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Share2, Copy, Check, ShoppingBag, ExternalLink } from 'lucide-react'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { useCartStore, useWishlistStore, useLocaleStore } from '@/stores'
import { toast } from 'sonner'

interface SharedWishlistProps {
  wishlist: {
    id: string
    shareCode: string
    title: string | null
    description: string | null
    viewCount: number
    createdAt: Date
    customer: {
      firstName: string
      lastName: string
    }
    productIds: string[]
    products: Array<{
      id: string
      slug: string
      name: string
      shortDescription: string
      inventoryCount: number
      category: { name: string; slug: string }
      variants: Array<{ id: string; price: number; stock: number }>
      images: Array<{ url: string; altText: string }>
    }>
  }
}

export default function SharedWishlistClient({ wishlist }: SharedWishlistProps) {
  const { formatPrice } = useLocaleStore()
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, isInWishlist } = useWishlistStore()
  const [copied, setCopied] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddToCart = async (product: typeof wishlist.products[0]) => {
    setAddingToCart(product.id)
    const variant = product.variants[0]

    addToCart({
      id: product.id,
      name: product.name,
      price: variant?.price || 0,
      quantity: 1,
      variantId: variant?.id,
      image: product.images[0]?.url,
      productId: product.id,
      category: product.category.name,
    })

    toast.success(`Added ${product.name} to bag`)
    setAddingToCart(null)
  }

  const handleAddAllToCart = () => {
    wishlist.products.forEach(product => {
      const variant = product.variants[0]
      addToCart({
        id: product.id,
        name: product.name,
        price: variant?.price || 0,
        quantity: 1,
        variantId: variant?.id,
        image: product.images[0]?.url,
        productId: product.id,
        category: product.category.name,
      })
    })
    toast.success(`Added ${wishlist.products.length} items to bag`)
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-cream pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-warm-gray text-sm mb-4">
              <Heart className="w-4 h-4 fill-terracotta text-terracotta" />
              <span>Shared Wishlist</span>
            </div>

            <h1
              className="font-display text-charcoal mb-2"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300 }}
            >
              {wishlist.title || 'My Wishlist'}
            </h1>

            <p className="font-body text-warm-gray text-sm mb-4">
              Curated by {wishlist.customer.firstName} {wishlist.customer.lastName.charAt(0)}.
            </p>

            {wishlist.description && (
              <p className="font-body text-charcoal text-base max-w-2xl">
                {wishlist.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 border border-charcoal text-charcoal font-body text-sm hover:bg-charcoal hover:text-cream transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>

              {wishlist.products.length > 0 && (
                <button
                  onClick={handleAddAllToCart}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add All to Bag
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {wishlist.products.length === 0 ? (
            <div className="text-center py-16 bg-warm-white border border-sand">
              <Heart className="w-12 h-12 text-warm-gray mx-auto mb-4" />
              <p className="font-body text-warm-gray mb-4">
                This wishlist is empty.
              </p>
              <Link href="/shop" className="font-body text-terracotta text-sm hover:underline">
                Explore the collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {wishlist.products.map((product) => (
                <div key={product.id} className="group">
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

                    <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors" />

                    {/* Quick Add */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === product.id}
                      className="absolute bottom-4 left-4 right-4 bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta disabled:opacity-50"
                    >
                      {addingToCart === product.id ? 'Adding...' : 'Add to Bag'}
                    </button>
                  </div>

                  <div>
                    <span className="eyebrow text-[0.65rem]">{product.category.name}</span>
                    <Link href={`/product/${product.slug}`}>
                      <h3
                        className="font-display text-charcoal mt-1 mb-2 hover:text-terracotta transition-colors"
                        style={{ fontSize: '1.2rem', fontWeight: 400 }}
                      >
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-body text-warm-gray text-sm line-clamp-2 mb-3">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-body text-charcoal text-sm tracking-wide">
                        {formatPrice(product.variants[0]?.price || 0)}
                      </p>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-body text-terracotta text-xs hover:underline flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-sand text-center">
            <p className="font-body text-warm-gray text-xs mb-4">
              {wishlist.products.length} items · {wishlist.viewCount} views
            </p>
            <Link href="/shop" className="font-body text-terracotta text-sm hover:underline">
              Continue shopping on CALŌR
            </Link>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}
