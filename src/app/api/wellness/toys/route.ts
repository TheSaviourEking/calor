import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wellness/toys - Get user's connected toys
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

    const toys = await db.customerSmartToy.findMany({
      where: {
        customerId,
        isActive: true,
      },
      include: {
        toyModel: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: { lastConnected: 'desc' },
    })

    // Get available toy brands and models for connection
    const brands = await db.smartToyBrand.findMany({
      where: { isConnected: true },
      include: {
        toyModels: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      toys,
      brands,
      connectedCount: toys.length,
    })
  } catch (error) {
    console.error('Error fetching toys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch toys' },
      { status: 500 }
    )
  }
}

// POST /api/wellness/toys - Connect a new toy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, toyModelId, nickname, deviceId, shareWithPartner } = body

    if (!customerId || !toyModelId) {
      return NextResponse.json(
        { error: 'customerId and toyModelId are required' },
        { status: 400 }
      )
    }

    // Check if toy model exists
    const toyModel = await db.smartToyModel.findUnique({
      where: { id: toyModelId },
      include: { brand: true },
    })

    if (!toyModel) {
      return NextResponse.json(
        { error: 'Toy model not found' },
        { status: 404 }
      )
    }

    // Check if already connected
    if (deviceId) {
      const existing = await db.customerSmartToy.findFirst({
        where: { customerId, deviceId },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Toy already connected', toy: existing },
          { status: 400 }
        )
      }
    }

    const toy = await db.customerSmartToy.create({
      data: {
        customerId,
        toyModelId,
        nickname: nickname || toyModel.name,
        deviceId,
        shareWithPartner: shareWithPartner || false,
        lastConnected: new Date(),
      },
      include: {
        toyModel: {
          include: { brand: true },
        },
      },
    })

    return NextResponse.json({ toy }, { status: 201 })
  } catch (error) {
    console.error('Error connecting toy:', error)
    return NextResponse.json(
      { error: 'Failed to connect toy' },
      { status: 500 }
    )
  }
}

// PUT /api/wellness/toys - Update toy settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { toyId, nickname, defaultIntensity, shareWithPartner, isActive } = body

    if (!toyId) {
      return NextResponse.json(
        { error: 'toyId is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (defaultIntensity !== undefined) updateData.defaultIntensity = defaultIntensity
    if (shareWithPartner !== undefined) updateData.shareWithPartner = shareWithPartner
    if (isActive !== undefined) updateData.isActive = isActive

    const toy = await db.customerSmartToy.update({
      where: { id: toyId },
      data: updateData,
      include: {
        toyModel: {
          include: { brand: true },
        },
      },
    })

    return NextResponse.json({ toy })
  } catch (error) {
    console.error('Error updating toy:', error)
    return NextResponse.json(
      { error: 'Failed to update toy' },
      { status: 500 }
    )
  }
}

// DELETE /api/wellness/toys - Disconnect a toy
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const toyId = searchParams.get('toyId')

    if (!toyId) {
      return NextResponse.json(
        { error: 'toyId is required' },
        { status: 400 }
      )
    }

    await db.customerSmartToy.update({
      where: { id: toyId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting toy:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect toy' },
      { status: 500 }
    )
  }
}
