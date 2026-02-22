import { db } from '@/lib/db'
import AdminProductsClient from './AdminProductsClient'
import { serialise } from '@/lib/serialise'

async function getProductsWithVariants() {
  const products = await db.product.findMany({
    include: {
      category: true,
      variants: true,
      images: { take: 1 },
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return products
}

async function getCategories() {
  return db.category.findMany({
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProductsWithVariants(),
    getCategories(),
  ])

  return <AdminProductsClient initialProducts={serialise(products)} categories={serialise(categories)} />
}
