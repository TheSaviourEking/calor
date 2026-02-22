import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminClient'

export default async function AdminPage() {
  const session = await getSession()
  
  // In production, check for admin flag in user record
  // For now, allow access for demo purposes
  // if (!session) redirect('/account')

  const [products, orders, customers] = await Promise.all([
    db.product.count({ where: { published: true } }),
    db.order.count(),
    db.customer.count(),
  ])

  const recentOrders = await db.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      items: { select: { name: true, quantity: true } },
    },
  })

  const lowStockProducts = await db.product.findMany({
    where: {
      published: true,
      inventoryCount: { lt: 10 },
    },
    take: 10,
    include: {
      variants: { take: 1 },
    },
  })

  const stats = {
    totalProducts: products,
    totalOrders: orders,
    totalCustomers: customers,
    revenue: 0, // Would calculate from orders
  }

  return (
    <AdminDashboard 
      stats={stats}
      recentOrders={recentOrders.map(o => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        total: o.totalCents,
        createdAt: o.createdAt.toISOString(),
        customer: o.customer ? {
          name: `${o.customer.firstName} ${o.customer.lastName}`,
          email: o.customer.email,
        } : null,
      }))}
      lowStockProducts={lowStockProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        inventory: p.inventoryCount,
        price: p.variants[0]?.price || 0,
      }))}
    />
  )
}
