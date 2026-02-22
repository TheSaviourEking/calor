import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import AdminSupportClient from './AdminSupportClient'

async function getTicketsWithStats() {
  const [tickets, stats, categories, admins] = await Promise.all([
    db.supportTicket.findMany({
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            senderType: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    }),
    db.supportTicketCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    db.customer.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
  ])

  return {
    tickets: tickets.map(ticket => ({
      ...ticket,
      messages: undefined,
      messageCount: ticket._count.messages,
      lastMessage: ticket.messages[0] || null,
    })),
    stats: {
      open: stats.find(s => s.status === 'open')?._count || 0,
      in_progress: stats.find(s => s.status === 'in_progress')?._count || 0,
      waiting_customer: stats.find(s => s.status === 'waiting_customer')?._count || 0,
      waiting_third_party: stats.find(s => s.status === 'waiting_third_party')?._count || 0,
      resolved: stats.find(s => s.status === 'resolved')?._count || 0,
      closed: stats.find(s => s.status === 'closed')?._count || 0,
    },
    categories,
    admins,
  }
}

export default async function AdminSupportPage() {
  const data = await getTicketsWithStats()
  return (
    <ClientWrapper>
      <AdminSupportClient initialData={data} />
    </ClientWrapper>
  )
}
