import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List product configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const where: Record<string, string | boolean> = { isActive: true }
    if (productId) {
      where.productId = productId
    }

    const configurations = await db.productConfiguration.findMany({
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
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ configurations })
  } catch (error) {
    console.error('Error fetching configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    )
  }
}

// POST - Create a new product configuration option
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const configuration = await db.productConfiguration.create({
      data: {
        productId: data.productId,
        configType: data.configType,
        name: data.name,
        description: data.description,
        options: JSON.stringify(data.options),
        displayType: data.displayType || 'select',
        isRequired: data.isRequired || false,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      }
    })

    return NextResponse.json({ configuration })
  } catch (error) {
    console.error('Error creating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    )
  }
}
