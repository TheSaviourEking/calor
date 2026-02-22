import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/stream-reminders - Create a reminder for a stream
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamId, customerId, notifyEmail, notifyPush, minutesBefore } = body

    if (!streamId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields: streamId, customerId' },
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
