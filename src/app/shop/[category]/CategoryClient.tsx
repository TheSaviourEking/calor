'use client'

import { ArrowLeft, Lock } from 'lucide-react'
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
  description: string | null
  iconName: string
  _count: { products: number }
}

interface CategoryClientProps {
  category: Category
  products: Product[]
}

export default function CategoryClient({ category, products }: CategoryClientProps) {
  const isRestricted = category.slug === 'kink-fetish'

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="bg-charcoal py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <a 
            href="/shop" 
            className="inline-flex items-center gap-2 font-body text-warm-gray text-sm mb-6 hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </a>
          <div className="flex items-center gap-3 mb-4">
            <h1 
              className="font-display text-cream"
              style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', fontWeight: 300 }}
            >
              {category.name}
            </h1>
            {isRestricted && (
              <Lock className="w-6 h-6 text-terracotta" />
            )}
          </div>
          {category.description && (
            <p className="font-body text-warm-gray text-base max-w-lg">
              {category.description}
            </p>
          )}
          <p className="font-body text-warm-gray text-sm mt-4">
            {category._count.products} products
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {isRestricted ? (
          <div className="text-center py-16 bg-cream p-12">
            <Lock className="w-12 h-12 text-terracotta mx-auto mb-6" />
            <h2 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 300 }}>
              A note before you continue
            </h2>
            <p className="font-body text-warm-gray text-base max-w-md mx-auto mb-8">
              This section contains adult content including bondage, restraints, and fetish products. 
              By continuing, you confirm you are an adult and consent to viewing this content.
            </p>
            <button className="bg-terracotta text-warm-white px-8 py-4 font-body text-sm uppercase tracking-wider transition-colors hover:bg-terracotta-light">
              I understand and wish to continue
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-body text-warm-gray text-lg">
              No products in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
