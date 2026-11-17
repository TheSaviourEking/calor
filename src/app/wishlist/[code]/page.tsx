import { Metadata } from 'next'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import SharedWishlistClient from './SharedWishlistClient'
import { publicDisplayName } from '@/lib/discretion'
import { wishlistMetadata } from '@/lib/public-metadata'
import { serialise } from '@/lib/serialise'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  
  const wishlist = await db.sharedWishlist.findUnique({
    where: { shareCode: code },
    select: { title: true, isActive: true, expiresAt: true, customer: { select: { nickname: true, firstName: true, lastName: true } } },
  })

  if (!wishlist || !wishlist.isActive || (wishlist.expiresAt && new Date() > wishlist.expiresAt)) {
    return { title: 'Wishlist Not Found | calo.' }
  }

  return wishlistMetadata(wishlist.title, publicDisplayName(wishlist.customer, 'a calo. member'))
}

export default async function SharedWishlistPage({ params }: Props) {
  const { code } = await params

  const sharedWishlist = await db.sharedWishlist.findUnique({
    where: { shareCode: code },
    include: {
      customer: {
        select: {
          nickname: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!sharedWishlist || !sharedWishlist.isActive) {
    notFound()
  }

  // Check expiration
  if (sharedWishlist.expiresAt && new Date() > sharedWishlist.expiresAt) {
    notFound()
  }

  // Parse product IDs
  const productIds: string[] = JSON.parse(sharedWishlist.productIds)

  // Fetch products
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      published: true,
    },
    include: {
      category: { select: { name: true, slug: true } },
      variants: { select: { id: true, price: true, stock: true } },
      images: {
        take: 1,
        select: { url: true, altText: true, treatment: true },
      },
    },
  })

  // Sort products in the order they were added
  const sortedProducts = productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)

  const { customer, customerId: _customerId, ...rest } = sharedWishlist

  return (
    <SharedWishlistClient
      wishlist={serialise({
        ...rest,
        ownerName: publicDisplayName(customer, 'A calo. member'),
        productIds,
        products: sortedProducts,
      }) as any}
    />
  )
}
