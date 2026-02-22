import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ReturnsClient from './ReturnsClient'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata: Metadata = {
  title: 'Returns & Satisfaction Guarantee | CALŌR',
  description: 'Request a return or exchange. Our satisfaction guarantee ensures you love every purchase.'
}

export default async function ReturnsPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/returns')
  }

  // Fetch orders
  const orders = await db.order.findMany({
    where: { customerId: session.customerId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1 } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch returns
  const returns = await db.returnRequest.findMany({
    where: { customerId: session.customerId },
    select: {
      id: true,
      status: true,
      reason: true,
      reasonDetails: true,
      refundMethod: true,
      refundAmount: true,
      trackingNumber: true,
      createdAt: true,
      order: { select: { reference: true } },
      items: { select: { id: true, quantity: true, condition: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <ClientWrapper>
      <ReturnsClient
        initialOrders={serialise(orders)}
        initialReturns={serialise(returns as any)}
      />
    </ClientWrapper>
  )
}
