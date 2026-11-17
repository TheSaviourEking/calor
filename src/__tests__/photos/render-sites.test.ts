import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type Site = {
  file: string
  // Number of raw <img> tags deliberately kept (non-product images only).
  allowedRawImg?: { count: number; reason: string }
  // false only when the file renders no product image at all.
  requiresProductPhoto?: boolean
}

const STOREFRONT: Site[] = [
  { file: 'src/components/product/ProductCard.tsx' },
  { file: 'src/app/product/[slug]/ProductDetailClient.tsx' },
  { file: 'src/components/cart/CartDrawer.tsx' },
  { file: 'src/components/search/SearchResults.tsx' },
  { file: 'src/components/search/EnhancedSearchBar.tsx' },
  { file: 'src/components/comparison/ProductComparison.tsx' },
  { file: 'src/components/comparison/ComparisonContext.tsx' },
  {
    file: 'src/app/shop/bundles/BundlesClient.tsx',
    // Bundles render no ProductImage; they only thread treatment into the cart.
    requiresProductPhoto: false,
    allowedRawImg: {
      count: 1,
      reason: 'bundle hero is a merchandising image, not a ProductImage',
    },
  },
  { file: 'src/app/quiz/QuizClient.tsx' },
]

describe('storefront product image render sites', () => {
  it.each(STOREFRONT)('$file renders product images only through ProductPhoto', (site) => {
    const src = readFileSync(join(process.cwd(), site.file), 'utf8')
    if (site.requiresProductPhoto !== false) {
      expect(src).toMatch(/<ProductPhoto\b/)
    }
    expect(src).not.toMatch(/from\s+['"]next\/image['"]/)
    const rawImgs = src.match(/<img\b/g)?.length ?? 0
    expect(rawImgs).toBe(site.allowedRawImg?.count ?? 0)
  })

  it('cart store carries imageTreatment', () => {
    const src = readFileSync(join(process.cwd(), 'src/stores/cart.ts'), 'utf8')
    expect(src).toMatch(/imageTreatment\?: PhotoTreatment/)
  })
})
