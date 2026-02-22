'use client'

import { X } from 'lucide-react'

interface ActiveFiltersProps {
  filters: {
    query?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    inStock?: boolean
    isDigital?: boolean
    badge?: string
  }
  categoryNames?: Record<string, string>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export default function ActiveFilters({
  filters,
  categoryNames = {},
  onRemove,
  onClearAll
}: ActiveFiltersProps) {
  const activeItems: Array<{ key: string; label: string }> = []

  if (filters.query) {
    activeItems.push({ key: 'query', label: `"${filters.query}"` })
  }

  if (filters.category) {
    activeItems.push({ 
      key: 'category', 
      label: categoryNames[filters.category] || filters.category 
    })
  }

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `$${(filters.minPrice / 100).toFixed(0)}` : ''
    const max = filters.maxPrice ? `$${(filters.maxPrice / 100).toFixed(0)}` : ''
    activeItems.push({ 
      key: 'price', 
      label: `${min} - ${max}` 
    })
  }

  if (filters.minRating) {
    activeItems.push({ key: 'minRating', label: `${filters.minRating}+ stars` })
  }

  if (filters.inStock) {
    activeItems.push({ key: 'inStock', label: 'In Stock' })
  }

  if (filters.isDigital) {
    activeItems.push({ key: 'isDigital', label: 'Digital' })
  }

  if (filters.badge) {
    activeItems.push({ 
      key: 'badge', 
      label: filters.badge.replace('-', ' ') 
    })
  }

  if (activeItems.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="font-body text-warm-gray text-xs uppercase tracking-wider">
        Active filters:
      </span>
      {activeItems.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onRemove(key)}
          className="flex items-center gap-1 px-2 py-1 bg-sand/50 font-body text-charcoal text-xs hover:bg-sand"
        >
          {label}
          <X className="w-3 h-3" />
        </button>
      ))}
      {activeItems.length > 1 && (
        <button
          onClick={onClearAll}
          className="font-body text-terracotta text-xs hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
