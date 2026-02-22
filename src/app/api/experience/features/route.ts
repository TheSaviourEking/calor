import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List product features
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const category = searchParams.get('category')

    const where: Record<string, string | boolean> = { isActive: true }
    if (productId) where.productId = productId
    if (category) where.category = category

    const features = await db.productFeature.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: [
        { isKeyFeature: 'desc' },
        { sortOrder: 'asc' }
      ]
    })

    return NextResponse.json({
      features: features.map(f => ({
        ...f,
        benefits: f.benefits ? JSON.parse(f.benefits) : []
      }))
    })
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    )
  }
}

// POST - Create a new product feature
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const feature = await db.productFeature.create({
      data: {
        productId: data.productId,
        name: data.name,
        description: data.description,
        category: data.category,
        iconType: data.iconType,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        benefits: data.benefits ? JSON.stringify(data.benefits) : null,
        isKeyFeature: data.isKeyFeature || false,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      }
    })

    return NextResponse.json({ feature })
  } catch (error) {
    console.error('Error creating feature:', error)
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    )
  }
}
