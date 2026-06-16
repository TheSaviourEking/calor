import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { serialise } from '@/lib/serialise'
import AdminAuditLogsClient from './AdminAuditLogsClient'

export const dynamic = 'force-dynamic'

export default async function AdminAuditLogsPage() {
  const session = await getSession()
  if (!session) redirect('/account')

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return <AdminAuditLogsClient initialLogs={serialise(logs) as any} />
}
