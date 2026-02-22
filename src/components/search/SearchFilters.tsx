'use client'

import { useState } from 'react'
import { ChevronDown, SlidersHorizontal, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  count?: number
}

interface SearchFiltersProps {
  aggregations?: {
    categories: Category[]
    badges: Array<{ badge: string; count: number }>
    priceRange: { min: number; max: number }
    inStockCount: number
    digitalCount: number
  }
  activeFilters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    inStock?: boolean
    isDigital?: boolean
    badge?: string
  }
  onFilterChange: (filters: Partial<SearchFiltersProps['activeFilters']>) => void
  onClearAll: () => void
  loading?: boolean
}

const RATING_OPTIONS = [
  { value: undefined, label: 'Any rating' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
]

export default function SearchFilters({
  aggregations,
  activeFilters,
  onFilterChange,
  onClearAll,
  loading = false
}: SearchFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('category')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== undefined)

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: priceMin ? Math.round(parseFloat(priceMin) * 100) : undefined,
      maxPrice: priceMax ? Math.round(parseFloat(priceMax) * 100) : undefined
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (loading) {
    return (
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-warm-white border border-sand p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-terracotta animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-warm-white border border-sand">
        {/* Header */}
        <div className="p-4 border-b border-sand flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-charcoal" />
            <span className="font-body text-charcoal text-sm uppercase tracking-wider">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="font-body text-xs text-terracotta hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category */}
        <div className="border-b border-sand">
          <button
            onClick={() => toggleSection('category')}
            className="w-full p-4 flex items-center justify-between"
          >
            <span className="font-body text-charcoal text-sm">Category</span>
            <ChevronDown
              className={`w-4 h-4 text-warm-gray transition-transform ${expandedSection === 'category' ? 'rotate-180' : ''}`}
             
            />
          </button>
          {expandedSection === 'category' && aggregations?.categories && (
            <div className="px-4 pb-4 space-y-2">
              {aggregations.categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ 
                    category: activeFilters.category === cat.slug ? undefined : cat.slug 
                  })}
                  className={`w-full flex items-center justify-between py-1.5 px-2 text-left ${
                    activeFilters.category === cat.slug
                      ? 'bg-terracotta/10 border border-terracotta'
                      : 'hover:bg-sand/30'
                  }`}
                >
                  <span className="font-body text-charcoal text-sm">{cat.name}</span>
                  <span className="font-body text-warm-gray text-xs">{cat.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="border-b border-sand">
          <button
            onClick={() => toggleSection('price')}
            className="w-full p-4 flex items-center justify-between"
          >
            <span className="font-body text-charcoal text-sm">Price Range</span>
            <ChevronDown
              className={`w-4 h-4 text-warm-gray transition-transform ${expandedSection === 'price' ? 'rotate-180' : ''}`}
             
            />
          </button>
          {expandedSection === 'price' && aggregations?.priceRange && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1">
                  <label className="font-body text-warm-gray text-xs mb-1 block">Min</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-body text-warm-gray text-xs">$</span>
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder={formatPrice(aggregations.priceRange.min)}
                      className="w-full pl-6 pr-2 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="font-body text-warm-gray text-xs mb-1 block">Max</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-body text-warm-gray text-xs">$</span>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder={formatPrice(aggregations.priceRange.max)}
                      className="w-full pl-6 pr-2 py-2 border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handlePriceApply}
                className="w-full py-2 bg-charcoal text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="border-b border-sand">
          <button
            onClick={() => toggleSection('rating')}
            className="w-full p-4 flex items-center justify-between"
          >
            <span className="font-body text-charcoal text-sm">Rating</span>
            <ChevronDown
              className={`w-4 h-4 text-warm-gray transition-transform ${expandedSection === 'rating' ? 'rotate-180' : ''}`}
             
            />
          </button>
          {expandedSection === 'rating' && (
            <div className="px-4 pb-4 space-y-1">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.label}
                  onClick={() => onFilterChange({ minRating: option.value })}
                  className={`w-full py-2 px-2 text-left font-body text-sm ${
                    activeFilters.minRating === option.value
                      ? 'bg-terracotta/10 border border-terracotta'
                      : 'hover:bg-sand/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="p-4 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.inStock || false}
              onChange={(e) => onFilterChange({ inStock: e.target.checked || undefined })}
              className="w-4 h-4 accent-terracotta"
            />
            <span className="font-body text-charcoal text-sm">In Stock Only</span>
            {aggregations?.inStockCount !== undefined && (
              <span className="font-body text-warm-gray text-xs">({aggregations.inStockCount})</span>
            )}
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.isDigital || false}
              onChange={(e) => onFilterChange({ isDigital: e.target.checked || undefined })}
              className="w-4 h-4 accent-terracotta"
            />
            <span className="font-body text-charcoal text-sm">Digital Products</span>
            {aggregations?.digitalCount !== undefined && (
              <span className="font-body text-warm-gray text-xs">({aggregations.digitalCount})</span>
            )}
          </label>
        </div>

        {/* Badges */}
        {aggregations?.badges && aggregations.badges.length > 0 && (
          <div className="p-4 border-t border-sand">
            <p className="font-body text-charcoal text-xs uppercase tracking-wider mb-2">Special</p>
            <div className="flex flex-wrap gap-2">
              {aggregations.badges.map(({ badge, count }) => (
                <button
                  key={badge}
                  onClick={() => onFilterChange({ 
                    badge: activeFilters.badge === badge ? undefined : badge 
                  })}
                  className={`px-2 py-1 font-body text-xs ${
                    activeFilters.badge === badge
                      ? 'bg-terracotta text-cream'
                      : 'bg-sand/50 text-charcoal hover:bg-sand'
                  }`}
                >
                  {badge?.replace('-', ' ')} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
