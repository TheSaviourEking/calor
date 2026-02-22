import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    let userId: string | null = null
    
    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        userId = decoded.customerId
      }
    }

    // Get user's bookings
    if (customerId && userId === customerId) {
      const bookings = await db.consultationBooking.findMany({ take: 50,
        where: { customerId },
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
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { consultantId, scheduledAt, duration, type, notes } = await request.json()

    if (!consultantId || !scheduledAt || !duration || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get consultant info
    const consultant = await db.consultant.findUnique({
      where: { id: consultantId }
    })

    if (!consultant) {
      return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
    }

    // Calculate price
    const priceCents = Math.ceil((consultant.hourlyRate * duration) / 60)

    // Create booking
    const booking = await db.consultationBooking.create({
      data: {
        consultantId,
        customerId: decoded.customerId,
        scheduledAt: new Date(scheduledAt),
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
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { bookingId, status } = await request.json()

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify booking belongs to user
    const existingBooking = await db.consultationBooking.findFirst({
      where: { id: bookingId, customerId: decoded.customerId }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Update booking status
    const booking = await db.consultationBooking.update({
      where: { id: bookingId },
      data: { status },
      include: { consultant: true }
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Error updating consultation:', error)
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 })
  }
}
