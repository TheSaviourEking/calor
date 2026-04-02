import NewRegistryClient from './NewRegistryClient'
import { Suspense } from 'react'

export const metadata = {
  title: 'Create Registry | CALŌR',
  description: 'Create a new gift registry for your special occasion.',
}

export default function NewRegistryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center">Loading...</div>}>
      <NewRegistryClient />
    </Suspense>
  )
}
