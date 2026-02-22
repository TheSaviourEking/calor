'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight, Tag, Heart, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores'

interface BundleItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    images: Array<{ url: string; altText: string }>
    variants: Array<{ price: number }>
  }
}

interface Bundle {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string | null
  priceCents: number
  originalPriceCents: number
  savingsPercent: number
  items: BundleItem[]
}

interface BundlesClientProps {
  bundles: Bundle[]
}

export default function BundlesClient({ bundles }: BundlesClientProps) {
  const { addItem } = useCartStore()

  const handleAddBundle = (bundle: Bundle) => {
    // Add each item in the bundle to cart
    bundle.items.forEach(item => {
      if (item.product.variants[0]) {
        addItem({
          id: `bundle-${bundle.id}-${item.product.id}`,
          productId: item.product.id,
          variantId: item.product.variants[0] ? `${item.product.id}-default` : '',
          name: item.product.name,
          category: 'Bundle',
          price: Math.floor(bundle.priceCents / bundle.items.length / item.quantity),
          quantity: item.quantity,
          image: item.product.images[0]?.url,
        })
      }
    })
    toast.success(`Added ${bundle.name} to bag`)
  }

  if (bundles.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <Package className="w-16 h-16 text-sand mx-auto mb-4" />
          <h1 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 400 }}>
            No bundles available
          </h1>
          <p className="font-body text-warm-gray mb-8">
            Check back soon for curated product bundles.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-terracotta text-warm-white px-8 py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
          >
            Continue Shopping
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="eyebrow">Curated Collections</span>
          <h1 
            className="font-display text-charcoal mt-4"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
          >
            Product Bundles
          </h1>
          <p className="font-body text-warm-gray text-lg max-w-2xl mx-auto mt-4">
            Thoughtfully curated sets at a special price. Save more when you bundle.
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="bg-warm-white border border-sand overflow-hidden group">
              {/* Bundle Image */}
              <div className="aspect-square bg-gradient-to-br from-cream to-sand relative">
                {bundle.imageUrl ? (
                  <img 
                    src={bundle.imageUrl}
                    alt={bundle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-24 h-24 text-sand" />
                  </div>
                )}
                {/* Savings Badge */}
                <div className="absolute top-4 right-4 bg-terracotta text-warm-white px-3 py-1 font-body text-sm font-medium">
                  Save {bundle.savingsPercent}%
                </div>
              </div>

              {/* Bundle Info */}
              <div className="p-6">
                <h2 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 400 }}>
                  {bundle.name}
                </h2>
                <p className="font-body text-warm-gray text-sm mb-4">
                  {bundle.description}
                </p>

                {/* Bundle Items */}
                <div className="border-t border-sand pt-4 mb-4">
                  <p className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2">
                    Includes:
                  </p>
                  <ul className="space-y-1">
                    {bundle.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-terracotta" />
                        <span className="font-body text-charcoal text-sm">
                          {item.product.name}
                          {item.quantity > 1 && ` x${item.quantity}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
                    ${(bundle.priceCents / 100).toFixed(2)}
                  </span>
                  <span className="font-body text-warm-gray text-sm line-through">
                    ${(bundle.originalPriceCents / 100).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddBundle(bundle)}
                    className="flex-1 bg-charcoal text-cream py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
                  >
                    Add Bundle to Bag
                  </button>
                  <button className="w-12 h-12 flex items-center justify-center border border-sand hover:border-terracotta transition-colors">
                    <Heart className="w-5 h-5 text-warm-gray" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-warm-white p-8 border border-sand">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Tag className="w-8 h-8 text-terracotta mx-auto mb-3" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Better Value
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Bundles offer significant savings compared to buying items separately.
              </p>
            </div>
            <div className="text-center">
              <Package className="w-8 h-8 text-terracotta mx-auto mb-3" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Thoughtfully Curated
              </h3>
              <p className="font-body text-warm-gray text-sm">
                Each bundle is designed to complement and enhance your experience.
              </p>
            </div>
            <div className="text-center">
              <ShoppingBag className="w-8 h-8 text-terracotta mx-auto mb-3" />
              <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                Discreet Delivery
              </h3>
              <p className="font-body text-warm-gray text-sm">
                All bundles ship in plain, unmarked packaging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
