import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'

// GET /api/wellness/toys - Get user's connected toys
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const customerId = auth.customerId
    const body = await request.json()
    const { toyModelId, nickname, deviceId, shareWithPartner } = body

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
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

    const owned = await db.customerSmartToy.findFirst({
      where: { id: toyId, customerId: auth.customerId },
      select: { id: true },
    })
    if (!owned) {
      return NextResponse.json({ error: 'Toy not found' }, { status: 404 })
    }

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
    const auth = await requireCustomer()
    if (!auth.ok) return auth.response
    const { searchParams } = new URL(request.url)
    const toyId = searchParams.get('toyId')

    if (!toyId) {
      return NextResponse.json(
        { error: 'toyId is required' },
        { status: 400 }
      )
    }

    const disconnected = await db.customerSmartToy.updateMany({
      where: { id: toyId, customerId: auth.customerId },
      data: { isActive: false },
    })
    if (disconnected.count !== 1) {
      return NextResponse.json({ error: 'Toy not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting toy:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect toy' },
      { status: 500 }
    )
  }
}
