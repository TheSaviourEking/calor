import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import AdminTicketDetailClient from './AdminTicketDetailClient'

async function getTicketWithDetails(id: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      category: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!ticket) return null

  // Get related order if exists
  let relatedOrder = null
  if (ticket.orderId) {
    relatedOrder = await db.order.findUnique({
      where: { id: ticket.orderId },
      select: {
        id: true,
        reference: true,
        status: true,
        totalCents: true,
        createdAt: true,
      },
    })
  }

  // Get related product if exists
  let relatedProduct = null
  if (ticket.productId) {
    relatedProduct = await db.product.findUnique({
      where: { id: ticket.productId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })
  }

  // Get all admins for assignment
  const admins = await db.customer.findMany({
    where: { isAdmin: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  })

  // Get all categories
  const categories = await db.supportTicketCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  return {
    ticket,
    relatedOrder,
    relatedProduct,
    admins,
    categories,
  }
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getTicketWithDetails(id)

  if (!data) {
    notFound()
  }

  return (
    <ClientWrapper>
      <AdminTicketDetailClient initialData={data} />
    </ClientWrapper>
  )
}
