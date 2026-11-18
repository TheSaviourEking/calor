// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import {
  EMAIL_SUBJECTS,
  STATEMENT_DESCRIPTOR,
  generateNickname,
  publicDisplayName,
  shipFromName,
  validateNickname,
} from '@/lib/discretion'

describe('publicDisplayName', () => {
  it('prefers nickname', () => {
    expect(publicDisplayName({ nickname: 'Amber 4821', firstName: 'Ada', lastName: 'Lovelace' })).toBe('Amber 4821')
  })
  it('uses first name and last initial', () => {
    expect(publicDisplayName({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada L.')
  })
  it('uses first name alone without last name', () => {
    expect(publicDisplayName({ firstName: 'Ada', lastName: '' })).toBe('Ada')
  })
  it('falls back', () => {
    expect(publicDisplayName(null)).toBe('Guest')
    expect(publicDisplayName(null, 'Anonymous')).toBe('Anonymous')
  })
})

describe('validateNickname', () => {
  it('rejects too short after trim', () => {
    expect(validateNickname('  ab ').ok).toBe(false)
  })
  it('rejects @', () => {
    expect(validateNickname('a@b.com').ok).toBe(false)
  })
  it('rejects non-strings and too long', () => {
    expect(validateNickname(42).ok).toBe(false)
    expect(validateNickname('a'.repeat(25)).ok).toBe(false)
  })
  it('collapses internal whitespace', () => {
    expect(validateNickname('Amber   4821')).toEqual({ ok: true, value: 'Amber 4821' })
  })
  it('rejects a nickname with no letter or digit', () => {
    expect(validateNickname('___').ok).toBe(false)
    expect(validateNickname('- -').ok).toBe(false)
  })
  it('accepts valid', () => {
    expect(validateNickname('Night_Owl-7')).toEqual({ ok: true, value: 'Night_Owl-7' })
    expect(validateNickname('  Amber 4821 ')).toEqual({ ok: true, value: 'Amber 4821' })
  })
})

describe('generateNickname', () => {
  it('matches the format', () => {
    expect(generateNickname(() => 0)).toMatch(/^[A-Z][a-z]+ \d{4}$/)
    expect(generateNickname(() => 0.999999)).toMatch(/^[A-Z][a-z]+ \d{4}$/)
    expect(generateNickname()).toMatch(/^[A-Z][a-z]+ \d{4}$/)
  })
  it('generates valid nicknames', () => {
    expect(validateNickname(generateNickname()).ok).toBe(true)
  })
})

describe('EMAIL_SUBJECTS', () => {
  it('has no interpolation and exact values', () => {
    for (const v of Object.values(EMAIL_SUBJECTS)) {
      expect(v).not.toMatch(/[${]/)
    }
    expect(EMAIL_SUBJECTS.priceDrop).toBe('Something on your list has changed')
    expect(EMAIL_SUBJECTS.shipped).toBe('Your order is on its way')
  })
})

describe('constants', () => {
  const orig = process.env.SHIP_FROM_NAME
  afterEach(() => {
    if (orig === undefined) delete process.env.SHIP_FROM_NAME
    else process.env.SHIP_FROM_NAME = orig
  })
  it('statement descriptor', () => {
    expect(STATEMENT_DESCRIPTOR).toBe('CALO CO')
  })
  it('shipFromName', () => {
    delete process.env.SHIP_FROM_NAME
    expect(shipFromName()).toBe('CC Fulfillment')
    process.env.SHIP_FROM_NAME = 'Acme Logistics'
    expect(shipFromName()).toBe('Acme Logistics')
  })
})
