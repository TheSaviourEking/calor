'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, TrendingUp, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocaleStore } from '@/stores'

interface Suggestion {
  products: Array<{
    id: string
    slug: string
    name: string
    image: string | null
    price: number
    category: string
  }>
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  tags: string[]
  recent: string[]
  popular: string[]
  relatedSearches: string[]
}

interface EnhancedSearchBarProps {
  onSearch?: (query: string, semantic?: boolean) => void
  placeholder?: string
  autoFocus?: boolean
  showSemantic?: boolean
}

export default function EnhancedSearchBar({
  onSearch,
  placeholder = 'Search products...',
  autoFocus = false,
  showSemantic = true
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion>({
    products: [],
    categories: [],
    tags: [],
    recent: [],
    popular: [],
    relatedSearches: []
  })
  const [semanticMode, setSemanticMode] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { formatPrice } = useLocaleStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions on query change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else if (query.length === 0) {
        fetchRecentSearches()
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [query])

  const fetchRecentSearches = async () => {
    try {
      const res = await fetch('/api/search/suggestions')
      const data = await res.json()
      setSuggestions(prev => ({
        ...prev,
        recent: data.recent || [],
        popular: data.popular || []
      }))
    } catch (error) {
      console.error('Error fetching recent searches:', error)
    }
  }

  const fetchSuggestions = async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSuggestions({
        products: data.products || [],
        categories: data.categories || [],
        tags: data.tags || [],
        recent: [],
        popular: [],
        relatedSearches: data.relatedSearches || []
      })
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      handleSearch(query.trim())
    }
  }

  const handleSearch = (searchQuery: string) => {
    setShowDropdown(false)
    onSearch?.(searchQuery, semanticMode)
    
    // Save to history
    fetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    }).catch(() => {})
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
    fetchRecentSearches()
  }

  const hasResults = suggestions.products.length > 0 || 
                     suggestions.categories.length > 0 || 
                     suggestions.tags.length > 0

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-10 pr-20 py-3 border border-sand bg-warm-white font-body text-charcoal focus:outline-none focus:border-terracotta"
          />
          
          {/* Search Icon */}
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" 
            
          />

          {/* Loading / Clear / Semantic */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading ? (
              <Loader2 className="w-4 h-4 text-terracotta animate-spin" />
            ) : query && (
              <button
                type="button"
                onClick={handleClear}
                className="w-6 h-6 flex items-center justify-center text-warm-gray hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {showSemantic && (
              <button
                type="button"
                onClick={() => setSemanticMode(!semanticMode)}
                className={`px-2 py-1 font-body text-xs flex items-center gap-1 transition-colors ${
                  semanticMode 
                    ? 'bg-terracotta text-cream' 
                    : 'bg-sand/50 text-warm-gray hover:bg-sand'
                }`}
                title="AI-powered semantic search"
              >
                <Sparkles className="w-3 h-3" />
                AI
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-warm-white border border-sand shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {loading && query.length >= 2 && (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-terracotta animate-spin" />
            </div>
          )}

          {/* No Results */}
          {!loading && query.length >= 2 && !hasResults && (
            <div className="p-4 text-center">
              <p className="font-body text-warm-gray text-sm">No results found</p>
              <p className="font-body text-warm-gray text-xs mt-1">Try different keywords or enable AI search</p>
            </div>
          )}

          {/* Recent & Popular (when no query) */}
          {!loading && query.length < 2 && (suggestions.recent.length > 0 || suggestions.popular.length > 0) && (
            <div className="p-2">
              {suggestions.recent.length > 0 && (
                <div className="mb-4">
                  <p className="font-body text-warm-gray text-xs uppercase tracking-wider px-2 mb-2">
                    Recent Searches
                  </p>
                  {suggestions.recent.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(term)
                        handleSearch(term)
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-sand/30"
                    >
                      <Clock className="w-4 h-4 text-warm-gray" />
                      <span className="font-body text-charcoal text-sm">{term}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {suggestions.popular.length > 0 && (
                <div>
                  <p className="font-body text-warm-gray text-xs uppercase tracking-wider px-2 mb-2">
                    Popular Searches
                  </p>
                  {suggestions.popular.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(term)
                        handleSearch(term)
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-sand/30"
                    >
                      <TrendingUp className="w-4 h-4 text-terracotta" />
                      <span className="font-body text-charcoal text-sm">{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Suggestions */}
          {!loading && suggestions.products.length > 0 && (
            <div className="p-2 border-b border-sand">
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider px-2 mb-2">
                Products
              </p>
              {suggestions.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-sand/30"
                >
                  <div className="w-10 h-10 bg-sand/50 flex items-center justify-center flex-shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-display text-warm-gray text-lg">{product.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-charcoal text-sm truncate">{product.name}</p>
                    <p className="font-body text-warm-gray text-xs">{product.category}</p>
                  </div>
                  <span className="font-body text-charcoal text-sm">{formatPrice(product.price)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Category Suggestions */}
          {!loading && suggestions.categories.length > 0 && (
            <div className="p-2 border-b border-sand">
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider px-2 mb-2">
                Categories
              </p>
              {suggestions.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop/${cat.slug}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center justify-between px-2 py-2 hover:bg-sand/30"
                >
                  <span className="font-body text-charcoal text-sm">{cat.name}</span>
                  <ArrowRight className="w-4 h-4 text-warm-gray" />
                </Link>
              ))}
            </div>
          )}

          {/* Related Searches */}
          {!loading && suggestions.relatedSearches.length > 0 && (
            <div className="p-2">
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider px-2 mb-2">
                Related Searches
              </p>
              <div className="flex flex-wrap gap-2 px-2">
                {suggestions.relatedSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(term)
                      handleSearch(term)
                    }}
                    className="px-2 py-1 bg-sand/50 font-body text-charcoal text-xs hover:bg-sand"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Search Button */}
          {!loading && query.length >= 2 && showSemantic && !semanticMode && (
            <div className="p-2 border-t border-sand">
              <button
                onClick={() => handleSearch(query)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-terracotta/10 text-terracotta font-body text-sm hover:bg-terracotta/20"
              >
                <Sparkles className="w-4 h-4" />
                Try AI-powered search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
