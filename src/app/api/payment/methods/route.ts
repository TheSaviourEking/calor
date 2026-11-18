import { NextResponse } from 'next/server'
import { getAvailablePaymentMethods, getBankDetails } from '@/lib/payments/methods'
import { shipFromName } from '@/lib/discretion'

export const dynamic = 'force-dynamic'

// GET /api/payment/methods - which payment methods are configured on this deployment,
// plus the server-only facts the checkout privacy receipt needs.
export async function GET() {
  return NextResponse.json({
    methods: getAvailablePaymentMethods(),
    receipt: {
      shipFromName: shipFromName(),
      bankAccountName: getBankDetails('DEFAULT')?.accountName ?? null,
    },
  })
}
