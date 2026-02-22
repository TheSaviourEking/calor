import { db } from '@/lib/db'
import { Headphones, Video, BookOpen } from 'lucide-react'

const digitalIcons = {
  'audio-erotica-membership': Headphones,
  'guided-intimacy-series': Video,
  'default': BookOpen,
}

async function getDigitalProducts() {
  const products = await db.product.findMany({
    where: {
      isDigital: true,
      published: true,
    },
    include: {
      category: {
        select: { name: true },
      },
      variants: {
        take: 1,
      },
    },
    take: 3,
  })
  return products
}

export default async function DigitalProducts() {
  const products = await getDigitalProducts()

  return (
    <section className="py-20 lg:py-32 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">Digital Products</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2 
            className="font-display text-charcoal"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            Pleasure without waiting
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => {
            const Icon = digitalIcons[product.slug as keyof typeof digitalIcons] || digitalIcons.default
            const price = product.variants[0]?.price || 0
            const isSubscription = product.slug.includes('membership')
            
            return (
              <a
                key={product.id}
                href={`/product/${product.slug}`}
                className="group p-8 bg-cream border border-sand hover:border-terracotta transition-all duration-300"
              >
                <Icon className="w-8 h-8 text-terracotta mb-6" />
                <span className="eyebrow">{product.category.name}</span>
                <h3 
                  className="font-display text-charcoal text-xl mt-2 mb-3"
                  style={{ fontWeight: 400 }}
                >
                  {product.name}
                </h3>
                <p className="font-body text-warm-gray text-sm leading-relaxed mb-6">
                  {product.shortDescription}
                </p>
                <p className="font-body text-charcoal text-sm">
                  ${isSubscription ? (price / 100).toFixed(0) + '/mo' : 'From $' + (price / 100).toFixed(0)}
                </p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
