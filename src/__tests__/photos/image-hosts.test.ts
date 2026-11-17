// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { isOptimizableSrc, STATIC_REMOTE_PATTERNS } from '@/lib/photos/image-hosts'

describe('isOptimizableSrc', () => {
  it.each([
    ['/images/products/ring.png', true],
    ['https://pub-123.r2.dev/products/a.jpg', true],
    ['https://acct.r2.cloudflarestorage.com/bucket/a.jpg', true],
    ['https://images.unsplash.com/photo-1', true],
    ['https://cdn.pixabay.com/photo/a.jpg', true],
    ['https://evil.example/a.jpg', false],
    ['https://r2.dev.evil.com/a.jpg', false],
    ['https://r2.dev/a.jpg', false],
    ['https://notr2.dev/a.jpg', false],
    ['http://images.unsplash.com/photo-1', false],
    ['data:image/png;base64,AAAA', false],
    ['//images.unsplash.com/photo-1', false],
    ['not a url', false],
  ])('%s -> %s', (src, expected) => {
    expect(isOptimizableSrc(src)).toBe(expected)
  })

  it('exposes only https patterns for next.config', () => {
    expect(STATIC_REMOTE_PATTERNS.length).toBeGreaterThan(0)
    for (const p of STATIC_REMOTE_PATTERNS) expect(p.protocol).toBe('https')
  })
})
