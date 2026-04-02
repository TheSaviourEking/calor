import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET /api/stream-reminders - Get reminders for the authenticated user
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminders = await db.streamReminder.findMany({
      where: { customerId: session.customerId },
      include: { stream: { select: { id: true, title: true, scheduledStart: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

// DELETE /api/stream-reminders?id=xxx - Delete a reminder
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('id')
    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID required' }, { status: 400 })
    }

    const reminder = await db.streamReminder.findUnique({ where: { id: reminderId } })
    if (!reminder || reminder.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.streamReminder.delete({ where: { id: reminderId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}

// POST /api/stream-reminders - Create a reminder for a stream
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { streamId, notifyEmail, notifyPush, minutesBefore } = body
    const customerId = session.customerId

    if (!streamId) {
      return NextResponse.json(
        { error: 'Missing required field: streamId' },
        { status: 400 }
      )
    }

    // Check if reminder already exists
    const existing = await db.streamReminder.findUnique({
      where: {
        streamId_customerId: { streamId, customerId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Reminder already exists' },
        { status: 400 }
      )
    }

    const reminder = await db.streamReminder.create({
      data: {
        streamId,
        customerId,
        notifyEmail: notifyEmail ?? true,
        notifyPush: notifyPush ?? false,
        minutesBefore: minutesBefore || 15,
      },
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}
