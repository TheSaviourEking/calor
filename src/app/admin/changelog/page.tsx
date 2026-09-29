import { Metadata } from 'next'
import AdminChangelogClient from './AdminChangelogClient'

export const metadata: Metadata = {
  title: 'Development Changelog | calo. Admin',
  description: 'Full technical changelog for calo. platform development.',
}

export default function AdminChangelogPage() {
  return <AdminChangelogClient />
}
