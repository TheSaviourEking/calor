import type { Prisma } from '@prisma/client'

/**
 * The only ProductImage columns a storefront or public API may load.
 * originalUrl, compositeUrl, reviewNote and the review fields are admin-only:
 * an untouched original or a pending composite must never reach the public.
 */
export const PUBLIC_IMAGE_SELECT = {
  id: true,
  url: true,
  altText: true,
  sortOrder: true,
  treatment: true,
} as const satisfies Prisma.ProductImageSelect
