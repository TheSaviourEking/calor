import { db } from '@/lib/db'
import ClientWrapper from '@/components/layout/ClientWrapper'
import GiftCardsClient from './GiftCardsClient'

export default function GiftCardsPage() {
  return (
    <ClientWrapper>
      <GiftCardsClient />
    </ClientWrapper>
  )
}
