import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    
    const { content, isInternal, attachments } = body

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check ticket exists
    const ticket = await db.supportTicket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const customer = session?.customerId 
      ? await db.customer.findUnique({ where: { id: session.customerId } })
      : null

    // Determine sender type
    let senderType: 'customer' | 'admin' | 'system' = 'customer'
    let senderId: string | null = null
    let senderName: string | null = null
    let internalMessage = false

    if (customer?.isAdmin) {
      senderType = 'admin'
      senderId = customer.id
      senderName = `${customer.firstName} ${customer.lastName}`
      internalMessage = isInternal || false
    } else if (session?.customerId) {
      senderType = 'customer'
      senderId = session.customerId
      // Verify ownership
      if (ticket.customerId !== session.customerId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Guest - verify by email (simplified)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create message
    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        senderType,
        senderId,
        senderName,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
        isInternal: internalMessage
      }
    })

    // Update ticket
    const updateData: Record<string, unknown> = {
      responseCount: { increment: 1 }
    }

    // Set first response time if admin's first reply
    if (senderType === 'admin' && !ticket.firstResponseAt && !internalMessage) {
      updateData.firstResponseAt = new Date()
    }

    // Update status based on sender
    if (senderType === 'customer' && ticket.status !== 'open') {
      updateData.status = 'in_progress'
    }

    await db.supportTicket.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      message,
      isInternal: internalMessage
    })
  } catch (error) {
    console.error('Error adding message:', error)
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
  }
}
