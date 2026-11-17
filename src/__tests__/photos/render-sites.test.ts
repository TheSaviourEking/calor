import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const STOREFRONT = [
  'src/components/product/ProductCard.tsx',
  'src/app/product/[slug]/ProductDetailClient.tsx',
  'src/components/cart/CartDrawer.tsx',
  'src/components/search/SearchResults.tsx',
  'src/components/search/EnhancedSearchBar.tsx',
  'src/components/comparison/ProductComparison.tsx',
  'src/components/comparison/ComparisonContext.tsx',
  'src/app/shop/bundles/BundlesClient.tsx',
  'src/app/quiz/QuizClient.tsx',
]

describe('storefront product image render sites', () => {
  it.each(STOREFRONT)('%s renders product images only through ProductPhoto', (file) => {
    const src = readFileSync(join(process.cwd(), file), 'utf8')
    expect(src).toMatch(/<ProductPhoto\b/)
    expect(src).not.toMatch(/<(img|Image)\b[^>]*(images\[|image\b|\.url)/)
  })

  it('cart store carries imageTreatment', () => {
    const src = readFileSync(join(process.cwd(), 'src/stores/cart.ts'), 'utf8')
    expect(src).toMatch(/imageTreatment\?: PhotoTreatment/)
  })
})
