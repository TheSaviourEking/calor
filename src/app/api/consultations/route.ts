import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// Durations offered by the booking UI (ConsultationsClient)
const ALLOWED_DURATIONS = [30, 45, 60]
const ALLOWED_TYPES = ['video', 'phone', 'chat']
const CANCELLABLE = ['pending', 'confirmed']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = (await getSession())?.customerId ?? null

    // Get the caller's own bookings (the customerId parameter only signals intent)
    if (searchParams.get('customerId') && userId) {
      const bookings = await db.consultationBooking.findMany({ take: 50,
        where: { customerId: userId },
        include: {
          consultant: true,
          review: true
        },
        orderBy: { scheduledAt: 'desc' }
      })
      return NextResponse.json({ bookings })
    }

    // Get available time slots for a consultant
    const consultantId = searchParams.get('consultantId')
    const date = searchParams.get('date')

    if (consultantId && date) {
      const requestedDate = new Date(date)
      const dayOfWeek = requestedDate.getDay()
      
      const consultant = await db.consultant.findUnique({
        where: { id: consultantId },
        include: {
          availability: {
            where: { dayOfWeek, isAvailable: true }
          },
          bookings: {
            where: {
              scheduledAt: {
                gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
                lt: new Date(requestedDate.setHours(23, 59, 59, 999))
              },
              status: { in: ['pending', 'confirmed'] }
            }
          }
        }
      })

      if (!consultant) {
        return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
      }

      // Generate available slots
      const slots: string[] = []
      for (const avail of consultant.availability) {
        const [startHour, startMin] = avail.startTime.split(':').map(Number)
        const [endHour, endMin] = avail.endTime.split(':').map(Number)
        
        let currentHour = startHour
        let currentMin = startMin
        
        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          const slotTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
          const slotDateTime = new Date(date)
          slotDateTime.setHours(currentHour, currentMin, 0, 0)
          
          // Check if slot is already booked
          const isBooked = consultant.bookings.some(b => {
            const bookingTime = new Date(b.scheduledAt)
            return bookingTime.getTime() === slotDateTime.getTime()
          })
          
          // Check if slot is in the future
          const isFuture = slotDateTime > new Date()
          
          if (!isBooked && isFuture) {
            slots.push(slotTime)
          }
          
          // Move to next 30-minute slot
          currentMin += 30
          if (currentMin >= 60) {
            currentMin = 0
            currentHour++
          }
        }
      }

      return NextResponse.json({ slots })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { consultantId, scheduledAt, duration, type, notes } = await request.json()

    if (!consultantId || !scheduledAt || !duration || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_DURATIONS.includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid consultation type' }, { status: 400 })
    }

    const start = new Date(scheduledAt)
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
    }

    // Get consultant info
    const consultant = await db.consultant.findUnique({
      where: { id: consultantId }
    })

    if (!consultant) {
      return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
    }

    if (!consultant.isAvailable) {
      return NextResponse.json({ error: 'Consultant is not available' }, { status: 400 })
    }

    // Calculate price
    const priceCents = Math.ceil((consultant.hourlyRate * duration) / 60)
    const end = new Date(start.getTime() + duration * 60000)

    // Refuse overlapping bookings, then create
    const booking = await db.$transaction(async (tx) => {
      const nearby = await tx.consultationBooking.findMany({
        where: {
          consultantId,
          status: { in: ['pending', 'confirmed'] },
          scheduledAt: {
            gte: new Date(start.getTime() - Math.max(...ALLOWED_DURATIONS) * 60000),
            lt: end
          }
        },
        select: { scheduledAt: true, duration: true }
      })
      const overlaps = nearby.some(b =>
        b.scheduledAt.getTime() < end.getTime() &&
        b.scheduledAt.getTime() + b.duration * 60000 > start.getTime()
      )
      if (overlaps) return null

      return tx.consultationBooking.create({
        data: {
          consultantId,
          customerId: session.customerId,
          scheduledAt: start,
          duration,
          type,
          notes,
          priceCents,
          status: 'pending'
        },
        include: {
          consultant: true
        }
      })
    })

    if (!booking) {
      return NextResponse.json({ error: 'That time is no longer available' }, { status: 409 })
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      message: 'Consultation booked successfully. You will receive a confirmation email shortly.'
    })
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Customers may only cancel a pending or confirmed booking
    const cancelError = NextResponse.json(
      { error: 'You can only cancel a pending or confirmed booking' },
      { status: 400 }
    )
    if (status !== 'cancelled') return cancelError

    // Verify booking belongs to user
    const existingBooking = await db.consultationBooking.findFirst({
      where: { id: bookingId, customerId: session.customerId }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!CANCELLABLE.includes(existingBooking.status)) return cancelError

    const result = await db.consultationBooking.updateMany({
      where: { id: bookingId, customerId: session.customerId, status: { in: ['pending', 'confirmed'] } },
      data: { status: 'cancelled' }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Booking can no longer be cancelled' }, { status: 409 })
    }

    const booking = await db.consultationBooking.findUnique({
      where: { id: bookingId },
      include: { consultant: true }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Error updating consultation:', error)
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 })
  }
}
