import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import ManageRegistryClient from './ManageRegistryClient'

export const metadata = {
  title: 'Manage Registry | CALŌR',
  description: 'Manage your gift registry.',
}

export default async function ManageRegistryPage() {
  const session = await getSession()
  
  if (!session?.customerId) {
    redirect('/account')
  }

  return <ManageRegistryClient />
}
