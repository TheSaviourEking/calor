import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ConsultationsClient from './ConsultationsClient'

export const metadata: Metadata = {
  title: 'Virtual Consultations | CALŌR',
  description: 'Book a private consultation with our certified wellness experts. Get personalized recommendations and guidance in a discreet, professional setting.'
}

export default function ConsultationsPage() {
  return (
    <ClientWrapper>
      <ConsultationsClient />
    </ClientWrapper>
  )
}
