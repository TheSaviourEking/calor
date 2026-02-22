import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import ReferralsClient from './ReferralsClient'

export default async function ReferralsPage() {
  const session = await getSession()
  
  if (!session?.customerId) {
    redirect('/account')
  }

  return <ReferralsClient />
}
