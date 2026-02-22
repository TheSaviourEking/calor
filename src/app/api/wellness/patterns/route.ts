import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/patterns - Get vibration patterns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const category = searchParams.get('category')
    const publicOnly = searchParams.get('public') === 'true'

    const where: Record<string, unknown> = {}

    if (publicOnly) {
      where.isPublic = true
    } else if (customerId) {
      // Get user's patterns + public patterns
      where.OR = [
        { creatorId: customerId },
        { isPublic: true },
      ]
    }

    if (category) {
      where.category = category
    }

    const patterns = await db.vibrationPattern.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { useCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Get featured patterns
    const featured = patterns.filter(p => p.isFeatured)

    // Get categories
    const categories = [...new Set(patterns.map(p => p.category))]

    return NextResponse.json({
      patterns,
      featured,
      categories,
      count: patterns.length,
    })
  } catch (error) {
    console.error('Error fetching patterns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/patterns - Create a new pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      creatorId,
      name,
      description,
      patternData,
      duration,
      category,
      intensity,
      isPublic,
    } = body

    if (!name || !patternData || !duration) {
      return NextResponse.json(
        { error: 'name, patternData, and duration are required' },
        { status: 400 }
      )
    }

    // Validate pattern data structure
    let parsedPattern
    try {
      parsedPattern = typeof patternData === 'string'
        ? JSON.parse(patternData)
        : patternData

      if (!Array.isArray(parsedPattern)) {
        throw new Error('Pattern must be an array')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid pattern data format' },
        { status: 400 }
      )
    }

    const pattern = await db.vibrationPattern.create({
      data: {
        creatorId: creatorId || null,
        name,
        description: description || '',
        patternData: typeof patternData === 'string' ? patternData : JSON.stringify(patternData),
        duration,
        category: category || 'custom',
        intensity: intensity || 'medium',
        isPublic: isPublic || false,
      },
    })

    return NextResponse.json({ pattern }, { status: 201 })
  } catch (error) {
    console.error('Error creating pattern:', error)
    return NextResponse.json(
      { error: 'Failed to create pattern' },
      { status: 500 }
    )
  }
}

// PUT /api/wellness/patterns - Update pattern (like, feature, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { patternId, action } = body

    if (!patternId || !action) {
      return NextResponse.json(
        { error: 'patternId and action are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    switch (action) {
      case 'like':
        updateData.likeCount = { increment: 1 }
        break
      case 'use':
        updateData.useCount = { increment: 1 }
        break
      case 'feature':
        updateData.isFeatured = true
        break
      case 'unfeature':
        updateData.isFeatured = false
        break
      case 'publish':
        updateData.isPublic = true
        break
      case 'unpublish':
        updateData.isPublic = false
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const pattern = await db.vibrationPattern.update({
      where: { id: patternId },
      data: updateData,
    })

    return NextResponse.json({ pattern })
  } catch (error) {
    console.error('Error updating pattern:', error)
    return NextResponse.json(
      { error: 'Failed to update pattern' },
      { status: 500 }
    )
  }
}

// DELETE /api/wellness/patterns - Delete a pattern
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patternId = searchParams.get('patternId')
    const customerId = searchParams.get('customerId')

    if (!patternId) {
      return NextResponse.json(
        { error: 'patternId is required' },
        { status: 400 }
      )
    }

    // Verify ownership if customerId provided
    if (customerId) {
      const pattern = await db.vibrationPattern.findUnique({
        where: { id: patternId },
      })

      if (pattern?.creatorId !== customerId) {
        return NextResponse.json(
          { error: 'Not authorized to delete this pattern' },
          { status: 403 }
        )
      }
    }

    await db.vibrationPattern.delete({
      where: { id: patternId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pattern:', error)
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    )
  }
}
