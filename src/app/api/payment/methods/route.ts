import { NextRequest, NextResponse } from 'next/server'
import { getAvailablePaymentMethods, getBankDetails } from '@/lib/payments/methods'
import { shipFromName } from '@/lib/discretion'

export const dynamic = 'force-dynamic'

// GET /api/payment/methods - which payment methods are configured on this deployment,
// plus the server-only facts the checkout privacy receipt needs.
// ?country= picks the same bank account the bank-transfer route will issue.
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country')?.trim() || 'DEFAULT'
  return NextResponse.json({
    methods: getAvailablePaymentMethods(),
    receipt: {
      shipFromName: shipFromName(),
      bankAccountName: getBankDetails(country)?.accountName ?? null,
    },
  })
}
