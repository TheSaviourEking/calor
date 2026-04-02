import { db } from '@/lib/db'
import AdminOrdersClient from './AdminOrdersClient'
import { serialise } from '@/lib/serialise'

async function getOrdersWithDetails() {
  const orders = await db.order.findMany({
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return orders
}

export default async function AdminOrdersPage() {
  const orders = await getOrdersWithDetails()
  
  return <AdminOrdersClient initialOrders={serialise(orders) as any} />
}
