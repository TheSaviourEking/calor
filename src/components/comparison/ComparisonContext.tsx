'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Image from 'next/image'
import { X, Scale, Plus, Trash2 } from 'lucide-react'
import ProductComparison from '@/components/comparison/ProductComparison'

interface ComparisonProduct {
  id: string
  slug: string
  name: string
  shortDescription: string
  category: { name: string }
  variants: Array<{ price: number }>
  images: Array<{ url: string; altText: string }>
}

interface ComparisonContextType {
  products: ComparisonProduct[]
  addProduct: (product: ComparisonProduct) => void
  removeProduct: (productId: string) => void
  isInComparison: (productId: string) => boolean
  clearComparison: () => void
}

const ComparisonContext = createContext<ComparisonContextType | null>(null)

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if available
  const [products, setProducts] = useState<ComparisonProduct[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('calor_comparison')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [showComparison, setShowComparison] = useState(false)

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('calor_comparison', JSON.stringify(products))
  }, [products])

  const addProduct = (product: ComparisonProduct) => {
    if (products.length >= 4) {
      return // Max 4 products
    }
    if (products.some(p => p.id === product.id)) {
      return // Already in comparison
    }
    setProducts([...products, product])
  }

  const removeProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId))
  }

  const isInComparison = (productId: string) => {
    return products.some(p => p.id === productId)
  }

  const clearComparison = () => {
    setProducts([])
  }

  return (
    <ComparisonContext.Provider value={{ products, addProduct, removeProduct, isInComparison, clearComparison }}>
      {children}

      {/* Comparison Bar */}
      {products.length > 0 && !showComparison && (
        <div className="fixed bottom-0 left-0 right-0 bg-charcoal text-cream z-40 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Scale className="w-5 h-5 text-terracotta" />
              <span className="font-body text-sm">
                {products.length} product{products.length > 1 ? 's' : ''} in comparison
              </span>
              <div className="flex gap-2">
                {products.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    className="relative group"
                  >
                    <div className="w-10 h-10 bg-cream/10 overflow-hidden">
                      {p.images[0] ? (
                        <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-cream/50 text-xs">{p.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-warm-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={clearComparison}
                className="font-body text-sm text-warm-gray hover:text-terracotta transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="bg-terracotta text-warm-white px-6 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <ProductComparison
          products={products}
          onClose={() => setShowComparison(false)}
        />
      )}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider')
  }
  return context
}

// Compare Button Component for Product Cards
export function CompareButton({ product }: { product: ComparisonProduct }) {
  const { addProduct, removeProduct, isInComparison } = useComparison()
  const inComparison = isInComparison(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inComparison) {
      removeProduct(product.id)
    } else {
      addProduct(product)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 flex items-center justify-center border transition-colors ${inComparison
          ? 'border-terracotta bg-terracotta/10 text-terracotta'
          : 'border-sand hover:border-terracotta text-warm-gray hover:text-terracotta'
        }`}
      title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
    >
      {inComparison ? (
        <Trash2 className="w-4 h-4" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
    </button>
  )
}
