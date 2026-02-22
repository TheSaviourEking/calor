import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hosts/me - Get current user's host profile
export async function GET() {
  try {
    // For demo purposes, return the first host profile found
    // In production, this would use the actual logged-in user's session
    const host = await db.streamHost.findFirst({
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!host) {
      return NextResponse.json({ host: null })
    }

    return NextResponse.json({ host })
  } catch (error) {
    console.error('Error fetching host profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch host profile' },
      { status: 500 }
    )
  }
}
