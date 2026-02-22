import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/registry/[id]/events - List registry events
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

    const events = await db.registryEvent.findMany({ take: 50,
      where: { registryId: id },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/registry/[id]/events - Add event
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
    const {
      name,
      eventType,
      description,
      date,
      endDate,
      location,
      venue,
      address,
      hostName,
      hostContact,
      requiresRsvp,
      rsvpDeadline,
      notes,
    } = body

    const event = await db.registryEvent.create({
      data: {
        registryId: id,
        name,
        eventType: eventType || 'other',
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        venue,
        address,
        hostName,
        hostContact,
        requiresRsvp: requiresRsvp ?? true,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        notes,
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error adding event:', error)
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 })
  }
}

// PUT /api/registry/[id]/events - Update event
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
    const { eventId, ...updates } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Convert dates
    if (updates.date) updates.date = new Date(updates.date)
    if (updates.endDate) updates.endDate = new Date(updates.endDate)
    if (updates.rsvpDeadline) updates.rsvpDeadline = new Date(updates.rsvpDeadline)

    const event = await db.registryEvent.update({
      where: { id: eventId, registryId: id },
      data: updates,
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/registry/[id]/events - Remove event
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
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    await db.registryEvent.delete({
      where: { id: eventId, registryId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
