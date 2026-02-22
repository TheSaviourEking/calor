import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/registry/[id]/guests - List registry guests
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const guests = await db.registryGuest.findMany({ take: 50,
      where: { registryId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

// POST /api/registry/[id]/guests - Add guest(s)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { guests } = body

    // Support bulk add
    const guestsToAdd = Array.isArray(guests) ? guests : [body]

    const created = []
    for (const guest of guestsToAdd) {
      try {
        const newGuest = await db.registryGuest.create({
          data: {
            registryId: id,
            email: guest.email,
            name: guest.name,
            phone: guest.phone,
            notes: guest.notes,
          },
        })
        created.push(newGuest)
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({ guests: created, added: created.length })
  } catch (error) {
    console.error('Error adding guests:', error)
    return NextResponse.json({ error: 'Failed to add guests' }, { status: 500 })
  }
}

// PUT /api/registry/[id]/guests - Update guest
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { guestId, ...updates } = body

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 })
    }

    const guest = await db.registryGuest.update({
      where: { id: guestId, registryId: id },
      data: updates,
    })

    return NextResponse.json({ guest })
  } catch (error) {
    console.error('Error updating guest:', error)
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
  }
}

// DELETE /api/registry/[id]/guests - Remove guest
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registry = await db.giftRegistry.findFirst({
      where: { id, customerId: session.customerId },
    })

    if (!registry) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 })
    }

    await db.registryGuest.delete({
      where: { id: guestId, registryId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest:', error)
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
  }
}
