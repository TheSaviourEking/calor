import { Metadata } from 'next'
import FeaturesClient from './FeaturesClient'

export const metadata: Metadata = {
  title: 'Features | CALŌR',
  description: 'Discover all the features that make CALŌR the ultimate wellness shopping destination. From AI recommendations to live shopping, wellness tracking, and more.',
}

export default function FeaturesPage() {
  return <FeaturesClient />
}
