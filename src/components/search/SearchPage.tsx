'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Sparkles, Filter, X } from 'lucide-react'
import EnhancedSearchBar from './EnhancedSearchBar'
import SearchFilters from './SearchFilters'
import SearchResults from './SearchResults'
import ActiveFilters from './ActiveFilters'

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

interface SearchPageProps {
  initialQuery?: string
  onProductClick?: (productId: string) => void
}

export default function SearchPage({ initialQuery = '', onProductClick }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [aggregations, setAggregations] = useState<{
    categories: Array<{ id: string; name: string; slug: string; count: number }>
    badges: Array<{ badge: string; count: number }>
    priceRange: { min: number; max: number }
    inStockCount: number
    digitalCount: number
  } | null>(null)
  const [semantic, setSemantic] = useState(false)
  const [analysis, setAnalysis] = useState<{
    keywords: string[]
    intent: string
    attributes: Record<string, string>
  } | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  const [activeFilters, setActiveFilters] = useState<{
    category?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    inStock?: boolean
    isDigital?: boolean
    badge?: string
  }>({})

  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})

  // Build search URL
  const buildSearchUrl = useCallback((searchQuery: string, filters: typeof activeFilters, sort: string, pageNum: number, semanticSearch: boolean) => {
    const params = new URLSearchParams()
    params.set('q', searchQuery)
    params.set('page', pageNum.toString())
    params.set('limit', '20')
    params.set('sort', sort)

    if (filters.category) params.set('category', filters.category)
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.minRating) params.set('minRating', filters.minRating.toString())
    if (filters.inStock) params.set('inStock', 'true')
    if (filters.isDigital) params.set('isDigital', 'true')
    if (filters.badge) params.set('badge', filters.badge)

    return `/api/search?${params.toString()}`
  }, [])

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, semanticSearch: boolean = false) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setQuery(searchQuery)
    setSemantic(semanticSearch)
    
    try {
      if (semanticSearch) {
        // Use semantic search API
        const response = await fetch('/api/search/semantic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, limit: 20 })
        })
        const data = await response.json()
        
        setResults(data.results || [])
        setTotal(data.total || 0)
        setAnalysis(data.analysis || null)
        setAggregations(null) // Semantic search doesn't return aggregations
      } else {
        // Use regular faceted search
        const url = buildSearchUrl(searchQuery, activeFilters, sortBy, page)
        const response = await fetch(url)
        const data = await response.json()
        
        setResults(data.results || [])
        setTotal(data.pagination?.total || 0)
        setAggregations(data.aggregations || null)
        setAnalysis(null)
        
        // Build category names map
        if (data.aggregations?.categories) {
          const names: Record<string, string> = {}
          data.aggregations.categories.forEach((cat: { slug: string; name: string }) => {
            names[cat.slug] = cat.name
          })
          setCategoryNames(names)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [activeFilters, sortBy, page, buildSearchUrl])

  // Handle search from search bar
  const handleSearch = (searchQuery: string, semanticSearch: boolean = false) => {
    setPage(1)
    performSearch(searchQuery, semanticSearch)
  }

  // Handle filter change
  const handleFilterChange = (filters: Partial<typeof activeFilters>) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined) {
          delete newFilters[key as keyof typeof newFilters]
        } else {
          (newFilters as Record<string, unknown>)[key] = value
        }
      })
      return newFilters
    })
  }

  // Remove individual filter
  const handleRemoveFilter = (key: string) => {
    if (key === 'query') {
      setQuery('')
      setResults([])
      setTotal(0)
    } else if (key === 'price') {
      setActiveFilters(prev => {
        const { minPrice, maxPrice, ...rest } = prev
        return rest
      })
    } else {
      setActiveFilters(prev => {
        const newFilters = { ...prev }
        delete (newFilters as Record<string, unknown>)[key]
        return newFilters
      })
    }
  }

  // Clear all filters
  const handleClearAll = () => {
    setActiveFilters({})
  }

  // Re-run search when filters or sort change
  useEffect(() => {
    if (query.trim()) {
      performSearch(query, semantic)
    }
  }, [activeFilters, sortBy, page])

  // Category names from aggregations
  const allFilters = { query, ...activeFilters }

  return (
    <div className="min-h-screen bg-cream">
      {/* Search Header */}
      <div className="bg-warm-white border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-terracotta" />
            <h1 className="font-display text-2xl text-charcoal" style={{ fontWeight: 400 }}>
              Search Products
            </h1>
          </div>
          
          <EnhancedSearchBar
            onSearch={handleSearch}
            placeholder="Search by name, category, material..."
            showSemantic={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-warm-white border border-sand font-body text-sm text-charcoal"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(activeFilters).some(v => v !== undefined) && (
              <span className="w-5 h-5 flex items-center justify-center bg-terracotta text-cream text-xs">
                {Object.values(activeFilters).filter(v => v !== undefined).length}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {query && (
          <ActiveFilters
            filters={allFilters}
            categoryNames={categoryNames}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAll}
          />
        )}

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`fixed lg:relative inset-0 z-40 lg:z-auto ${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
            {/* Mobile overlay */}
            <div 
              className="lg:hidden fixed inset-0 bg-charcoal/50"
              onClick={() => setShowMobileFilters(false)}
            />
            
            <div className="fixed lg:relative right-0 top-0 bottom-0 lg:top-auto lg:bottom-auto w-72 lg:w-auto h-full lg:h-auto overflow-y-auto lg:overflow-visible bg-cream lg:bg-transparent p-4 lg:p-0">
              {/* Mobile close button */}
              <div className="lg:hidden flex items-center justify-between mb-4">
                <span className="font-display text-lg text-charcoal">Filters</span>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-charcoal" />
                </button>
              </div>
              
              <SearchFilters
                aggregations={aggregations || undefined}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAll}
                loading={loading}
              />
            </div>
          </div>

          {/* Results */}
          {query ? (
            <SearchResults
              results={results}
              loading={loading}
              semantic={semantic}
              analysis={analysis || undefined}
              total={total}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          ) : (
            <div className="flex-1 text-center py-20">
              <Search className="w-16 h-16 text-sand mx-auto mb-4" />
              <p className="font-display text-2xl text-charcoal mb-2" style={{ fontWeight: 400 }}>
                Find what you&apos;re looking for
              </p>
              <p className="font-body text-warm-gray">
                Try searching for products, categories, or use AI-powered semantic search
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <button
                  onClick={() => handleSearch('bestseller', false)}
                  className="px-4 py-2 bg-sand/50 font-body text-charcoal text-sm hover:bg-sand"
                >
                  Bestsellers
                </button>
                <button
                  onClick={() => handleSearch('new arrival', false)}
                  className="px-4 py-2 bg-sand/50 font-body text-charcoal text-sm hover:bg-sand"
                >
                  New Arrivals
                </button>
                <button
                  onClick={() => handleSearch('sale', false)}
                  className="px-4 py-2 bg-sand/50 font-body text-charcoal text-sm hover:bg-sand"
                >
                  On Sale
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
