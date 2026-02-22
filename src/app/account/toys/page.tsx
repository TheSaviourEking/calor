import { redirect } from 'next/navigation'
import SmartToysClient from './SmartToysClient'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Smart Toys | CALŌR',
  description: 'Connect, control, and create personalized experiences with your smart toys',
}

export default async function SmartToysPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/toys')
  }

  const customerId = session.customerId

  // 1. Fetch toys
  const toys = await db.customerSmartToy.findMany({
    where: { customerId, isActive: true },
    include: {
      toyModel: {
        include: { brand: true },
      },
    },
    orderBy: { lastConnected: 'desc' },
  })

  // 2. Fetch brands
  const brands = await db.smartToyBrand.findMany({
    where: { isConnected: true },
    include: {
      toyModels: {
        where: { isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  // 3. Fetch patterns (user's + public)
  const patterns = await db.vibrationPattern.findMany({
    where: {
      OR: [
        { creatorId: customerId },
        { isPublic: true },
      ],
    },
    orderBy: [
      { isFeatured: 'desc' },
      { useCount: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // 4. Fetch session stats
  const statsRes = await db.toySession.aggregate({
    where: { customerId, endedAt: { not: null } },
    _sum: { duration: true },
    _avg: { avgIntensity: true },
    _count: true,
  })

  const partnerSessionsCount = await db.toySession.count({
    where: {
      customerId,
      partnerId: { not: null },
    },
  })

  const stats = {
    totalSessions: statsRes._count,
    totalDuration: statsRes._sum.duration || 0,
    avgIntensity: statsRes._avg.avgIntensity || 0,
    partnerSessions: partnerSessionsCount,
  }

  return (
    <SmartToysClient
      initialToys={serialise(toys as any)}
      initialBrands={serialise(brands as any)}
      initialPatterns={serialise(patterns as any)}
      initialStats={serialise(stats as any)}
      initialCustomerId={customerId}
    />
  )
}
