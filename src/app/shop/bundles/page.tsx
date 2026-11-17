import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import BundlesClient from './BundlesClient'
import { serialise } from '@/lib/serialise'
import { PUBLIC_IMAGE_SELECT } from '@/lib/photos/public-image'

export const dynamic = 'force-dynamic'

async function getBundles() {
  const bundles = await db.productBundle.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, select: PUBLIC_IMAGE_SELECT },
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
      <BundlesClient bundles={serialise(bundles) as any} />
    </ClientWrapper>
  )
}
