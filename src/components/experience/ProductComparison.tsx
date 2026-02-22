'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Check, AlertCircle, Shuffle, Loader2 } from 'lucide-react'
import { useLocaleStore } from '@/stores'

interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  category: { name: string; slug: string }
  variants: Array<{ id: string; name: string; price: number; stock: number }>
  images: Array<{ url: string; altText: string }>
  materialInfo?: string | null
  safetyInfo?: string | null
  cleaningGuide?: string | null
  usageGuide?: string | null
  inventoryCount: number
  badge?: string | null
}

interface ComparisonAttribute {
  label: string
  key: string
  type: 'text' | 'price' | 'stock' | 'boolean' | 'rating'
}

const comparisonAttributes: ComparisonAttribute[] = [
  { label: 'Price', key: 'price', type: 'price' },
  { label: 'Category', key: 'category', type: 'text' },
  { label: 'Material', key: 'materialInfo', type: 'text' },
  { label: 'In Stock', key: 'stock', type: 'stock' },
  { label: 'Body Safe', key: 'bodySafe', type: 'boolean' },
  { label: 'Waterproof', key: 'waterproof', type: 'boolean' },
  { label: 'Cleaning', key: 'cleaningGuide', type: 'text' },
  { label: 'Experience Level', key: 'experienceLevel', type: 'text' },
]

