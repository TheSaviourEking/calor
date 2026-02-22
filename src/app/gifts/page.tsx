import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ProductCard from '@/components/product/ProductCard'
import { Gift } from 'lucide-react'

async function getGiftProducts() {
  // Get products that are bundles/kits + specific gift slugs
  const giftSlugs = ['honeymoon-kit', 'self-care-night-set', 'date-night-duo']
  
  const products = await db.product.findMany({
    where: {
      published: true,
      OR: [
        { slug: { in: giftSlugs } },
        { name: { contains: 'kit' } },
        { name: { contains: 'set' } },
        { name: { contains: 'bundle' } },
      ],
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { take: 1 },
      images: { take: 1 },
    },
  })
  return products
}

export default async function GiftsPage() {
  const products = await getGiftProducts()

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20">
        {/* Header */}
        <div className="bg-blush py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <Gift className="w-12 h-12 text-terracotta mx-auto mb-6" />
            <h1 
              className="font-display text-charcoal mb-4"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
            >
              The Art of Giving
            </h1>
            <p className="font-body text-warm-gray text-lg max-w-xl mx-auto">
              Curated gift sets and bundles for every occasion. Each arrives in discreet packaging with an optional gift message.
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}
