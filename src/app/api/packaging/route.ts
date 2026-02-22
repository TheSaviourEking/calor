import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get packaging preferences
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preference = await db.packagingPreference.findUnique({
      where: { customerId: session.customerId }
    })

    // Get available packaging options
    const options = await db.packagingOption.findMany({ /* take: handled */
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ preference, options })
  } catch (error) {
    console.error('Error fetching packaging preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// Update packaging preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      senderName,
      senderNameEnabled,
      plainPackaging,
      discreteLabel,
      requireSignature,
      deliveryInstructions,
      includeGiftNote,
      defaultGiftMessage,
      preferredDeliveryDays,
      avoidWeekends
    } = body

    // Upsert preferences
    const preference = await db.packagingPreference.upsert({
      where: { customerId: session.customerId },
      create: {
        customerId: session.customerId,
        senderName,
        senderNameEnabled: senderNameEnabled || false,
        plainPackaging: plainPackaging ?? true,
        discreteLabel: discreteLabel ?? true,
        requireSignature: requireSignature || false,
        deliveryInstructions,
        includeGiftNote: includeGiftNote || false,
        defaultGiftMessage,
        preferredDeliveryDays: preferredDeliveryDays ? JSON.stringify(preferredDeliveryDays) : null,
        avoidWeekends: avoidWeekends || false
      },
      update: {
        senderName,
        senderNameEnabled: senderNameEnabled || false,
        plainPackaging: plainPackaging ?? true,
        discreteLabel: discreteLabel ?? true,
        requireSignature: requireSignature || false,
        deliveryInstructions,
        includeGiftNote: includeGiftNote || false,
        defaultGiftMessage,
        preferredDeliveryDays: preferredDeliveryDays ? JSON.stringify(preferredDeliveryDays) : null,
        avoidWeekends: avoidWeekends || false
      }
    })

    return NextResponse.json({
      success: true,
      preference,
      message: 'Packaging preferences saved'
    })
  } catch (error) {
    console.error('Error updating packaging preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
