'use client'

import { useState } from 'react'
import { Heart, ShoppingBag, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore, useWishlistStore, useLocaleStore } from '@/stores'
import { useComparison } from '@/components/comparison/ComparisonContext'

interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  badge: string | null
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
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
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
    <div className="group">
      {/* Image Area */}
      <div className="relative aspect-square bg-gradient-to-br from-cream to-sand mb-4 overflow-hidden">
        {/* Placeholder gradient - in production this would be the product image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
            {product.name.charAt(0)}
          </span>
        </div>

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-body uppercase tracking-wider ${badgeStyles[product.badge] || 'bg-charcoal text-warm-white'}`}>
            {product.badge.replace('-', ' ')}
          </span>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="w-8 h-8 flex items-center justify-center bg-warm-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-warm-white"
            aria-label={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-4 h-4 transition-all duration-300 ${
                isInWishlistState 
                  ? 'fill-terracotta text-terracotta' 
                  : 'text-charcoal hover:text-terracotta'
              }`} 
              
            />
          </button>
          
          {/* Compare Button */}
          <button
            onClick={handleComparisonToggle}
            className={`w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
              inComparison 
                ? 'bg-terracotta text-warm-white' 
                : 'bg-warm-white/80 text-charcoal hover:bg-warm-white hover:text-terracotta'
            }`}
            aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
          >
            <Scale className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToBag}
          disabled={isAdding}
          className="absolute bottom-3 left-3 right-3 bg-charcoal text-warm-white py-3 font-body text-xs uppercase tracking-wider opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-terracotta disabled:opacity-50"
        >
          {isAdding ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>

      {/* Product Info */}
      <div>
        <span className="eyebrow text-[0.65rem]">{product.category.name}</span>
        <h3 
          className="font-display text-charcoal mt-1 mb-2"
          style={{ fontSize: '1.2rem', fontWeight: 400 }}
        >
          {product.name}
        </h3>
        <p className="font-body text-warm-gray text-sm line-clamp-2 leading-relaxed">
          {product.shortDescription}
        </p>
        <p className="font-body text-charcoal text-sm mt-3 tracking-wide">
          {formatPrice(price)}
        </p>
      </div>
    </div>
  )
}
