import { Metadata } from 'next'
import AdminChangelogClient from './AdminChangelogClient'

export const metadata: Metadata = {
  title: 'Development Changelog | CALŌR Admin',
  description: 'Full technical changelog for CALŌR platform development.',
}

export default function AdminChangelogPage() {
  return <AdminChangelogClient />
}
