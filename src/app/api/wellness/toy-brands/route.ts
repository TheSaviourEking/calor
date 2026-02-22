import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/toy-brands - List all smart toy brands
export async function GET(request: NextRequest) {
  try {
    const brands = await db.smartToyBrand.findMany({ take: 50,
      include: {
        _count: {
          select: { toyModels: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      brands,
      count: brands.length,
    })
  } catch (error) {
    console.error('Error fetching toy brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch toy brands' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/toy-brands - Create a new toy brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      logoUrl,
      apiEndpoint,
      supportsRemote,
      supportsSync,
      supportsPatterns,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      )
    }

    const brand = await db.smartToyBrand.create({
      data: {
        name,
        slug,
        logoUrl,
        apiEndpoint,
        supportsRemote: supportsRemote || false,
        supportsSync: supportsSync || false,
        supportsPatterns: supportsPatterns || false,
      },
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error) {
    console.error('Error creating toy brand:', error)
    return NextResponse.json(
      { error: 'Failed to create toy brand' },
      { status: 500 }
    )
  }
}
