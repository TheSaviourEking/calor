import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import ManageRegistryClient from './ManageRegistryClient'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Manage Registry | CALŌR',
  description: 'Manage your gift registry.',
}

export default async function ManageRegistryPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account')
  }

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
      guests: true,
    },
  })

  if (!registry || session.customerId !== registry.customer.id) {
    redirect('/registry')
  }

  // Calculate stats
  const totalValue = registry.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const purchasedValue = registry.items.reduce((sum, item) => sum + item.price * item.purchasedCount, 0)
  const completionPercentage = totalValue > 0 ? Math.round((purchasedValue / totalValue) * 100) : 0

  const itemsToShow = registry.items

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
    password: registry.password,
    status: registry.status,
    viewCount: registry.viewCount,
    allowGiftMessages: registry.allowGiftMessages,
    allowPartialPurchases: registry.allowPartialPurchases,
    allowThankYouNotes: registry.allowThankYouNotes,
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
    guests: registry.guests,
    stats: {
      totalValue,
      purchasedValue,
      completionPercentage,
      totalItems: registry.items.length,
      purchasedItems: registry.items.filter(i => i.purchasedCount >= i.quantity).length,
      totalGuests: registry.guests?.length || 0,
      attendingGuests: registry.guests?.filter(g => g.rsvpStatus === 'attending').length || 0,
    },
  }

  return <ManageRegistryClient initialRegistry={serialise(formattedRegistry)} />
}
