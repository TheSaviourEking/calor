import { db } from '@/lib/db'
import { useLocaleStore } from '@/stores'
import { Gift } from 'lucide-react'

async function getGiftSets() {
  const giftSlugs = ['honeymoon-kit', 'self-care-night-set', 'date-night-duo']
  
  const products = await db.product.findMany({
    where: {
      slug: { in: giftSlugs },
    },
    include: {
      category: {
        select: { name: true },
      },
      variants: {
        take: 1,
      },
    },
  })

  // Add a placeholder for the date-night-duo if it doesn't exist
  const result = [...products]
  if (!products.find(p => p.slug === 'date-night-duo')) {
    result.push({
      id: 'placeholder-date-night',
      slug: 'date-night-duo',
      name: 'Date Night Duo',
      shortDescription: 'A paired set for connection. One card game, one massage oil. An evening planned.',
      fullDescription: '',
      categoryId: '',
      category: { name: 'For Connection' },
      variants: [{ id: 'v1', price: 7500, name: 'Standard', sku: 'SKU-DND', stock: 20, productId: 'placeholder-date-night' }],
      images: [],
      tags: '[]',
      isDigital: false,
      isRestricted: false,
      requiresConsentGate: false,
      inventoryCount: 20,
      published: true,
      badge: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return result
}

export default async function GiftSets() {
  const gifts = await getGiftSets()

  return (
    <section id="gifts" className="py-20 lg:py-32 bg-blush">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">Gift Sets & Bundles</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2 
            className="font-display text-charcoal"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            The art of giving pleasure
          </h2>
        </div>

        {/* Gift Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {gifts.map((gift) => {
            const price = gift.variants[0]?.price || 0
            const formattedPrice = `$${(price / 100).toFixed(0)}`
            
            return (
              <a
                key={gift.id}
                href={`/product/${gift.slug}`}
                className="group block bg-warm-white p-8 border border-transparent hover:border-terracotta transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Decorative Icon */}
                <div className="relative mb-6">
                  <div className="absolute -top-4 -left-4 text-terracotta/10">
                    <Gift className="w-20 h-20" />
                  </div>
                </div>

                <span className="eyebrow text-terracotta/80">{gift.category.name}</span>
                <h3 
                  className="font-display text-charcoal text-xl mt-2 mb-3"
                  style={{ fontWeight: 400 }}
                >
                  {gift.name}
                </h3>
                <p className="font-body text-warm-gray text-sm leading-relaxed mb-6">
                  {gift.shortDescription}
                </p>
                <p className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
                  {formattedPrice}
                </p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
