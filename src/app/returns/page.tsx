import { Metadata } from 'next'
import ClientWrapper from '@/components/layout/ClientWrapper'
import ReturnsClient from './ReturnsClient'

export const metadata: Metadata = {
  title: 'Returns & Satisfaction Guarantee | CALŌR',
  description: 'Request a return or exchange. Our satisfaction guarantee ensures you love every purchase.'
}

export default function ReturnsPage() {
  return (
    <ClientWrapper>
      <ReturnsClient />
    </ClientWrapper>
  )
}
