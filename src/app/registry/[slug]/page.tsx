import { Suspense } from 'react'
import PublicRegistryClient from './PublicRegistryClient'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Gift Registry | CALŌR',
  description: 'View and purchase gifts from this registry.',
}

export default async function PublicRegistryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const registry = await db.giftRegistry.findUnique({
    where: { slug },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
              variants: { take: 1 },
              category: { select: { name: true } },
            },
          },
          contributions: true,
          purchases: {
            select: { id: true, purchaserName: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { sortOrder: 'asc' },
        ],
      },
      events: {
        orderBy: { date: 'asc' },
      },
      guests: false, // public view
    },
  })

  if (!registry || registry.status !== 'active') {
    return (
      <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center font-body text-warm-gray">Loading...</div>}>
        <PublicRegistryClient initialRegistry={null} initialRequiresPassword={false} />
      </Suspense>
    )
  }

  if (!registry.isPublic && registry.password) {
    return (
      <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center font-body text-warm-gray">Loading...</div>}>
        <PublicRegistryClient initialRegistry={null} initialRequiresPassword={true} />
      </Suspense>
    )
  }

  // Calculate stats
  const totalValue = registry.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const purchasedValue = registry.items.reduce((sum, item) => sum + item.price * item.purchasedCount, 0)
  const completionPercentage = totalValue > 0 ? Math.round((purchasedValue / totalValue) * 100) : 0

  // Public view: filter available items
  const itemsToShow = registry.items.filter(item => {
    if (item.purchasedCount < item.quantity) return true
    if (registry.allowPartialPurchases && item.contributions.length > 0) {
      const totalContributions = item.contributions.reduce((sum, c) => sum + c.amountCents, 0)
      return totalContributions < item.price
    }
    return false
  })

  const formattedRegistry = {
    id: registry.id,
    slug: registry.slug,
    title: registry.title,
    description: registry.description,
    registryType: registry.registryType,
    eventDate: registry.eventDate,
    eventLocation: registry.eventLocation,
    theme: registry.theme,
    primaryColor: registry.primaryColor,
    coverImage: registry.coverImage,
    isPublic: registry.isPublic,
    status: registry.status,
    viewCount: registry.viewCount,
    allowGiftMessages: registry.allowGiftMessages,
    allowPartialPurchases: registry.allowPartialPurchases,
    showPurchaserInfo: registry.showPurchaserInfo,
    ownerName: `${registry.customer.firstName} ${registry.customer.lastName}`,
    events: registry.events,
    items: itemsToShow.map(item => ({
      ...item,
      imageUrl: item.imageUrl || item.product?.images[0]?.url,
      remaining: item.quantity - item.purchasedCount,
      product: item.product ? {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        images: item.product.images,
        variants: item.product.variants,
        category: item.product.category,
      } : null,
      contributionTotal: item.contributions.reduce((sum, c) => sum + c.amountCents, 0),
    })),
    stats: {
      totalValue,
      purchasedValue,
      completionPercentage,
      totalItems: registry.items.length,
      purchasedItems: registry.items.filter(i => i.purchasedCount >= i.quantity).length,
      availableItems: itemsToShow.length, // Include available items count
    },
  }

  // Increment view count asynchronously in background
  db.giftRegistry.update({
    where: { id: registry.id },
    data: { viewCount: { increment: 1 } },
  }).catch(console.error)

  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center font-body text-warm-gray">Loading...</div>}>
      <PublicRegistryClient
        initialRegistry={serialise(formattedRegistry)}
        initialRequiresPassword={false}
      />
    </Suspense>
  )
}
