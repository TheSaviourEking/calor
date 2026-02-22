'use client'

import { useSearchParams } from 'next/navigation'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { SearchPage } from '@/components/search'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  return (
    <ClientWrapper>
      <SearchPage initialQuery={initialQuery} />
    </ClientWrapper>
  )
}
