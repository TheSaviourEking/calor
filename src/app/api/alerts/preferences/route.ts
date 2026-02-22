import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

// GET - Get customer's alert preferences
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await db.alertPreferences.findUnique({
      where: { customerId: session.customerId },
    })

    // Create default preferences if not exist
    if (!preferences) {
      preferences = await db.alertPreferences.create({
        data: { customerId: session.customerId },
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching alert preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PUT - Update alert preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const preferences = await db.alertPreferences.upsert({
      where: { customerId: session.customerId },
      update: {
        priceDropAlerts: data.priceDropAlerts,
        backInStockAlerts: data.backInStockAlerts,
        orderUpdates: data.orderUpdates,
        newsletter: data.newsletter,
        securityAlerts: data.securityAlerts,
        loyaltyUpdates: data.loyaltyUpdates,
      },
      create: {
        customerId: session.customerId,
        priceDropAlerts: data.priceDropAlerts ?? true,
        backInStockAlerts: data.backInStockAlerts ?? true,
        orderUpdates: data.orderUpdates ?? true,
        newsletter: data.newsletter ?? false,
        securityAlerts: data.securityAlerts ?? true,
        loyaltyUpdates: data.loyaltyUpdates ?? true,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error updating alert preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
