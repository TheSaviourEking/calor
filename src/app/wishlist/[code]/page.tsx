import { Metadata } from 'next'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import SharedWishlistClient from './SharedWishlistClient'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  
  const wishlist = await db.sharedWishlist.findUnique({
    where: { shareCode: code },
    select: { title: true, customer: { select: { firstName: true } } },
  })

  if (!wishlist) {
    return { title: 'Wishlist Not Found | CALŌR' }
  }

  return {
    title: `${wishlist.title || 'Wishlist'} by ${wishlist.customer.firstName} | CALŌR`,
    description: `View ${wishlist.customer.firstName}'s curated wishlist on CALŌR`,
  }
}

export default async function SharedWishlistPage({ params }: Props) {
  const { code } = await params

  const sharedWishlist = await db.sharedWishlist.findUnique({
    where: { shareCode: code },
    include: {
      customer: {
        select: {
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
        select: { url: true, altText: true },
      },
    },
  })

  // Sort products in the order they were added
  const sortedProducts = productIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)

  return (
    <SharedWishlistClient
      wishlist={{
        ...sharedWishlist,
        productIds,
        products: sortedProducts,
      }}
    />
  )
}
