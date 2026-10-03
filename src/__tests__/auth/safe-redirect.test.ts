import { describe, it, expect } from 'vitest'
import { safeInternalPath } from '@/lib/safe-redirect'

describe('safeInternalPath', () => {
  it('keeps a same-site path with its query and hash', () => {
    expect(safeInternalPath('/checkout')).toBe('/checkout')
    expect(safeInternalPath('/shop?sort=new#top')).toBe('/shop?sort=new#top')
  })

  it('falls back for anything that could leave the site', () => {
    const hostile = [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'evil.example/path',
      ' /checkout',
      '/\tevil',
      '/%0d%0aSet-Cookie:x=1',
    ]
    for (const value of hostile) {
      expect(safeInternalPath(value)).toBe('/')
    }
  })

  it('falls back for empty input and honours a custom fallback', () => {
    expect(safeInternalPath(null)).toBe('/')
    expect(safeInternalPath(undefined)).toBe('/')
    expect(safeInternalPath('')).toBe('/')
    expect(safeInternalPath('https://evil.example', '/account')).toBe('/account')
  })
})
