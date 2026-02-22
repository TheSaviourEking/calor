import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET /api/registry - List user's registries
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registries = await db.giftRegistry.findMany({ /* take: handled */
      where: { customerId: session.customerId },
      include: {
        _count: {
          select: {
            items: true,
            guests: true,
            purchases: true,
          },
        },
        events: {
          orderBy: { date: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate stats for each registry
    const registriesWithStats = await Promise.all(
      registries.map(async (registry) => {
        const items = await db.registryItem.findMany({ take: 50,
          where: { registryId: registry.id },
          select: { price: true, quantity: true, purchasedCount: true },
        })

        const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const purchasedValue = items.reduce((sum, item) => sum + item.price * item.purchasedCount, 0)
        const completionPercentage = totalValue > 0 ? Math.round((purchasedValue / totalValue) * 100) : 0

        return {
          ...registry,
          stats: {
            totalItems: registry._count.items,
            totalGuests: registry._count.guests,
            totalPurchases: registry._count.purchases,
            totalValue,
            purchasedValue,
            completionPercentage,
          },
        }
      })
    )

    return NextResponse.json({ registries: registriesWithStats })
  } catch (error) {
    console.error('Error fetching registries:', error)
    return NextResponse.json({ error: 'Failed to fetch registries' }, { status: 500 })
  }
}

// POST /api/registry - Create new registry
export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    } = body

    // Generate unique slug
    const slug = generateSlug(title)

    // Check if slug already exists
    const existing = await db.giftRegistry.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'A registry with this title already exists' }, { status: 400 })
    }

    const registry = await db.giftRegistry.create({
      data: {
        customerId: session.customerId,
        title,
        description,
        registryType: registryType || 'custom',
        eventDate: eventDate ? new Date(eventDate) : null,
        eventLocation,
        eventNotes,
        theme: theme || 'classic',
        primaryColor,
        coverImage,
        isPublic: isPublic ?? true,
        password,
        allowGiftMessages: allowGiftMessages ?? true,
        allowPartialPurchases: allowPartialPurchases ?? true,
        allowThankYouNotes: allowThankYouNotes ?? true,
        showPurchaserInfo: showPurchaserInfo ?? false,
        status: 'draft',
        slug,
      },
      include: {
        events: true,
      },
    })

    return NextResponse.json({ registry })
  } catch (error) {
    console.error('Error creating registry:', error)
    return NextResponse.json({ error: 'Failed to create registry' }, { status: 500 })
  }
}

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${baseSlug}-${randomSuffix}`
}
