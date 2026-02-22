import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import ReferralsClient from './ReferralsClient'
import { db } from '@/lib/db'
import { serialise } from '@/lib/serialise'

export const metadata = {
  title: 'Referrals | CALŌR',
  description: 'Share CALŌR with friends and earn rewards',
}

export default async function ReferralsPage() {
  const session = await getSession()

  if (!session?.customerId) {
    redirect('/account?redirect=/account/referrals')
  }

  let referralCode = await db.referralCode.findFirst({
    where: { customerId: session.customerId },
    include: {
      referrals: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  // Create referral code if doesn't exist
  if (!referralCode) {
    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
    })

    // Generate code based on customer name
    const baseCode = `${customer?.firstName?.toUpperCase() || 'REF'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    referralCode = await db.referralCode.create({
      data: {
        code: baseCode,
        customerId: session.customerId,
      },
      include: {
        referrals: true,
      },
    })
  }

  return <ReferralsClient initialReferralCode={serialise(referralCode as any)} />
}
