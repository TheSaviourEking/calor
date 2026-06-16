'use client'

import { useState, useEffect } from 'react'
import { Download, BookOpen, Headphones, Video, Lock } from 'lucide-react'
import Link from 'next/link'
import ClientWrapper from '@/components/layout/ClientWrapper'

interface DigitalItem {
  orderId: string
  orderReference: string
  productName: string
  productSlug: string
  productImage: string | null
  category: string
  purchasedAt: string
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Education & Media': <BookOpen className="w-5 h-5" />,
  'Adult Fiction & Novels': <BookOpen className="w-5 h-5" />,
  'audio': <Headphones className="w-5 h-5" />,
  'video': <Video className="w-5 h-5" />,
}

export default function DigitalLibraryPage() {
  const [items, setItems] = useState<DigitalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDigital = async () => {
      try {
        const res = await fetch('/api/orders?digital=true')
        if (res.ok) {
          const data = await res.json()
          // Extract digital products from orders
          const digitalItems: DigitalItem[] = []
          for (const order of (data.orders || [])) {
            for (const item of order.items || []) {
              if (item.isDigital) {
                digitalItems.push({
                  orderId: order.id,
                  orderReference: order.reference,
                  productName: item.name,
                  productSlug: item.productSlug || '',
                  productImage: item.image || null,
                  category: item.category || 'Digital',
                  purchasedAt: order.createdAt,
                })
              }
            }
          }
          setItems(digitalItems)
        }
      } catch { /* handled silently */ }
      setLoading(false)
    }
    fetchDigital()
  }, [])

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="font-display text-charcoal text-3xl mb-2" style={{ fontWeight: 300 }}>
              Digital Library
            </h1>
            <p className="font-body text-warm-gray text-base">
              Your purchased digital products, ready to access anytime.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-sand/30 animate-shimmer" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-warm-white border border-sand p-16 text-center">
              <Lock className="w-16 h-16 text-sand mx-auto mb-4" />
              <h2 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 300 }}>
                No digital purchases yet
              </h2>
              <p className="font-body text-warm-gray text-sm mb-6 max-w-sm mx-auto">
                When you purchase digital products — novels, audio series, guides, or media — they&apos;ll appear here for instant access.
              </p>
              <Link
                href="/shop/education-media"
                className="inline-block bg-charcoal text-cream px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
              >
                Browse Digital Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const Icon = categoryIcons[item.category] || <BookOpen className="w-5 h-5" />
                return (
                  <div key={`${item.orderId}-${idx}`} className="bg-warm-white border border-sand p-5 flex items-center gap-5">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gradient-to-br from-cream to-sand flex-shrink-0 flex items-center justify-center text-terracotta">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      ) : Icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                        {item.productName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="eyebrow text-[0.6rem]">{item.category}</span>
                        <span className="font-body text-warm-gray text-xs">
                          Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                        </span>
                        <span className="font-body text-warm-gray text-xs">
                          Order #{item.orderReference}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="inline-flex items-center gap-2 bg-charcoal text-cream px-4 py-2 font-body text-xs uppercase tracking-wider hover:bg-terracotta transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Access
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && items.length > 0 && (
            <p className="font-body text-warm-gray text-xs text-center mt-8">
              Digital products are licensed for personal use. See our{' '}
              <Link href="/legal/terms" className="underline hover:text-charcoal transition-colors">
                Terms of Service
              </Link>{' '}
              for details.
            </p>
          )}
        </div>
      </div>
    </ClientWrapper>
  )
}
