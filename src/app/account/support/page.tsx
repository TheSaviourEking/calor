import { redirect } from 'next/navigation'
import SupportClient from './SupportClient'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'
import { customerTicketListArgs } from '@/lib/support/customer-tickets'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Support | calo.',
  description: 'Get help with your orders, products, and account',
}

export default async function SupportPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/support')
  }

  const [tickets, categories, orders] = await Promise.all([
    db.supportTicket.findMany(customerTicketListArgs(session.customerId)),
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
