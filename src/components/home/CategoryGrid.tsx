import { db } from '@/lib/db'
import {
  Sparkles, Droplet, Shirt, BookOpen,
  PlayCircle, Link2, Shield, Lock
} from 'lucide-react'

const categoryIcons: Record<string, React.ReactNode> = {
  'sparkles': <Sparkles className="w-7 h-7" />,
  'droplet': <Droplet className="w-7 h-7" />,
  'shirt': <Shirt className="w-7 h-7" />,
  'book-open': <BookOpen className="w-7 h-7" />,
  'play-circle': <PlayCircle className="w-7 h-7" />,
  'link-2': <Link2 className="w-7 h-7" />,
  'shield': <Shield className="w-7 h-7" />,
  'lock': <Lock className="w-7 h-7" />,
}

const categoryGradients = [
  'from-blush/60 to-sand/40',
  'from-sand/60 to-cream/40',
  'from-cream/60 to-blush/40',
  'from-blush/40 to-cream/60',
  'from-sand/40 to-blush/60',
  'from-cream/40 to-sand/60',
  'from-blush/50 to-sand/30',
  'from-sand/50 to-cream/30',
]

async function getCategories() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  })
  return categories
}

export default async function CategoryGrid() {
  const categories = await getCategories()

  return (
    <section id="categories" className="py-20 lg:py-32 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">Shop by Category</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2
            className="font-display text-charcoal"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            Every dimension of intimacy
          </h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <a
              key={category.id}
              href={`/shop/${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden"
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[index % categoryGradients.length]} transition-transform duration-500 group-hover:scale-105`}
              />

              {/* Grain texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-[1] opacity-[0.02]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '200px 200px',
                }}
              />

              {/* Terracotta tint on hover */}
              <div className="absolute inset-0 bg-terracotta/0 group-hover:bg-terracotta/8 transition-all duration-500 z-[2]" />

              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center z-[3]">
                <div
                  className={`text-charcoal transition-all duration-300 group-hover:scale-110 ${
                    category.slug === 'kink-fetish'
                      ? 'opacity-100'
                      : 'opacity-45 group-hover:opacity-85'
                  }`}
                >
                  {categoryIcons[category.iconName] || <Sparkles className="w-7 h-7" />}
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-charcoal/60 px-4 py-4 transition-all duration-300 group-hover:bg-charcoal/75 group-hover:-translate-y-1 z-[4]">
                <h3
                  className="font-display text-warm-white text-sm lg:text-base"
                  style={{ fontWeight: 400 }}
                >
                  {category.name}
                </h3>
                <p className="font-body text-warm-gray text-xs mt-1 transition-opacity duration-300 opacity-70 group-hover:opacity-100">
                  {category._count.products} products
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
