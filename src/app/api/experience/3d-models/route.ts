import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get 3D model for a product
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

    const model = await db.product3DModel.findUnique({
      where: { productId },
      include: {
        hotspots: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!model) {
      return NextResponse.json({
        model: null,
        message: 'No 3D model available for this product'
      })
    }

    return NextResponse.json({
      model: {
        ...model,
        animations: model.animations ? JSON.parse(model.animations) : [],
        hotspots: model.hotspots.map(h => ({
          ...h,
          position: { x: h.positionX, y: h.positionY, z: h.positionZ }
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch 3D model' },
      { status: 500 }
    )
  }
}

// POST - Create or update 3D model
export async function POST(request: NextRequest) {
  try {
    const reqData = await request.json()

    const model = await db.product3DModel.upsert({
      where: { productId: reqData.productId },
      create: {
        productId: reqData.productId,
        modelUrl: reqData.modelUrl,
        modelType: reqData.modelType || 'glb',
        thumbnailUrl: reqData.thumbnailUrl,
        animations: reqData.animations ? JSON.stringify(reqData.animations) : null,
        arSupported: reqData.arSupported || false,
        arScale: reqData.arScale,
        isProcessing: reqData.isProcessing || false,
        isReady: reqData.isReady !== false,
      },
      update: {
        modelUrl: reqData.modelUrl,
        modelType: reqData.modelType || 'glb',
        thumbnailUrl: reqData.thumbnailUrl,
        animations: reqData.animations ? JSON.stringify(reqData.animations) : null,
        arSupported: reqData.arSupported || false,
        arScale: reqData.arScale,
        isProcessing: reqData.isProcessing || false,
        isReady: reqData.isReady !== false,
      }
    })

    // Create hotspots if provided
    if (reqData.hotspots && Array.isArray(reqData.hotspots)) {
      // Delete existing hotspots
      await db.productHotspot.deleteMany({
        where: { modelId: model.id }
      })

      // Create new hotspots
      await db.productHotspot.createMany({
        data: reqData.hotspots.map((h: Record<string, unknown>, index: number) => ({
          modelId: model.id,
          positionX: (h.position as Record<string, number>)?.x || 0,
          positionY: (h.position as Record<string, number>)?.y || 0,
          positionZ: (h.position as Record<string, number>)?.z || null,
          label: h.label as string,
          description: h.description as string,
          iconType: h.iconType as string,
          imageUrl: h.imageUrl as string,
          videoUrl: h.videoUrl as string,
          animationName: h.animationName as string,
          sortOrder: index,
          isActive: true,
        }))
      })
    }

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Error saving 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to save 3D model' },
      { status: 500 }
    )
  }
}
