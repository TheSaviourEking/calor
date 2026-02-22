'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, ThumbsDown, Check, ChevronDown, ChevronUp, PenLine } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  photos: string | null
  isVerifiedPurchase: boolean
  helpfulCount: number
  notHelpfulCount: number
  createdAt: string
  customer: {
    firstName: string
    lastName: string
  } | null
  guestName: string | null
}

interface ReviewSummary {
  averageRating: number
  totalReviews: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface ReviewsSectionProps {
  productId: string
  productName: string
  initialReviews?: Review[]
  initialReviewSummary?: ReviewSummary | null
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${star <= rating ? 'fill-terracotta text-terracotta' : 'text-sand'
            }`}

        />
      ))}
    </div>
  )
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-charcoal text-sm w-3">{stars}</span>
      <Star className="w-3 h-3 fill-terracotta text-terracotta" />
      <div className="flex-1 h-2 bg-sand/50 overflow-hidden">
        <div
          className="h-full bg-terracotta transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-body text-warm-gray text-xs w-8">{count}</span>
    </div>
  )
}

export default function ReviewsSection({
  productId,
  productName,
  initialReviews = [],
  initialReviewSummary = null
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [summary, setSummary] = useState<ReviewSummary | null>(initialReviewSummary)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [voting, setVoting] = useState<string | null>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Removed automatic fetchReviews on mount since we have initial props

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title,
          content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess(true)
      setRating(0)
      setTitle('')
      setContent('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (voting) return
    setVoting(reviewId)

    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful }),
      })

      const data = await response.json()

      if (response.ok) {
        setReviews(reviews.map(r =>
          r.id === reviewId
            ? { ...r, helpfulCount: data.counts.helpfulCount, notHelpfulCount: data.counts.notHelpfulCount }
            : r
        ))
      }
    } catch {
      console.error('Failed to vote')
    } finally {
      setVoting(null)
    }
  }

  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-sand/50 w-48" />
          <div className="h-32 bg-sand/50" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 border-t border-sand">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-charcoal text-xl" style={{ fontWeight: 400 }}>
          Customer Reviews
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-terracotta text-warm-white px-4 py-2 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors"
        >
          <PenLine className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
          Thank you! Your review has been submitted and will be visible after moderation.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-warm-white border border-sand">
          <h3 className="font-display text-charcoal text-lg mb-4" style={{ fontWeight: 400 }}>
            Write a Review for {productName}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block font-body text-charcoal text-sm mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'fill-terracotta text-terracotta' : 'text-sand'
                      }`}

                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block font-body text-charcoal text-sm mb-2">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta"
              required
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block font-body text-charcoal text-sm mb-2">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              rows={4}
              className="w-full px-4 py-3 border border-sand bg-cream font-body text-sm focus:outline-none focus:border-terracotta resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-terracotta text-warm-white px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-terracotta-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-sand text-charcoal px-6 py-3 font-body text-sm uppercase tracking-wider hover:bg-sand/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Summary Stats */}
      {summary && summary.totalReviews > 0 && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display text-charcoal text-4xl" style={{ fontWeight: 300 }}>
                {summary.averageRating.toFixed(1)}
              </span>
              <div>
                <StarRating rating={Math.round(summary.averageRating)} size="lg" />
                <p className="font-body text-warm-gray text-sm mt-1">
                  Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                stars={star}
                count={summary.distribution[star as keyof typeof summary.distribution]}
                total={summary.totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-body text-warm-gray text-sm">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id)
            const shouldTruncate = review.content.length > 300

            return (
              <div key={review.id} className="pb-6 border-b border-sand last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <StarRating rating={review.rating} />
                    <h4 className="font-body text-charcoal font-medium mt-1">{review.title}</h4>
                  </div>
                  <span className="font-body text-warm-gray text-xs">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body text-charcoal text-sm">
                    {review.customer
                      ? `${review.customer.firstName} ${review.customer.lastName.charAt(0)}.`
                      : review.guestName || 'Anonymous'}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-green-700 text-xs font-body">
                      <Check className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                <p className="font-body text-warm-gray text-sm leading-relaxed">
                  {shouldTruncate && !isExpanded
                    ? `${review.content.substring(0, 300)}...`
                    : review.content}
                </p>

                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpanded(review.id)}
                    className="flex items-center gap-1 font-body text-terracotta text-sm mt-2 hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {/* Helpfulness Voting */}
                <div className="flex items-center gap-4 mt-4">
                  <span className="font-body text-warm-gray text-xs">Was this helpful?</span>
                  <button
                    onClick={() => handleVote(review.id, true)}
                    disabled={voting === review.id}
                    className="flex items-center gap-1 font-body text-warm-gray text-xs hover:text-terracotta transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {review.helpfulCount}
                  </button>
                  <button
                    onClick={() => handleVote(review.id, false)}
                    disabled={voting === review.id}
                    className="flex items-center gap-1 font-body text-warm-gray text-xs hover:text-terracotta transition-colors disabled:opacity-50"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {review.notHelpfulCount}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
