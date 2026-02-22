import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import SubscriptionsClient from './SubscriptionsClient'

export const metadata: Metadata = {
  title: 'Subscription Boxes | CALŌR',
  description: 'Discover our curated subscription boxes. Premium wellness products delivered discreetly to your door every month.'
}

export default function SubscriptionsPage() {
  return (
    <ClientWrapper>
      <SubscriptionsClient />
    </ClientWrapper>
  )
}
