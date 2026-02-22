import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import RegistryDashboard from './RegistryDashboard'

export const metadata = {
  title: 'Gift Registry | CALŌR',
  description: 'Create and manage your gift registries for special occasions.',
}

export default async function RegistryPage() {
  const session = await getSession()
  
  // Redirect to login if not authenticated
  if (!session?.customerId) {
    redirect('/account')
  }

  return <RegistryDashboard />
}
