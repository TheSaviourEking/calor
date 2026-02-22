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
                className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[index % categoryGradients.length]} transition-all duration-500 group-hover:scale-105`}
              />
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`text-charcoal transition-all duration-300 ${
                    category.slug === 'kink-fetish' 
                      ? 'opacity-100' 
                      : 'opacity-45 group-hover:opacity-85'
                  }`}
                >
                  {categoryIcons[category.iconName] || <Sparkles className="w-7 h-7" />}
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-charcoal/60 px-4 py-4 transition-all duration-300 group-hover:bg-charcoal/75 group-hover:-translate-y-1">
                <h3 
                  className="font-display text-warm-white text-sm lg:text-base"
                  style={{ fontWeight: 400 }}
                >
                  {category.name}
                </h3>
                <p className="font-body text-warm-gray text-xs mt-1">
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
