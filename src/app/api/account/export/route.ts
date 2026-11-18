import { NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/auth/guards'
import { exportAccount } from '@/lib/account/export-account'

// Download everything we hold about the signed-in member as JSON.
export async function GET() {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  const data = await exportAccount(auth.customerId)
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="calo-data-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
