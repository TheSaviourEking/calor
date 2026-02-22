import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const products = await db.product.findMany({ /* take: handled */
    where: {
      published: true,
      OR: [
        { name: { contains: query } },
        { shortDescription: { contains: query } },
      ],
    },
    include: {
      category: { select: { name: true } },
    },
    take: 10,
  })

  const results = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category.name,
  }))

  return NextResponse.json({ results })
}
