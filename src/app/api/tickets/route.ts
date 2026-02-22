import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get support tickets (for both customers and admins)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const customer = session?.customerId 
      ? await db.customer.findUnique({ where: { id: session.customerId } })
      : null

    // Build where clause
    const where: Record<string, unknown> = {}
    
    // If not admin, only show user's own tickets
    if (!customer?.isAdmin) {
      if (session?.customerId) {
        where.customerId = session.customerId
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (categoryId) where.categoryId = categoryId

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({ /* take: handled */
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true, slug: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, senderType: true }
          },
          _count: { messages: true }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.supportTicket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

// Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    
    const { subject, categoryId, message, orderId, productId, priority, guestEmail, guestName } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    // Get category for auto-assignment
    let category = null
    if (categoryId) {
      category = await db.supportTicketCategory.findUnique({
        where: { id: categoryId },
        include: { autoAssignTo: true }
      })
    }

    // Create ticket with first message
    const ticket = await db.supportTicket.create({
      data: {
        customerId: session?.customerId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        subject,
        categoryId: categoryId || null,
        orderId: orderId || null,
        productId: productId || null,
        priority: priority || 'normal',
        assignedToId: category?.autoAssignToId || null,
        assignedAt: category?.autoAssignToId ? new Date() : null,
        messages: {
          create: {
            senderType: session?.customerId ? 'customer' : 'customer',
            senderId: session?.customerId || null,
            senderName: session?.customerId 
              ? undefined 
              : guestName || 'Guest',
            content: message
          }
        }
      },
      include: {
        category: true,
        messages: { take: 1 }
      }
    })

    return NextResponse.json({ 
      success: true, 
      ticket,
      message: 'Ticket created successfully. We will respond within 24 hours.'
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
