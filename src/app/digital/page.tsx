import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ProductCard from '@/components/product/ProductCard'
import { Headphones, Video, BookOpen, Download } from 'lucide-react'

async function getDigitalProducts() {
  return db.product.findMany({
    where: {
      published: true,
      isDigital: true,
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { take: 1 },
      images: { take: 1 },
    },
  })
}

export default async function DigitalPage() {
  const products = await getDigitalProducts()

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20">
        {/* Header */}
        <div className="bg-charcoal py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <Download className="w-12 h-12 text-terracotta mx-auto mb-6" />
            <h1 
              className="font-display text-cream mb-4"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
            >
              Pleasure Without Waiting
            </h1>
            <p className="font-body text-warm-gray text-lg max-w-xl mx-auto">
              Digital products available instantly. Audio erotica, video courses, and ebooks delivered to your account.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-cream py-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Headphones className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Audio Erotica</h3>
                <p className="font-body text-warm-gray text-sm">Professionally produced stories. New releases weekly.</p>
              </div>
              <div>
                <Video className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Video Courses</h3>
                <p className="font-body text-warm-gray text-sm">Guided intimacy series for individuals and couples.</p>
              </div>
              <div>
                <BookOpen className="w-8 h-8 text-terracotta mx-auto mb-4" />
                <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>Digital Books</h3>
                <p className="font-body text-warm-gray text-sm">Erotic novels and educational guides in ePub and PDF.</p>
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
