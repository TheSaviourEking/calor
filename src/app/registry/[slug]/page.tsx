import { Suspense } from 'react'
import PublicRegistryClient from './PublicRegistryClient'

export const metadata = {
  title: 'Gift Registry | CALŌR',
  description: 'View and purchase gifts from this registry.',
}

export default function PublicRegistryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center font-body text-warm-gray">Loading...</div>}>
      <PublicRegistryClient />
    </Suspense>
  )
}
