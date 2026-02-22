import { db } from '@/lib/db'
import ProductCard from '@/components/product/ProductCard'

async function getFeaturedProducts() {
  const products = await db.product.findMany({
    where: {
      published: true,
    },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      variants: {
        take: 1,
      },
      images: {
        take: 1,
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  })
  return products
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  return (
    <section id="featured" className="py-20 lg:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="w-10 h-px bg-terracotta/40" />
            <span className="eyebrow">New Arrivals</span>
            <span className="w-10 h-px bg-terracotta/40" />
          </div>
          <h2 
            className="font-display text-charcoal"
            style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 300 }}
          >
            Thoughtfully chosen
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12 lg:mt-16">
          <a
            href="/shop"
            className="inline-block border border-charcoal text-charcoal px-8 py-4 font-body text-sm tracking-wider uppercase transition-all duration-300 hover:bg-charcoal hover:text-cream"
          >
            View All Products
          </a>
        </div>
      </div>
    </section>
  )
}
