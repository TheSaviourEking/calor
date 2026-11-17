import type { Metadata } from 'next'

// Page metadata for shared surfaces. Callers pass an already-computed public
// display name (publicDisplayName), never raw name parts.

export function wishlistMetadata(title: string | null | undefined, ownerDisplayName: string): Metadata {
  return {
    title: `${title || 'Wishlist'} by ${ownerDisplayName} | calo.`,
    description: `View ${ownerDisplayName}'s curated wishlist on calo.`,
  }
}

export function registryMetadata(title: string | null | undefined, ownerDisplayName: string): Metadata {
  return {
    title: `${title || 'Gift Registry'} by ${ownerDisplayName} | calo.`,
    description: `View and purchase gifts from ${ownerDisplayName}'s registry.`,
  }
}
