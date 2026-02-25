'use client'

import { useState, useRef } from 'react'
import { Heart, ShoppingBag, Scale, Video, X, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore, useWishlistStore, useLocaleStore } from '@/stores'
import { useComparison } from '@/components/comparison/ComparisonContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import Link from 'next/link'

interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  badge: string | null
  originalPrice: number | null
  viewCount: number
  purchaseCount: number
  isDigital: boolean
  category: {
    name: string
    slug: string
  }
  variants: Array<{
    id: string
    price: number
  }>
  images: Array<{
    url: string
    altText: string
  }>
  videos?: Array<{
    url: string
    title: string | null
    videoType?: string
  }>
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { addItem } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { formatPrice } = useLocaleStore()
  const { addProduct, removeProduct, isInComparison } = useComparison()
  const [isAdding, setIsAdding] = useState(false)

  const isInWishlistState = isInWishlist(product.id)
  const inComparison = isInComparison(product.id)
  const price = product.variants[0]?.price || 0

  const handleAddToBag = () => {
    setIsAdding(true)
    addItem({
      id: `${product.id}-${product.variants[0]?.id || 'default'}`,
      productId: product.id,
      variantId: product.variants[0]?.id || '',
      name: product.name,
      category: product.category.name,
      price: price,
      quantity: 1,
      image: product.images[0]?.url,
    })
    toast.success('Added to bag')
    setTimeout(() => setIsAdding(false), 1000)
  }

  const handleWishlistToggle = () => {
    toggleItem(product.id)
    toast.success(isInWishlistState ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleComparisonToggle = () => {
    if (inComparison) {
      removeProduct(product.id)
      toast.success('Removed from comparison')
    } else {
      addProduct({
        id: product.id,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        category: product.category,
        variants: product.variants,
        images: product.images,
      })
      toast.success('Added to comparison')
    }
  }

  const badgeStyles: Record<string, string> = {
    'bestseller': 'bg-terracotta text-warm-white',
    'new': 'bg-charcoal text-warm-white',
    'sale': 'bg-ember text-warm-white',
    'editors-pick': 'bg-gold text-charcoal',
  }

  return (
    <div className="group relative text-left">
      {/* Media Area Component */}
      <div className="relative aspect-square bg-cream mb-4 overflow-hidden">
        {/* Main Product Link Wrapping the Image */}
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-cream to-sand">
              <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
                {product.name.charAt(0)}
              </span>
            </div>
          )}
        </Link>

        {/* Overlays (Interactive elements need higher z-index than the Link) */}

        {/* Badges Stack (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
          {product.badge && (
            <span className={`px-3 py-1 text-[0.6rem] font-body uppercase tracking-[0.2em] ${badgeStyles[product.badge.toLowerCase()] || 'bg-charcoal text-warm-white'}`}>
              {product.badge}
            </span>
          )}
          {product.isDigital && (
            <span className="px-2 py-0.5 text-[0.5rem] font-body bg-terracotta text-white uppercase tracking-widest">
              Digital
            </span>
          )}
          {product.originalPrice && product.originalPrice > price && (
            <span className="px-2 py-0.5 bg-terracotta text-white w-fit text-[0.5rem] font-bold uppercase tracking-widest">
              {Math.round(((product.originalPrice - price) / product.originalPrice) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Action Buttons (Top Right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          {product.videos && product.videos.length > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsVideoModalOpen(true)
              }}
              className="w-8 h-8 flex items-center justify-center bg-charcoal/80 backdrop-blur-sm text-cream transition-transform duration-300 hover:scale-110 hover:bg-terracotta"
              title="Watch Video"
            >
              <Video className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleWishlistToggle()
            }}
            className="w-8 h-8 flex items-center justify-center bg-warm-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-warm-white"
            aria-label={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${isInWishlistState ? 'fill-terracotta text-terracotta' : 'text-charcoal'}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleComparisonToggle()
            }}
            className={`w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${inComparison ? 'bg-terracotta text-warm-white' : 'bg-warm-white/80 text-charcoal hover:bg-warm-white hover:text-terracotta'}`}
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Button (Bottom) */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleAddToBag()
          }}
          disabled={isAdding}
          className="absolute bottom-3 left-3 right-3 bg-charcoal text-warm-white py-3 font-body text-xs uppercase tracking-wider opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-terracotta disabled:opacity-50 z-20"
        >
          {isAdding ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>

      {/* Info Area */}
      <Link href={`/product/${product.slug}`} className="block">
        <div>
          <span className="eyebrow text-[0.65rem]">{product.category.name}</span>
          <h3 className="font-display text-charcoal mt-1 mb-2 text-xl font-normal">
            {product.name}
          </h3>
          <p className="font-body text-warm-gray text-sm line-clamp-2 leading-relaxed h-10">
            {product.shortDescription}
          </p>
          <div className="flex justify-between items-end mt-3">
            <div className="flex items-baseline gap-2">
              <p className="font-body text-charcoal text-sm tracking-wide">
                {formatPrice(price)}
              </p>
              {product.originalPrice && product.originalPrice > price && (
                <p className="font-body text-warm-gray text-xs line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>
            {(product.purchaseCount > 20 || product.viewCount > 100) && (
              <span className="text-[0.6rem] font-body text-terracotta uppercase tracking-widest font-medium">
                {product.purchaseCount > 20 ? 'Most Popular' : 'Trending'}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Video Quick View Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-charcoal border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{product.name} Video</DialogTitle>
            <DialogDescription>Product Demonstration</DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video w-full bg-black">
            {product.videos?.[0] && (
              <video
                ref={videoRef}
                src={product.videos[0].url}
                className="w-full h-full"
                controls
                autoPlay
                onEnded={() => setIsVideoModalOpen(false)}
              />
            )}

            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 text-cream/50 hover:text-cream transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 bg-charcoal text-cream">
            <h3 className="font-display text-xl mb-1">{product.name}</h3>
            <p className="font-body text-cream/60 text-sm">Product Demonstration</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
