import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const session = await getSession()

  if (!session) {
    redirect('/account')
  }

  const orders = await db.order.findMany({
    where: { customerId: session.customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: { select: { isDigital: true } },
        },
      },
    },
  })

  return <OrdersClient initialOrders={serialise(orders) as any} />
}
