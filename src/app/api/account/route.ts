import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireCustomer } from '@/lib/auth/guards'
import { destroySession, verifyPassword } from '@/lib/auth/session'
import { AccountDeletionBlocked, deleteAccount } from '@/lib/account/delete-account'

// Whether deleting this account asks for a password (email accounts do).
export async function GET() {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  const customer = await db.customer.findUnique({
    where: { id: auth.customerId },
    select: { passwordHash: true },
  })
  return NextResponse.json({ hasPassword: !!customer?.passwordHash })
}

// Delete the signed-in member's account. Email accounts confirm with their
// password; OAuth-only accounts (no password) are already re-authenticated
// by their session.
export async function DELETE(request: NextRequest) {
  const auth = await requireCustomer()
  if (!auth.ok) return auth.response

  let body: { password?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const customer = await db.customer.findUnique({
    where: { id: auth.customerId },
    select: { id: true, passwordHash: true },
  })
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (customer.passwordHash) {
    const password = typeof body?.password === 'string' ? body.password : ''
    const valid = password.length > 0 && (await verifyPassword(password, customer.passwordHash))
    if (!valid) return NextResponse.json({ error: 'That password is not right' }, { status: 403 })
  }

  try {
    await db.$transaction(async (tx) => deleteAccount(customer.id, tx), { timeout: 30_000 })
  } catch (error) {
    if (error instanceof AccountDeletionBlocked) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    throw error
  }

  await destroySession()
  return NextResponse.json({ deleted: true })
}
