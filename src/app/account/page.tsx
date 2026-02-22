import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const session = await getSession()

  if (session) {
    redirect('/account/orders')
  }

  return <AccountClient />
}
