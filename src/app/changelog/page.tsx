import { Metadata } from 'next'
import ChangelogClient from './ChangelogClient'

export const metadata: Metadata = {
  title: 'Changelog | CALŌR',
  description: 'Track our progress and see what\'s new at CALŌR. We\'re constantly improving your wellness shopping experience.',
}

export default function ChangelogPage() {
  return <ChangelogClient />
}
