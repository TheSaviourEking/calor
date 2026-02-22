'use client'

import { useState } from 'react'
import { Grid, List, ArrowUpDown, Loader2, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore, useWishlistStore, useLocaleStore } from '@/stores'

interface SearchResult {
  id: string
  slug: string
  name: string
  shortDescription: string
  badge: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  variants: Array<{
    id: string
    price: number
    stock: number
  }>
  images: Array<{
    url: string
    altText: string
  }>
  inventoryCount: number
  isDigital: boolean
  reviewCount: number
  avgRating: number
  price: number
  originalPrice?: number | null
  relevanceScore?: number
  fitType?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  loading?: boolean
  semantic?: boolean
  analysis?: {
    keywords: string[]
    intent: string
    attributes: Record<string, string>
  }
  total: number
  sortBy: string
  onSortChange: (sort: string) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name-asc', label: 'Name: A-Z' },
]

export default function SearchResults({
  results,
  loading = false,
  semantic = false,
  analysis,
  total,
  sortBy,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange
}: SearchResultsProps) {
  const { addItem } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { formatPrice } = useLocaleStore()
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const handleAddToCart = (product: SearchResult) => {
    setAddingToCart(product.id)
    addItem({
      id: `${product.id}-${product.variants[0]?.id || 'default'}`,
      productId: product.id,
      variantId: product.variants[0]?.id || '',
      name: product.name,
      category: product.category.name,
      price: product.price,
      quantity: 1,
      image: product.images[0]?.url,
    })
    toast.success('Added to bag')
    setTimeout(() => setAddingToCart(null), 1000)
  }

  const handleWishlistToggle = (productId: string) => {
    toggleItem(productId)
    toast.success(isInWishlist(productId) ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const badgeStyles: Record<string, string> = {
    'bestseller': 'bg-terracotta text-cream',
    'new': 'bg-charcoal text-cream',
    'sale': 'bg-ember text-cream',
    'editors-pick': 'bg-gold text-charcoal',
  }

  if (loading) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-4" />
            <p className="font-body text-warm-gray">Searching...</p>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex-1">
        <div className="text-center py-20">
          <p className="font-display text-2xl text-charcoal mb-2">No results found</p>
          <p className="font-body text-warm-gray">Try adjusting your filters or search terms</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      {/* AI Analysis Banner */}
      {semantic && analysis && (
        <div className="bg-terracotta/5 border border-terracotta/20 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-charcoal text-sm">
                <span className="font-medium">AI understood: </span>
                {analysis.intent}
              </p>
              {analysis.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {analysis.keywords.map((keyword, i) => (
                    <span key={i} className="px-2 py-0.5 bg-sand font-body text-xs text-charcoal">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-sand">
        <p className="font-body text-warm-gray text-sm">
          <span className="text-charcoal font-medium">{total}</span> {total === 1 ? 'result' : 'results'} found
        </p>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-sand bg-warm-white font-body text-sm text-charcoal hover:border-terracotta"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}
              </span>
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-warm-white border border-sand shadow-lg z-20">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left font-body text-sm ${
                      sortBy === option.value
                        ? 'bg-terracotta/10 text-terracotta'
                        : 'text-charcoal hover:bg-sand/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center border border-sand">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-sand text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-sand text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((product) => (
            <div key={product.id} className="group">
              {/* Image Area */}
              <div className="relative aspect-square bg-gradient-to-br from-cream to-sand mb-4 overflow-hidden">
                {product.images[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Badge */}
                {product.badge && (
                  <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-body uppercase tracking-wider ${badgeStyles[product.badge] || 'bg-charcoal text-cream'}`}>
                    {product.badge.replace('-', ' ')}
                  </span>
                )}

                {/* Fit Type Badge */}
                {product.fitType && product.fitType !== 'true_to_size' && (
                  <span className="absolute top-3 right-14 px-2 py-1 bg-cream/90 font-body text-xs text-charcoal">
                    {product.fitType === 'runs_small' ? 'Runs Small' : 'Runs Large'}
                  </span>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={() => handleWishlistToggle(product.id)}
                    className="w-8 h-8 flex items-center justify-center bg-cream/80 backdrop-blur-sm transition-all hover:bg-cream"
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isInWishlist(product.id)
                          ? 'fill-terracotta text-terracotta'
                          : 'text-charcoal hover:text-terracotta'
                      }`}
                     
                    />
                  </button>
                </div>

                {/* Quick Add */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addingToCart === product.id}
                  className="absolute bottom-3 left-3 right-3 bg-charcoal text-cream py-3 font-body text-xs uppercase tracking-wider opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0 hover:bg-terracotta disabled:opacity-50"
                >
                  {addingToCart === product.id ? 'Adding...' : 'Add to Bag'}
                </button>
              </div>

              {/* Product Info */}
              <Link href={`/product/${product.slug}`}>
                <span className="eyebrow text-[0.65rem]">{product.category.name}</span>
                <h3 className="font-display text-charcoal mt-1 mb-1" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
                  {product.name}
                </h3>
              </Link>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(product.avgRating)
                            ? 'fill-gold text-gold'
                            : 'text-sand'
                        }`}
                       
                      />
                    ))}
                  </div>
                  <span className="font-body text-warm-gray text-xs">({product.reviewCount})</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="font-body text-charcoal text-sm">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-body text-warm-gray text-xs line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {results.map((product) => (
            <div key={product.id} className="flex gap-4 p-4 bg-warm-white border border-sand hover:border-terracotta transition-colors">
              {/* Image */}
              <Link href={`/product/${product.slug}`} className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-cream to-sand relative overflow-hidden">
                {product.images[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-charcoal/10 text-2xl">{product.name.charAt(0)}</span>
                  </div>
                )}
                {product.badge && (
                  <span className={`absolute top-1 left-1 px-1.5 py-0.5 text-[0.6rem] font-body uppercase tracking-wider ${badgeStyles[product.badge] || 'bg-charcoal text-cream'}`}>
                    {product.badge.replace('-', ' ')}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/product/${product.slug}`}>
                  <span className="font-body text-warm-gray text-xs uppercase tracking-wider">{product.category.name}</span>
                  <h3 className="font-display text-charcoal" style={{ fontSize: '1rem', fontWeight: 400 }}>
                    {product.name}
                  </h3>
                </Link>
                <p className="font-body text-warm-gray text-sm line-clamp-2 mt-1">
                  {product.shortDescription}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {product.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="font-body text-xs text-charcoal">{product.avgRating.toFixed(1)}</span>
                      <span className="font-body text-xs text-warm-gray">({product.reviewCount})</span>
                    </div>
                  )}
                  {product.inventoryCount <= 0 && (
                    <span className="font-body text-xs text-ember">Out of Stock</span>
                  )}
                  {product.isDigital && (
                    <span className="font-body text-xs text-sage">Digital</span>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                  <span className="font-body text-charcoal">{formatPrice(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="block font-body text-warm-gray text-xs line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWishlistToggle(product.id)}
                    className="w-8 h-8 flex items-center justify-center border border-sand hover:border-terracotta"
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isInWishlist(product.id) ? 'fill-terracotta text-terracotta' : 'text-charcoal'
                      }`}
                     
                    />
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id || product.inventoryCount <= 0}
                    className="flex items-center gap-1 px-3 py-2 bg-charcoal text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    {addingToCart === product.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
