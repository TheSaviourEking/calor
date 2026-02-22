'use client'

import { useState } from 'react'
import { Search, Sparkles, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SearchSectionProps {
  onSearchTrigger?: () => void
}

export default function SearchSection({ onSearchTrigger }: SearchSectionProps) {
  const [query, setQuery] = useState('')

  const popularSearches = ['bestseller', 'new arrival', 'sale', 'waterproof', 'rechargeable']
  
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <section className="py-20 bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Header */}
        <div className="mb-8">
          <span className="eyebrow text-terracotta">Find Your Perfect Match</span>
          <h2 
            className="font-display text-3xl md:text-4xl text-charcoal mt-2 mb-4"
            style={{ fontWeight: 400 }}
          >
            Advanced Product Search
          </h2>
          <p className="font-body text-warm-gray max-w-xl mx-auto">
            Search by name, category, material, or use our AI-powered semantic search 
            to find exactly what you&apos;re looking for.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories, materials..."
              className="w-full pl-12 pr-32 py-4 border border-sand bg-cream font-body text-charcoal text-lg focus:outline-none focus:border-terracotta"
            />
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" 
              
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => handleSearch(query)}
                className="px-3 py-2 bg-terracotta/10 text-terracotta font-body text-xs flex items-center gap-1 hover:bg-terracotta/20"
                title="AI-powered search"
              >
                <Sparkles className="w-3 h-3" />
                AI
              </button>
            </div>
          </div>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="px-4 py-2 bg-sand/50 font-body text-charcoal text-sm hover:bg-sand transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-6 bg-cream border border-sand">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-display text-charcoal mb-2" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
              AI Semantic Search
            </h3>
            <p className="font-body text-warm-gray text-sm">
              Describe what you&apos;re looking for in natural language and our AI will understand your intent.
            </p>
          </div>

          <div className="p-6 bg-cream border border-sand">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-display text-charcoal mb-2" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
              Smart Filters
            </h3>
            <p className="font-body text-warm-gray text-sm">
              Filter by category, price range, rating, stock status, and more to narrow down results.
            </p>
          </div>

          <div className="p-6 bg-cream border border-sand">
            <div className="w-12 h-12 bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-display text-charcoal mb-2" style={{ fontSize: '1.1rem', fontWeight: 400 }}>
              Personalized Results
            </h3>
            <p className="font-body text-warm-gray text-sm">
              Get suggestions based on your search history and popular trends.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
          >
            Open Full Search
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
