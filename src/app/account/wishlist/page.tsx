import { redirect } from 'next/navigation'
import WishlistClient from './WishlistClient'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Wishlist | CALŌR',
  description: 'Your saved items and shared wishlists',
}

export default async function WishlistPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/wishlist')
  }

  const wishlists = await db.sharedWishlist.findMany({
    take: 50,
    where: { customerId: session.customerId },
    orderBy: { createdAt: 'desc' },
  })

  // Parse productIds from JSON since prisma stored them as string
  const formattedWishlists = wishlists.map(w => ({
    ...w,
    productIds: JSON.parse(w.productIds),
  }))

  return <WishlistClient initialSharedWishlists={serialise(formattedWishlists as any)} />
}
