import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import NewCampaignClient from './NewCampaignClient'

export const metadata: Metadata = {
  title: 'Create Campaign | calo. Admin',
  description: 'Create a new email marketing campaign'
}

export default function NewCampaignPage() {
  return (
    <ClientWrapper>
      <NewCampaignClient />
    </ClientWrapper>
  )
}
