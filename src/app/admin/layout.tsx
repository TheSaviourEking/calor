import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: { isAdmin: true }
  })

  if (!customer?.isAdmin) {
    redirect('/')
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
