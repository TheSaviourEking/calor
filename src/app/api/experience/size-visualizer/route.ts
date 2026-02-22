import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get size visualization for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const sizeViz = await db.sizeVisualization.findUnique({
      where: { productId },
    })

    if (!sizeViz) {
      // Generate a default visualization based on product variant info
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { 
          category: true,
          variants: true 
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Return default comparisons
      const defaultComparisons = getDefaultComparisons()
      return NextResponse.json({ 
        sizeVisualization: {
          productId: product.id,
          length: null,
          width: null,
          height: null,
          diameter: null,
          insertableLength: null,
          circumference: null,
          comparisons: JSON.stringify(defaultComparisons),
        },
        isDefault: true 
      })
    }

    return NextResponse.json({ 
      sizeVisualization: {
        ...sizeViz,
        comparisons: sizeViz.comparisons ? JSON.parse(sizeViz.comparisons) : [],
        silhouettes: sizeViz.silhouettes ? JSON.parse(sizeViz.silhouettes) : null,
      },
      isDefault: false 
    })
  } catch (error) {
    console.error('Error fetching size visualization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch size visualization' },
      { status: 500 }
    )
  }
}

// POST - Create or update size visualization
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const sizeViz = await db.sizeVisualization.upsert({
      where: { productId: data.productId },
      create: {
        productId: data.productId,
        length: data.length,
        width: data.width,
        height: data.height,
        diameter: data.diameter,
        insertableLength: data.insertableLength,
        circumference: data.circumference,
        comparisons: data.comparisons ? JSON.stringify(data.comparisons) : null,
        silhouettes: data.silhouettes ? JSON.stringify(data.silhouettes) : null,
      },
      update: {
        length: data.length,
        width: data.width,
        height: data.height,
        diameter: data.diameter,
        insertableLength: data.insertableLength,
        circumference: data.circumference,
        comparisons: data.comparisons ? JSON.stringify(data.comparisons) : null,
        silhouettes: data.silhouettes ? JSON.stringify(data.silhouettes) : null,
      }
    })

    return NextResponse.json({ sizeVisualization: sizeViz })
  } catch (error) {
    console.error('Error saving size visualization:', error)
    return NextResponse.json(
      { error: 'Failed to save size visualization' },
      { status: 500 }
    )
  }
}

// Default comparison items for size visualization
function getDefaultComparisons() {
  return [
    { 
      name: 'iPhone 15 Pro', 
      length: 14.7, 
      width: 7.1,
      category: 'phone',
      icon: 'smartphone'
    },
    { 
      name: 'Standard Lipstick', 
      length: 7.5, 
      diameter: 1.8,
      category: 'cosmetic',
      icon: 'pipette'
    },
    { 
      name: 'Credit Card', 
      length: 8.6, 
      width: 5.4,
      category: 'everyday',
      icon: 'credit-card'
    },
    { 
      name: 'Computer Mouse', 
      length: 11.5, 
      width: 6.5,
      height: 3.5,
      category: 'everyday',
      icon: 'mouse'
    },
    { 
      name: 'TV Remote', 
      length: 16.5, 
      width: 4.5,
      category: 'everyday',
      icon: 'tv'
    },
    { 
      name: 'Marker Pen', 
      length: 14.5, 
      diameter: 1.5,
      category: 'everyday',
      icon: 'pen'
    },
  ]
}
