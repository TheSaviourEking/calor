import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

describe('Registration Validation', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test123!@',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(result.success).toBe(true)
  })

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'test123!@',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without special character', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test12345',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'Test123!@',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty firstName', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test123!@',
      firstName: '',
      lastName: 'Doe',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Te1!',
      firstName: 'John',
      lastName: 'Doe',
    })
    expect(result.success).toBe(false)
  })
})
