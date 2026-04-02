import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import CampaignDetailClient from './CampaignDetailClient'

export const metadata: Metadata = {
  title: 'Campaign Details | CALŌR Admin',
  description: 'View and edit email campaign details'
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ClientWrapper>
      <CampaignDetailClient params={params} />
    </ClientWrapper>
  )
}
