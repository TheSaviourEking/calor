'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Check, ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  category: { name: string }
  variants: Array<{ price: number }>
  images: Array<{ url: string; altText: string }>
}

interface ProductComparisonProps {
  products: Product[]
  onClose: () => void
}

export default function ProductComparison({ products, onClose }: ProductComparisonProps) {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(products)

  // Features to compare
  const features = [
    { key: 'price', label: 'Price' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
  ]

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const removeProduct = (productId: string) => {
    setComparisonProducts(comparisonProducts.filter(p => p.id !== productId))
    if (comparisonProducts.length <= 1) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-white w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-warm-white border-b border-sand p-4 flex items-center justify-between">
          <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
            Compare Products
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sand transition-colors"
          >
            <X className="w-5 h-5 text-warm-gray" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-6">
          {comparisonProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-body text-warm-gray">No products to compare</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 font-body text-warm-gray text-xs uppercase tracking-wider w-32">
                      Feature
                    </th>
                    {comparisonProducts.map((product) => (
                      <th key={product.id} className="text-center py-3 px-4">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-sand hover:bg-terracotta hover:text-warm-white flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Product Image & Name */}
                  <tr className="border-b border-sand">
                    <td className="py-4 px-4"></td>
                    {comparisonProducts.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-center">
                        <Link
                          href={`/product/${product.slug}`}
                          className="group"
                        >
                          <div className="aspect-square bg-gradient-to-br from-cream to-sand mb-3 mx-auto max-w-[150px]">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.images[0].altText || product.name}
                                width={150}
                                height={150}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="font-display text-charcoal/10 text-4xl" style={{ fontWeight: 300 }}>
                                  {product.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="font-display text-charcoal group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
                            {product.name}
                          </p>
                        </Link>
                      </td>
                    ))}
                  </tr>

                  {/* Price */}
                  <tr className="border-b border-sand">
                    <td className="py-4 px-4 font-body text-warm-gray text-sm">Price</td>
                    {comparisonProducts.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-center">
                        <span className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                          {formatPrice(product.variants[0]?.price || 0)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Category */}
                  <tr className="border-b border-sand">
                    <td className="py-4 px-4 font-body text-warm-gray text-sm">Category</td>
                    {comparisonProducts.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-center">
                        <span className="font-body text-charcoal text-sm">
                          {product.category?.name || '-'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Description */}
                  <tr className="border-b border-sand">
                    <td className="py-4 px-4 font-body text-warm-gray text-sm">Description</td>
                    {comparisonProducts.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-center">
                        <span className="font-body text-warm-gray text-xs line-clamp-3">
                          {product.shortDescription}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="py-4 px-4"></td>
                    {comparisonProducts.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-center">
                        <Link
                          href={`/product/${product.slug}`}
                          className="inline-flex items-center gap-1 bg-charcoal text-cream px-4 py-2 font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-warm-white border-t border-sand p-4 flex justify-between items-center">
          <p className="font-body text-warm-gray text-sm">
            {comparisonProducts.length} of 4 products selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-sand font-body text-sm text-warm-gray hover:bg-sand transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
