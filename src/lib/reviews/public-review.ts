import { DELETED_MEMBER_NAME, publicDisplayName } from '@/lib/discretion'

type ReviewRow = {
  id: string
  productId: string
  rating: number
  title: string
  content: string
  photos?: string | null
  isVerifiedPurchase: boolean
  isApproved?: boolean
  helpfulCount: number
  notHelpfulCount: number
  adminResponse?: string | null
  adminResponseAt?: Date | string | null
  createdAt: Date | string
  guestName?: string | null
  customer?: { nickname?: string | null; firstName?: string | null; lastName?: string | null } | null
}

/** Select for the customer relation on any review that reaches a public surface. */
export const REVIEW_AUTHOR_SELECT = { nickname: true, firstName: true, lastName: true } as const

/** Member: nickname or "First L."; guest: first word of the name they typed; never an email. */
export function reviewAuthorName(r: Pick<ReviewRow, 'customer' | 'guestName'>): string {
  if (r.customer) return publicDisplayName(r.customer, 'Anonymous')
  // Placeholder written by account deletion: show it whole, not its first word
  if (r.guestName?.trim() === DELETED_MEMBER_NAME) return DELETED_MEMBER_NAME
  const first = r.guestName?.trim().split(/\s+/)[0]
  return first && !first.includes('@') ? first : 'Anonymous'
}

/** Explicit allow-list: no customer object, no guestEmail, no customerId. */
export function toPublicReview(r: ReviewRow) {
  return {
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    title: r.title,
    content: r.content,
    photos: r.photos ?? null,
    isVerifiedPurchase: r.isVerifiedPurchase,
    isApproved: r.isApproved,
    helpfulCount: r.helpfulCount,
    notHelpfulCount: r.notHelpfulCount,
    adminResponse: r.adminResponse ?? null,
    adminResponseAt: r.adminResponseAt ?? null,
    createdAt: r.createdAt,
    authorName: reviewAuthorName(r),
  }
}
