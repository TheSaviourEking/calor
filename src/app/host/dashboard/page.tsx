import HostDashboardClient from './HostDashboardClient'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'

export default async function HostDashboardPage() {
  const session = await getSession()
  if (!session?.customerId) {
    redirect('/account')
  }

  // Fetch host profile (matching /api/hosts/me logic which uses findFirst for demo)
  const hostProfile = await db.streamHost.findFirst({
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  let streams: any[] = []

  if (hostProfile) {
    // Fetch streams for this host if profile exists
    streams = await db.liveStream.findMany({
      where: { hostId: hostProfile.id },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            isLive: true,
          },
        },
        products: {
          take: 3,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1 },
                variants: { take: 1 },
              },
            },
          },
        },
        _count: {
          select: {
            viewers: true,
            products: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // live first, then scheduled, then ended
        { scheduledStart: 'desc' },
      ],
      take: 10,
    })
  }

  return (
    <HostDashboardClient
      initialHostProfile={serialise(hostProfile)}
      initialStreams={serialise(streams)}
    />
  )
}
