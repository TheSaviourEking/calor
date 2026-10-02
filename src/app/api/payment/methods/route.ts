import { NextResponse } from 'next/server'
import { getAvailablePaymentMethods } from '@/lib/payments/methods'

export const dynamic = 'force-dynamic'

// GET /api/payment/methods - which payment methods are configured on this deployment
export async function GET() {
  return NextResponse.json({ methods: getAvailablePaymentMethods() })
}
