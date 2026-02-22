import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get couples link status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find existing couples links
    const links = await db.couplesLink.findMany({
      where: {
        OR: [
          { customer1Id: session.customerId },
          { customer2Id: session.customerId }
        ]
      },
      include: {
        customer1: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        customer2: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Get pending invitations sent to this user
    const pendingInvitations = links.filter(l =>
      l.status === 'pending' && l.customer2Id === session.customerId
    )

    // Get active link
    const activeLink = links.find(l => l.status === 'active')

    return NextResponse.json({
      links,
      pendingInvitations,
      activeLink,
      customerId: session.customerId
    })
  } catch (error) {
    console.error('Error fetching couples link:', error)
    return NextResponse.json({ error: 'Failed to fetch couples link' }, { status: 500 })
  }
}

// Send couples link invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { partnerEmail } = await request.json()

    if (!partnerEmail) {
      return NextResponse.json({ error: 'Partner email is required' }, { status: 400 })
    }

    // Find partner by email
    const partner = await db.customer.findUnique({
      where: { email: partnerEmail.toLowerCase() }
    })

    if (!partner) {
      return NextResponse.json({
        error: 'Partner not found. They need to create an account first.'
      }, { status: 404 })
    }

    if (partner.id === session.customerId) {
      return NextResponse.json({ error: 'You cannot link to yourself' }, { status: 400 })
    }

    // Check if already linked
    const existingLink = await db.couplesLink.findFirst({
      where: {
        OR: [
          { customer1Id: session.customerId, customer2Id: partner.id },
          { customer1Id: partner.id, customer2Id: session.customerId }
        ]
      }
    })

    if (existingLink) {
      return NextResponse.json({
        error: existingLink.status === 'active'
          ? 'You are already linked with this partner'
          : 'A pending invitation already exists'
      }, { status: 400 })
    }

    // Create couples link invitation
    const link = await db.couplesLink.create({
      data: {
        customer1Id: session.customerId,
        customer2Id: partner.id,
        requestedById: session.customerId,
        status: 'pending'
      },
      include: {
        customer1: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        customer2: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      link,
      message: `Invitation sent to ${partner.firstName}`
    })
  } catch (error) {
    console.error('Error creating couples link:', error)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}

// Accept, reject, or unlink
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { linkId, action } = await request.json()

    if (!linkId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const link = await db.couplesLink.findUnique({
      where: { id: linkId }
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Verify user is part of this link
    if (link.customer1Id !== session.customerId && link.customer2Id !== session.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let updatedLink

    switch (action) {
      case 'accept':
        // Only the invited person can accept
        if (link.customer2Id !== session.customerId) {
          return NextResponse.json({ error: 'Only the invited partner can accept' }, { status: 403 })
        }
        updatedLink = await db.couplesLink.update({
          where: { id: linkId },
          data: {
            status: 'active',
            acceptedAt: new Date()
          }
        })
        break

      case 'reject':
        // Only the invited person can reject
        if (link.customer2Id !== session.customerId) {
          return NextResponse.json({ error: 'Only the invited partner can reject' }, { status: 403 })
        }
        await db.couplesLink.delete({ where: { id: linkId } })
        return NextResponse.json({ success: true, message: 'Invitation rejected' })

      case 'unlink':
        updatedLink = await db.couplesLink.update({
          where: { id: linkId },
          data: { status: 'inactive' }
        })
        break

      case 'cancel':
        // Only the requester can cancel
        if (link.requestedById !== session.customerId) {
          return NextResponse.json({ error: 'Only the sender can cancel' }, { status: 403 })
        }
        await db.couplesLink.delete({ where: { id: linkId } })
        return NextResponse.json({ success: true, message: 'Invitation cancelled' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, link: updatedLink })
  } catch (error) {
    console.error('Error updating couples link:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
  }
}
