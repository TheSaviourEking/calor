import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'
import { validateNickname } from '@/lib/discretion'

const TAKEN = 'That nickname is taken'

export async function GET() {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  const customer = await db.customer.findUnique({
    where: { id: auth.customerId },
    select: { nickname: true },
  })
  return NextResponse.json({ nickname: customer?.nickname ?? null })
}

export async function PUT(request: NextRequest) {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  let body: { nickname?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const result = validateNickname(body?.nickname)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  const existing = await db.customer.findFirst({
    where: { nickname: { equals: result.value, mode: 'insensitive' } },
    select: { id: true },
  })
  if (existing && existing.id !== auth.customerId) {
    return NextResponse.json({ error: TAKEN }, { status: 409 })
  }

  try {
    const updated = await db.customer.update({
      where: { id: auth.customerId },
      data: { nickname: result.value },
      select: { nickname: true },
    })
    return NextResponse.json({ nickname: updated.nickname })
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: TAKEN }, { status: 409 })
    }
    throw error
  }
}
