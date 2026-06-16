import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import CheckoutClient from './CheckoutClient'
import { getSession } from '@/lib/auth'
import { serialise } from '@/lib/serialise'

export const dynamic = 'force-dynamic'

async function getGiftWrappingOptions() {
  return db.giftWrappingOption.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      imageUrl: true,
    },
  })
}

export default async function CheckoutPage() {
  // Age gate enforcement — both authenticated and guest users must be age-verified
  // This is a server-side check so it cannot be bypassed by direct URL navigation
  const cookieStore = await cookies()
  const ageVerified = cookieStore.get('calor_age_verified')?.value
  if (!ageVerified) {
    redirect('/age-gate?returnTo=/checkout')
  }

  const session = await getSession()
  let initialAvailablePoints = 0

  if (session?.customerId) {
    const loyaltyAccount = await db.loyaltyAccount.findUnique({
      where: { customerId: session.customerId },
      select: { points: true }
    })
    initialAvailablePoints = loyaltyAccount?.points || 0
  }

  const giftWrappingOptions = await getGiftWrappingOptions()

  return (
    <CheckoutClient
      giftWrappingOptions={serialise(giftWrappingOptions) as any}
      initialAvailablePoints={initialAvailablePoints}
    />
  )
}
