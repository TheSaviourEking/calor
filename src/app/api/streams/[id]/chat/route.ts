import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/streams/[id]/chat - Get chat history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const before = searchParams.get('before')

    const where: Record<string, unknown> = {
      streamId: id,
      isDeleted: false,
    }

    if (before) {
      where.createdAt = { lt: new Date(before) }
    }

    const messages = await db.streamChatMessage.findMany({ /* take: handled */
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        message: true,
        type: true,
        createdAt: true,
        isPinned: true,
        isHighlighted: true,
        reactionCounts: true,
        guestName: true,
        customer: { select: { firstName: true } },
      },
    })

    // Public chat history: display fields only, never the sender's id, last
    // name or moderation details. Reverse to get chronological order.
    return NextResponse.json({
      messages: messages.reverse().map((m) => ({
        id: m.id,
        message: m.message,
        type: m.type,
        createdAt: m.createdAt,
        isPinned: m.isPinned,
        isHighlighted: m.isHighlighted,
        reactionCounts: m.reactionCounts,
        displayName: m.customer?.firstName || m.guestName || 'Guest',
      })),
    })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}
