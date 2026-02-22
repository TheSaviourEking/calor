import { redirect } from 'next/navigation'
import SupportClient from './SupportClient'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Support | CALŌR',
  description: 'Get help with your orders, products, and account',
}

export default async function SupportPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/support')
  }

  const [tickets, categories, orders] = await Promise.all([
    db.supportTicket.findMany({
      where: { customerId: session.customerId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, senderType: true }
        },
        _count: { select: { messages: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    db.supportTicketCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 50,
      include: {
        _count: { select: { tickets: true } }
      }
    }),
    db.order.findMany({
      where: { customerId: session.customerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reference: true,
        createdAt: true
      }
    })
  ])

  return (
    <SupportClient
      initialTickets={serialise(tickets as any)}
      initialCategories={serialise(categories as any)}
      initialOrders={serialise(orders as any)}
    />
  )
}
