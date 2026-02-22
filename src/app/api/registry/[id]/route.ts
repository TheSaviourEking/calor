import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/registry/[id] - Get single registry
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: {
        id,
        customerId: session.customerId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                variants: { take: 1 },
              },
            },
            purchases: true,
            contributions: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        guests: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { date: 'asc' },
        },
        purchases: {
          include: {
            registryItem: true,
          },
          orderBy: { purchasedAt: 'desc' },
        },
        thankYouNotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    // Calculate stats
    const totalValue = registry.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const purchasedValue = registry.items.reduce((sum, item) => sum + item.price * item.purchasedCount, 0)
    const completionPercentage = totalValue > 0 ? Math.round((purchasedValue / totalValue) * 100) : 0

    return NextResponse.json({
      registry: {
        ...registry,
        stats: {
          totalValue,
          purchasedValue,
          completionPercentage,
          totalItems: registry.items.length,
          purchasedItems: registry.items.filter(i => i.purchasedCount >= i.quantity).length,
          totalGuests: registry.guests.length,
          attendingGuests: registry.guests.filter(g => g.rsvpStatus === 'attending').length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching registry:', error)
    return NextResponse.json({ error: 'Failed to fetch registry' }, { status: 500 })
  }
}

// PUT /api/registry/[id] - Update registry
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      registryType,
      eventDate,
      eventLocation,
      eventNotes,
      theme,
      primaryColor,
      coverImage,
      isPublic,
      password,
      allowGiftMessages,
      allowPartialPurchases,
      allowThankYouNotes,
      showPurchaserInfo,
      status,
    } = body

    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (registryType !== undefined) updateData.registryType = registryType
    if (eventDate !== undefined) updateData.eventDate = eventDate ? new Date(eventDate) : null
    if (eventLocation !== undefined) updateData.eventLocation = eventLocation
    if (eventNotes !== undefined) updateData.eventNotes = eventNotes
    if (theme !== undefined) updateData.theme = theme
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (password !== undefined) updateData.password = password
    if (allowGiftMessages !== undefined) updateData.allowGiftMessages = allowGiftMessages
    if (allowPartialPurchases !== undefined) updateData.allowPartialPurchases = allowPartialPurchases
    if (allowThankYouNotes !== undefined) updateData.allowThankYouNotes = allowThankYouNotes
    if (showPurchaserInfo !== undefined) updateData.showPurchaserInfo = showPurchaserInfo
    if (status !== undefined) {
      updateData.status = status
      if (status === 'active' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const registry = await db.giftRegistry.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ registry })
  } catch (error) {
    console.error('Error updating registry:', error)
    return NextResponse.json({ error: 'Failed to update registry' }, { status: 500 })
  }
}

// DELETE /api/registry/[id] - Delete registry
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    await db.giftRegistry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting registry:', error)
    return NextResponse.json({ error: 'Failed to delete registry' }, { status: 500 })
  }
}
