import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminBundlesClient from './AdminBundlesClient'

export const dynamic = 'force-dynamic'

export default async function AdminBundlesPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const [bundles, products] = await Promise.all([
    db.productBundle.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    db.product.findMany({
      where: { published: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <AdminBundlesClient
      initialBundles={serialise(bundles) as any}
      products={serialise(products) as any}
    />
  )
}
