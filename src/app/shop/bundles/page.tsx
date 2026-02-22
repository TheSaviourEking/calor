import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import BundlesClient from './BundlesClient'

async function getBundles() {
  const bundles = await db.productBundle.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
              variants: { take: 1 },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
  return bundles
}

export default async function BundlesPage() {
  const bundles = await getBundles()
  
  return (
    <ClientWrapper>
      <BundlesClient bundles={bundles} />
    </ClientWrapper>
  )
}
