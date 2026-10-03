// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function corsOriginFor(origin: string) {
  const request = new NextRequest('http://localhost/api/products', { headers: { origin } })
  return proxy(request).headers.get('Access-Control-Allow-Origin')
}

describe('API CORS allowlist', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows the production site with and without www', () => {
    expect(corsOriginFor('https://calo.one')).toBe('https://calo.one')
    expect(corsOriginFor('https://www.calo.one')).toBe('https://www.calo.one')
  })

  it('does not allow the staging site from the production deployment', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '')
    expect(corsOriginFor('https://staging.calo.one')).toBeNull()
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://calo.one')
    expect(corsOriginFor('https://staging.calo.one')).toBeNull()
  })

  it('allows the staging site on the staging deployment', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://staging.calo.one')
    expect(corsOriginFor('https://staging.calo.one')).toBe('https://staging.calo.one')
  })

  it('does not allow localhost in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(corsOriginFor('http://localhost:3000')).toBeNull()
  })

  it('allows localhost outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(corsOriginFor('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('does not allow look-alike hosts', () => {
    expect(corsOriginFor('https://calo.one.evil.example')).toBeNull()
    expect(corsOriginFor('https://evilcalo.one')).toBeNull()
    expect(corsOriginFor('http://calo.one')).toBeNull()
  })

  it('no longer allows the retired domain or unknown origins', () => {
    expect(corsOriginFor('https://calorco.com')).toBeNull()
    expect(corsOriginFor('https://evil.example')).toBeNull()
  })
})
