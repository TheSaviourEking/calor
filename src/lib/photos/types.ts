export type PhotoTreatment = 'original' | 'blend' | 'composite'
export type ReviewStatus = 'approved' | 'pending' | 'rejected'

export const BACKDROPS = ['satin', 'linen', 'blush'] as const
export type Backdrop = (typeof BACKDROPS)[number]

export function isBackdrop(v: unknown): v is Backdrop {
  return typeof v === 'string' && (BACKDROPS as readonly string[]).includes(v)
}
