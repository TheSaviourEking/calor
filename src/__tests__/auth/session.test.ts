import { describe, it, expect, vi } from 'vitest'

// Mock config to avoid requiring JWT_SECRET env var
vi.mock('@/lib/config', () => ({
  config: {
    auth: { jwtSecret: 'test-secret-for-unit-tests' },
  },
}))

// Mock db to avoid Prisma initialization
vi.mock('@/lib/db', () => ({
  db: {},
}))

import { hashPassword, verifyPassword } from '@/lib/auth/session'

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('Test123!')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('Test123!')
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('should verify a correct password', async () => {
    const hash = await hashPassword('Test123!')
    const valid = await verifyPassword('Test123!', hash)
    expect(valid).toBe(true)
  })

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('Test123!')
    const valid = await verifyPassword('Wrong123!', hash)
    expect(valid).toBe(false)
  })
})
