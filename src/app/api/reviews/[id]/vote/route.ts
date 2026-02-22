import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params
    const body = await request.json()
    const { isHelpful } = body

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'isHelpful must be a boolean' },
        { status: 400 }
      )
    }

    const session = await getSession()
    
    // Get or create session ID for guest voters
    let sessionId = request.headers.get('x-session-id')
    if (!session && !sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`
    }

    // Check if already voted
    const existingVote = await db.reviewVote.findFirst({
      where: {
        reviewId,
        OR: [
          { customerId: session?.customerId },
          { sessionId: sessionId },
        ].filter(Boolean) as Array<{ customerId: string } | { sessionId: string }>,
      },
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this review' },
        { status: 400 }
      )
    }

    // Create vote and update counts
    const [vote] = await db.$transaction([
      db.reviewVote.create({
        data: {
          reviewId,
          customerId: session?.customerId || null,
          sessionId: session ? null : sessionId,
          isHelpful,
        },
      }),
      db.review.update({
        where: { id: reviewId },
        data: isHelpful
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      }),
    ])

    const updatedReview = await db.review.findUnique({
      where: { id: reviewId },
      select: { helpfulCount: true, notHelpfulCount: true },
    })

    return NextResponse.json({
      success: true,
      vote,
      counts: updatedReview,
      sessionId: session ? null : sessionId,
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}
