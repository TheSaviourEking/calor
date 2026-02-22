'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  slug: string
  name: string
  category: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle keyboard and focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Fetch search results
  useEffect(() => {
    if (!isOpen || query.length < 2) return
    
    const controller = new AbortController()
    
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setResults(data.results || []))
      .catch(() => {})
    
    return () => controller.abort()
  }, [query, isOpen])

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="absolute top-0 left-0 right-0 bg-warm-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-warm-gray" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent font-body text-lg focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="text-warm-gray hover:text-charcoal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="mt-6 border-t border-sand pt-6">
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.slice(0, 6).map((result) => (
                    <Link
                      key={result.slug}
                      href={`/product/${result.slug}`}
                      onClick={handleClose}
                      className="block py-2 hover:bg-cream px-2 -mx-2"
                    >
                      <p className="font-body text-charcoal">{result.name}</p>
                      <p className="font-body text-warm-gray text-xs">{result.category}</p>
                    </Link>
                  ))}
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={handleClose}
                    className="block py-2 text-terracotta hover:bg-cream px-2 -mx-2 font-body text-sm"
                  >
                    View all results
                  </Link>
                </div>
              ) : (
                <p className="font-body text-warm-gray text-sm">
                  No results found. Try a different search.
                </p>
              )}
            </div>
          )}

          {/* Quick Links */}
          {query.length < 2 && (
            <div className="mt-6 border-t border-sand pt-6">
              <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-3">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {['Massage oil', 'Silk robe', 'Card games', 'Lubricant', 'Books'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 bg-cream font-body text-sm text-charcoal hover:bg-sand"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
