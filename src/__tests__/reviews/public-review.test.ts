import { describe, it, expect } from 'vitest'
import { reviewAuthorName } from '@/lib/reviews/public-review'

describe('reviewAuthorName', () => {
  it("a deleted member's review reads 'Deleted member', not 'Deleted'", () => {
    expect(reviewAuthorName({ customer: null, guestName: 'Deleted member' })).toBe('Deleted member')
  })

  it('guests still show only the first word of their name', () => {
    expect(reviewAuthorName({ customer: null, guestName: 'Sam Smith' })).toBe('Sam')
  })

  it('members show their public display name', () => {
    expect(reviewAuthorName({ customer: { nickname: null, firstName: 'Ada', lastName: 'Lovelace' }, guestName: null })).toBe('Ada L.')
  })
})
