import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import CampaignsClient from './CampaignsClient'

export const metadata: Metadata = {
  title: 'Email Campaigns | calo. Admin',
  description: 'Manage email marketing campaigns'
}

export default function CampaignsPage() {
  return (
    <ClientWrapper>
      <CampaignsClient />
    </ClientWrapper>
  )
}
