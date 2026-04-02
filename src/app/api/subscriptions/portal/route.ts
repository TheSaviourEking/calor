import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createCustomerPortalSession } from '@/lib/payments/stripe-subscriptions'

export async function POST() {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portalUrl = await createCustomerPortalSession(session.customerId)
    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
