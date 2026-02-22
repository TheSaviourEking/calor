'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'

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

interface Category {
  id: string
  slug: string
  name: string
  iconName: string
  _count: { products: number }
}

interface ShopClientProps {
  initialProducts: Product[]
  categories: Category[]
}

export default function ShopClient({ initialProducts, categories }: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesCategory = !selectedCategory || product.category.slug === selectedCategory
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [initialProducts, selectedCategory, searchQuery])

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-charcoal py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 
            className="font-display text-cream mb-4"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 300 }}
          >
            The Collection
          </h1>
          <p className="font-body text-warm-gray text-base max-w-lg mx-auto">
            Every product chosen with intention. Every detail considered.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-cream border border-sand font-body text-sm focus:outline-none focus:border-terracotta"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 font-body text-sm transition-colors ${
                !selectedCategory 
                  ? 'bg-charcoal text-cream' 
                  : 'bg-cream text-mid-gray hover:bg-sand'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-4 py-2 font-body text-sm transition-colors ${
                  selectedCategory === category.slug 
                    ? 'bg-charcoal text-cream' 
                    : 'bg-cream text-mid-gray hover:bg-sand'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="font-body text-warm-gray text-sm mb-8">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </p>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-body text-warm-gray text-lg mb-4">
              Nothing matched that search.
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSearchQuery('')
              }}
              className="font-body text-terracotta text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
