import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get all packaging photos (public)
export async function GET() {
  try {
    const photos = await db.packagingPhoto.findMany({ take: 50,
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        isDefault: true,
      },
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error('Error fetching packaging photos:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}
