import { Metadata } from 'next'
import CoupleClient from './CoupleClient'

export const metadata: Metadata = {
  title: 'Couples Account | CALŌR',
  description: 'Link accounts with your partner for shared experiences and wishlists.'
}

export default function CouplePage() {
  return <CoupleClient />
}
