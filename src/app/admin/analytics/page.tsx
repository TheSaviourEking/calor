import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | CALŌR Admin',
  description: 'Business analytics and performance metrics'
}

export default function AnalyticsPage() {
  return (
    <ClientWrapper>
      <AnalyticsClient />
    </ClientWrapper>
  )
}
