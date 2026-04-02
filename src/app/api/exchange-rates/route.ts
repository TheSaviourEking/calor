import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/exchange-rates'

export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
  try {
    const rates = await getExchangeRates()
    return NextResponse.json({ rates, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Exchange rates error:', error)
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
  }
}