export default function ProductComparison() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  
  const { formatPrice } = useLocaleStore()

  // Search for products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        const existingIds = products.map(p => p.id)
        setSearchResults((data.results || []).filter((p: Product) => !existingIds.includes(p.id)))
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }
    
    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, products])

  const addProduct = (product: Product) => {
    if (products.length < 4 && !products.find(p => p.id === product.id)) {
      setProducts([...products, product])
      setSearchQuery('')
      setSearchResults([])
      setShowSearch(false)
    }
  }

  const removeProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId))
  }

  const clearAll = () => {
    setProducts([])
  }

  const swapProducts = (index1: number, index2: number) => {
    const newProducts = [...products]
    ;[newProducts[index1], newProducts[index2]] = [newProducts[index2], newProducts[index1]]
    setProducts(newProducts)
  }

  const getSafetyAttribute = (product: Product, key: string): boolean | null => {
    if (!product.safetyInfo) return null
    try {
      const safety = JSON.parse(product.safetyInfo)
      return safety[key] ?? null
    } catch {
      return null
    }
  }

  const getAttributeValue = (product: Product, attr: ComparisonAttribute) => {
    switch (attr.key) {
      case 'price':
        return product.variants[0]?.price || 0
      case 'category':
        return product.category?.name || 'N/A'
      case 'stock':
        return product.inventoryCount > 0
      case 'bodySafe':
      case 'waterproof':
        return getSafetyAttribute(product, attr.key)
      case 'experienceLevel':
        return product.category?.slug?.includes('advanced') ? 'Advanced' : 
               product.category?.slug?.includes('beginner') ? 'Beginner' : 'All Levels'
      default:
        return (product as Record<string, unknown>)[attr.key] || 'N/A'
    }
  }

  const renderAttributeValue = (product: Product, attr: ComparisonAttribute) => {
    const value = getAttributeValue(product, attr)
    
    switch (attr.type) {
      case 'price':
        return (
          <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
            {formatPrice(value as number)}
          </span>
        )
      case 'stock':
        return (
          <span className={`flex items-center gap-1 font-body text-sm ${
            value ? 'text-green-600' : 'text-red-500'
          }`}>
            {value ? (
              <>
                <Check className="w-4 h-4" />
                In Stock
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Out of Stock
              </>
            )}
          </span>
        )
      case 'boolean':
        return value === true ? (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="w-4 h-4" />
            <span className="font-body text-sm">Yes</span>
          </span>
        ) : value === false ? (
          <span className="font-body text-warm-gray text-sm">No</span>
        ) : (
          <span className="font-body text-warm-gray/50 text-sm">—</span>
        )
      default:
        return (
          <span className="font-body text-warm-gray text-sm">
            {value || '—'}
          </span>
        )
    }
  }

  const getBestAttribute = (attr: ComparisonAttribute): string | null => {
    if (attr.type === 'price' && products.length > 1) {
      const prices = products.map(p => p.variants[0]?.price || Infinity)
      const minIndex = prices.indexOf(Math.min(...prices))
      return products[minIndex]?.id || null
    }
    return null
  }

  return (
    <div className="bg-warm-white border border-sand">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between">
        <div>
          <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
            Product Comparison
          </h3>
          <p className="font-body text-warm-gray text-xs">Compare up to 4 products side by side</p>
        </div>
        {products.length > 0 && (
          <button
            onClick={clearAll}
            className="font-body text-sm text-warm-gray hover:text-terracotta"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Products Row */}
      <div className="p-4 border-b border-sand">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="relative group"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <div className="bg-cream border border-sand p-4">
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-2 right-2 p-1 bg-sand text-warm-gray hover:bg-terracotta hover:text-cream transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                
                <div className="aspect-square bg-gradient-to-br from-cream to-sand mb-3 flex items-center justify-center">
                  <span className="font-display text-charcoal/20 text-4xl" style={{ fontWeight: 300 }}>
                    {product.name.charAt(0)}
                  </span>
                </div>
                
                <h4 className="font-display text-charcoal text-sm mb-1 truncate" style={{ fontWeight: 400 }}>
                  {product.name}
                </h4>
                <p className="font-body text-warm-gray text-xs mb-2">{product.category?.name}</p>
                
                <p className="font-display text-terracotta" style={{ fontWeight: 400 }}>
                  {formatPrice(product.variants[0]?.price || 0)}
                </p>
                
                {products.length > 1 && hoveredProduct === product.id && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {index > 0 && (
                      <button
                        onClick={() => swapProducts(index, index - 1)}
                        className="p-1 bg-charcoal/80 text-cream hover:bg-terracotta"
                        title="Move left"
                      >
                        <Minus className="w-3 h-3 rotate-90" />
                      </button>
                    )}
                    {index < products.length - 1 && (
                      <button
                        onClick={() => swapProducts(index, index + 1)}
                        className="p-1 bg-charcoal/80 text-cream hover:bg-terracotta"
                        title="Move right"
                      >
                        <Plus className="w-3 h-3 rotate-90" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {products.length < 4 && (
            <button
              onClick={() => setShowSearch(true)}
              className="border-2 border-dashed border-sand hover:border-terracotta flex flex-col items-center justify-center gap-2 text-warm-gray hover:text-terracotta transition-colors min-h-[200px]"
            >
              <Plus className="w-6 h-6" />
              <span className="font-body text-xs uppercase tracking-wider">Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {comparisonAttributes.map((attr) => {
                const bestId = getBestAttribute(attr)
                return (
                  <tr key={attr.key} className="border-b border-sand last:border-b-0">
                    <td className="p-3 bg-cream font-body text-xs text-warm-gray uppercase tracking-wider w-1/4">
                      {attr.label}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className={`p-3 text-center ${bestId === product.id ? 'bg-green-50' : ''}`}
                      >
                        {renderAttributeValue(product, attr)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <div className="p-8 text-center">
          <Shuffle className="w-12 h-12 text-warm-gray mx-auto mb-4" />
          <p className="font-body text-warm-gray mb-4">
            Add products to compare their features side by side
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="px-6 py-3 bg-terracotta text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta/90"
          >
            Add First Product
          </button>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream border border-sand max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-sand flex items-center justify-between">
              <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                Add Product to Compare
              </h3>
              <button onClick={() => setShowSearch(false)} className="text-warm-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-charcoal focus:border-terracotta outline-none"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-terracotta animate-spin mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full p-4 border-b border-sand hover:bg-sand/30 transition-colors text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-cream to-sand flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-charcoal/20 text-lg" style={{ fontWeight: 300 }}>
                        {product.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-charcoal text-sm truncate">{product.name}</p>
                      <p className="font-body text-warm-gray text-xs">{product.category?.name}</p>
                    </div>
                    <p className="font-display text-terracotta text-sm" style={{ fontWeight: 400 }}>
                      {formatPrice(product.variants[0]?.price || 0)}
                    </p>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <p className="p-8 text-center font-body text-warm-gray">No products found</p>
              ) : (
                <p className="p-8 text-center font-body text-warm-gray">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
