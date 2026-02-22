import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get all active gift wrapping options (public)
export async function GET() {
  try {
    const options = await db.giftWrappingOption.findMany({ /* take: handled */
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({ options })
  } catch (error) {
    console.error('Error fetching gift wrapping options:', error)
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
  }
}
