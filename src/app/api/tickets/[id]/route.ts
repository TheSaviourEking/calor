import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get a specific ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id } = await params

    const customer = session?.customerId 
      ? await db.customer.findUnique({ where: { id: session.customerId } })
      : null

    const isStaff = !!customer?.isAdmin

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      ...(isStaff ? {} : { omit: { internalNotes: true } }),
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: true,
        messages: {
          // Staff-only messages never reach the customer
          ...(isStaff ? {} : { where: { isInternal: false } }),
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Not yours: indistinguishable from a ticket that does not exist
    if (!isStaff && (!session?.customerId || ticket.customerId !== session.customerId)) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}

// Update ticket (status, priority, assignment)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()

    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { status, priority, assignedToId, internalNotes } = body

    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
      if (status === 'resolved') updateData.resolvedAt = new Date()
      if (status === 'closed') updateData.closedAt = new Date()
    }
    if (priority) updateData.priority = priority
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId
      updateData.assignedAt = assignedToId ? new Date() : null
    }
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes

    const ticket = await db.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        category: true
      }
    })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
