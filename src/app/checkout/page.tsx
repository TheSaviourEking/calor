import { db } from '@/lib/db'
import CheckoutClient from './CheckoutClient'
import { getSession } from '@/lib/auth'

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
      giftWrappingOptions={giftWrappingOptions}
      initialAvailablePoints={initialAvailablePoints}
    />
  )
}
