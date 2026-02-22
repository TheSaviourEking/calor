import SearchClient from './SearchClient'
import { Suspense } from 'react'

export default async function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="font-body text-warm-gray">Loading search...</div>
        </div>
      </div>
    }>
      <SearchClient />
    </Suspense>
  )
}
