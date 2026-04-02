import { describe, it, expect } from 'vitest'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024

function validateUpload(type: string, size: number): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(type)) {
    return { valid: false, error: `File type '${type}' is not allowed` }
  }
  if (size > MAX_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit` }
  }
  return { valid: true }
}

describe('Upload Validation', () => {
  it('should accept JPEG', () => {
    expect(validateUpload('image/jpeg', 1024).valid).toBe(true)
  })

  it('should accept PNG', () => {
    expect(validateUpload('image/png', 1024).valid).toBe(true)
  })

  it('should accept WebP', () => {
    expect(validateUpload('image/webp', 1024).valid).toBe(true)
  })

  it('should reject PDF', () => {
    expect(validateUpload('application/pdf', 1024).valid).toBe(false)
  })

  it('should reject executable', () => {
    expect(validateUpload('application/x-msdownload', 1024).valid).toBe(false)
  })

  it('should reject files over 5MB', () => {
    expect(validateUpload('image/jpeg', 6 * 1024 * 1024).valid).toBe(false)
  })

  it('should accept files under 5MB', () => {
    expect(validateUpload('image/jpeg', 4 * 1024 * 1024).valid).toBe(true)
  })
})
