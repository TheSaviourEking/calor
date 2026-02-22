import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ProductCard from '@/components/product/ProductCard'
import { BookOpen, PlayCircle, Heart } from 'lucide-react'

async function getEducationProducts() {
  return db.product.findMany({
    where: {
      published: true,
      category: { slug: 'education-media' },
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { take: 1 },
      images: { take: 1 },
    },
  })
}

export default async function EducationPage() {
  const products = await getEducationProducts()

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20">
        {/* Header */}
        <div className="bg-sand py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <BookOpen className="w-12 h-12 text-terracotta mx-auto mb-6" />
            <h1 
              className="font-display text-charcoal mb-4"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
            >
              Education & Media
            </h1>
            <p className="font-body text-warm-gray text-lg max-w-xl mx-auto">
              Books, guides, and courses on intimacy, relationships, and sexual health. Written by experts. Free from judgment.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-warm-white py-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 border border-sand">
                <BookOpen className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Books</h3>
                <p className="font-body text-warm-gray text-sm">Guides on intimacy, relationships, and sexual wellness.</p>
              </div>
              <div className="p-6 border border-sand">
                <PlayCircle className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Video Courses</h3>
                <p className="font-body text-warm-gray text-sm">Step-by-step courses led by relationship therapists.</p>
              </div>
              <div className="p-6 border border-sand">
                <Heart className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Couples Resources</h3>
                <p className="font-body text-warm-gray text-sm">Workbooks and games designed for two.</p>
              </div>
            </div>
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
