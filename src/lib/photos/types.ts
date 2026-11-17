export const PHOTO_TREATMENTS = ['original', 'blend', 'composite'] as const
export type PhotoTreatment = (typeof PHOTO_TREATMENTS)[number]

export function isPhotoTreatment(v: unknown): v is PhotoTreatment {
  return typeof v === 'string' && (PHOTO_TREATMENTS as readonly string[]).includes(v)
}
export type ReviewStatus = 'approved' | 'pending' | 'rejected'

export const BACKDROPS = ['satin', 'linen', 'blush'] as const
export type Backdrop = (typeof BACKDROPS)[number]

export function isBackdrop(v: unknown): v is Backdrop {
  return typeof v === 'string' && (BACKDROPS as readonly string[]).includes(v)
}
