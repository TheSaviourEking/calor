'use client'

import { useState } from 'react'
import { Star, Check, X, Eye, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  isApproved: boolean
  isVerifiedPurchase: boolean
  guestName: string | null
  createdAt: string
  product: { name: string; slug: string }
  customer: { firstName: string; lastName: string; email: string } | null
}

interface Props {
  pendingReviews: Review[]
  approvedReviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-gold text-gold' : 'text-sand'}`}
        />
      ))}
    </span>
  )
}

export default function AdminReviewsClient({ pendingReviews: initial, approvedReviews: initialApproved }: Props) {
  const [pending, setPending] = useState(initial)
  const [approved, setApproved] = useState(initialApproved)
  const [loading, setLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')

  const handleApprove = async (reviewId: string) => {
    setLoading(reviewId)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        const rev = pending.find((r) => r.id === reviewId)
        if (rev) {
          setPending((p) => p.filter((r) => r.id !== reviewId))
          setApproved((a) => [{ ...rev, isApproved: true }, ...a])
        }
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const handleReject = async (reviewId: string) => {
    if (!confirm('Delete this review permanently?')) return
    setLoading(reviewId)
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      if (res.ok) {
        setPending((p) => p.filter((r) => r.id !== reviewId))
        setApproved((a) => a.filter((r) => r.id !== reviewId))
      }
    } catch { /* handled silently */ }
    setLoading(null)
  }

  const reviews = tab === 'pending' ? pending : approved

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
          Review Moderation
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {pending.length} pending approval · {approved.length} published
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand">
        {(['pending', 'approved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-body text-sm uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warm-gray hover:text-charcoal'
            }`}
          >
            {t === 'pending' ? `Pending (${pending.length})` : `Published (${approved.length})`}
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-warm-white border border-sand p-12 text-center">
          <Check className="w-12 h-12 text-sand mx-auto mb-3" />
          <p className="font-body text-warm-gray">
            {tab === 'pending' ? 'No reviews pending approval.' : 'No published reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-warm-white border border-sand p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarRating rating={review.rating} />
                    <span className="font-body text-charcoal text-sm font-medium">{review.title}</span>
                    {review.isVerifiedPurchase && (
                      <span className="px-2 py-0.5 text-[0.6rem] font-body uppercase tracking-widest bg-green-100 text-green-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="font-body text-warm-gray text-sm leading-relaxed mb-3 line-clamp-3">
                    {review.content}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-body text-xs text-warm-gray">
                      by{' '}
                      <strong className="text-charcoal">
                        {review.customer
                          ? `${review.customer.firstName} ${review.customer.lastName}`
                          : review.guestName || 'Guest'}
                      </strong>
                      {review.customer && ` · ${review.customer.email}`}
                    </span>
                    <Link
                      href={`/product/${review.product.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-body text-xs text-terracotta hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      {review.product.name}
                    </Link>
                    <span className="font-body text-xs text-warm-gray">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={loading === review.id}
                      className="w-9 h-9 flex items-center justify-center bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {loading === review.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleReject(review.id)}
                    disabled={loading === review.id}
                    className="w-9 h-9 flex items-center justify-center bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {loading === review.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
