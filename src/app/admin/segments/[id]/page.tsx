import { Suspense } from 'react'
import SegmentDetailClient from './SegmentDetailClient'

export default function SegmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="font-body text-warm-gray">Loading segment...</div>
        </div>
      </div>
    }>
      <SegmentDetailClient params={params} />
    </Suspense>
  )
}
