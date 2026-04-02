import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ShopClient from './ShopClient'
import { serialise } from '@/lib/serialise'

export const revalidate = 3600 // Revalidate every hour

async function getProducts() {
  const products = await db.product.findMany({
    where: { published: true },
    include: {
      category: {
        select: { name: true, slug: true },
      },
      variants: {
        take: 1,
        select: { id: true, price: true, stock: true },
      },
      images: {
        take: 2,
        orderBy: { sortOrder: 'asc' },
        select: { url: true, altText: true },
      },
      videos: {
        take: 1,
        orderBy: { sortOrder: 'asc' },
        select: { url: true, title: true, videoType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return products
}

async function getCategories() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
    },
  })
  return categories
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <ClientWrapper>
      <ShopClient
        initialProducts={serialise(products) as any}
        categories={serialise(categories) as any}
      />
    </ClientWrapper>
  )
}
