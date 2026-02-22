import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/registry/slug/[slug] - Get public registry by slug
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    const includeAll = searchParams.get('includeAll') === 'true'

    // Check if user is authenticated for management access
    const session = await getSession()

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
        guests: includeAll ? true : false,
      },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    // For management mode, check if user owns the registry
    if (includeAll) {
      if (!session || session.customerId !== registry.customer.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      // For public view, check if registry is active
      if (registry.status !== 'active') {
        return NextResponse.json({ error: 'Registry is not available' }, { status: 403 })
      }

      // Check password if needed
      if (!registry.isPublic && registry.password) {
        if (password !== registry.password) {
          return NextResponse.json({ 
            error: 'Password required',
            requiresPassword: true,
          }, { status: 401 })
        }
      }
    }

    // Increment view count (only for public view)
    if (!includeAll) {
      await db.giftRegistry.update({
        where: { id: registry.id },
        data: { viewCount: { increment: 1 } },
      })
    }

    // Calculate stats
    const totalValue = registry.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const purchasedValue = registry.items.reduce((sum, item) => sum + item.price * item.purchasedCount, 0)
    const completionPercentage = totalValue > 0 ? Math.round((purchasedValue / totalValue) * 100) : 0

    // For management mode, return all items
    let itemsToShow = registry.items
    if (!includeAll) {
      // For public view, filter items to show available ones
      itemsToShow = registry.items.filter(item => {
        if (item.purchasedCount < item.quantity) return true
        if (registry.allowPartialPurchases && item.contributions.length > 0) {
          const totalContributions = item.contributions.reduce((sum, c) => sum + c.amountCents, 0)
          return totalContributions < item.price
        }
        return false
      })
    }

    return NextResponse.json({
      registry: {
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
        password: includeAll ? registry.password : undefined,
        status: registry.status,
        viewCount: registry.viewCount,
        allowGiftMessages: registry.allowGiftMessages,
        allowPartialPurchases: registry.allowPartialPurchases,
        allowThankYouNotes: includeAll ? registry.allowThankYouNotes : undefined,
        showPurchaserInfo: registry.showPurchaserInfo,
        ownerName: `${registry.customer.firstName} ${registry.customer.lastName}`,
        events: registry.events,
        items: itemsToShow.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl || item.product?.images[0]?.url,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          purchasedCount: item.purchasedCount,
          remaining: item.quantity - item.purchasedCount,
          priority: item.priority,
          category: item.category,
          notes: item.notes,
          sortOrder: item.sortOrder,
          product: item.product ? {
            id: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            images: item.product.images,
            variants: item.product.variants,
            category: item.product.category,
          } : null,
          purchases: includeAll ? item.purchases : undefined,
          contributions: item.contributions,
          contributionTotal: item.contributions.reduce((sum, c) => sum + c.amountCents, 0),
        })),
        guests: includeAll ? registry.guests : undefined,
        stats: {
          totalValue,
          purchasedValue,
          completionPercentage,
          totalItems: registry.items.length,
          purchasedItems: registry.items.filter(i => i.purchasedCount >= i.quantity).length,
          totalGuests: includeAll ? registry.guests?.length || 0 : undefined,
          attendingGuests: includeAll ? registry.guests?.filter(g => g.rsvpStatus === 'attending').length || 0 : undefined,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching public registry:', error)
    return NextResponse.json({ error: 'Failed to fetch registry' }, { status: 500 })
  }
}
