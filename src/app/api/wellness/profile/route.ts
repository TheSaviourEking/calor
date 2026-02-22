import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/profile - Get wellness profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const profile = await db.wellnessProfile.findUnique({
      where: { customerId },
    })

    // Get recent entries
    const recentEntries = await db.wellnessEntry.findMany({ /* take: handled */
      where: { customerId },
      orderBy: { entryDate: 'desc' },
      take: 7,
    })

    // Calculate averages
    const avgMood = recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / recentEntries.length
      : null

    const avgEnergy = recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + (e.energy || 0), 0) / recentEntries.length
      : null

    return NextResponse.json({
      profile,
      recentEntries,
      stats: {
        avgMood,
        avgEnergy,
        entriesThisWeek: recentEntries.length,
      },
    })
  } catch (error) {
    console.error('Error fetching wellness profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wellness profile' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/profile - Create/update wellness profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      preferredTime,
      preferredIntensity,
      avgSessionDuration,
      goals,
      shareWithPartner,
    } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const profile = await db.wellnessProfile.upsert({
      where: { customerId },
      create: {
        customerId,
        preferredTime,
        preferredIntensity,
        avgSessionDuration,
        goals: goals ? JSON.stringify(goals) : null,
        shareWithPartner: shareWithPartner || false,
      },
      update: {
        preferredTime,
        preferredIntensity,
        avgSessionDuration,
        goals: goals ? JSON.stringify(goals) : undefined,
        shareWithPartner,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error updating wellness profile:', error)
    return NextResponse.json(
      { error: 'Failed to update wellness profile' },
      { status: 500 }
    )
  }
}
