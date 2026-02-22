import { Metadata } from 'next'
import RewardsClient from './RewardsClient'

export const metadata: Metadata = {
  title: 'Rewards Store | CALŌR',
  description: 'Redeem your loyalty points for exclusive rewards',
}

export default function RewardsPage() {
  return <RewardsClient />
}
