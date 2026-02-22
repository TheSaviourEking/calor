import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import SizeGuideClient from './SizeGuideClient'

async function getSizeGuides() {
  const guides = await db.sizeGuide.findMany({
    where: { isActive: true },
    include: {
      category: true,
      charts: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
  return guides
}

export default async function SizeGuidePage() {
  const guides = await getSizeGuides()
  
  return (
    <ClientWrapper>
      <SizeGuideClient guides={guides} />
    </ClientWrapper>
  )
}
