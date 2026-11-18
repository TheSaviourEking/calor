import { describe, it, expect, vi } from 'vitest'
import {
  isAnonymisedCustomer,
  planNicknameBatch,
  applyNicknameBatch,
} from '@/lib/account/nickname-backfill'

const rows = [
  { id: 'c1', email: 'ada@example.com' },
  { id: 'c2', email: 'deleted+c2@invalid' },
  { id: 'c3', email: 'grace@example.com' },
]

describe('isAnonymisedCustomer', () => {
  it('recognises the placeholder email account deletion writes', () => {
    expect(isAnonymisedCustomer({ email: 'deleted+abc@invalid' })).toBe(true)
    expect(isAnonymisedCustomer({ email: 'DELETED+abc@INVALID' })).toBe(true)
    expect(isAnonymisedCustomer({ email: 'deleted@example.com' })).toBe(false)
    expect(isAnonymisedCustomer({ email: 'ada@example.com' })).toBe(false)
  })
})

describe('planNicknameBatch', () => {
  it('assigns a generated nickname to each live member and skips anonymised rows', async () => {
    const names = ['Amber 0001', 'Velvet 0002']
    const generate = vi.fn(async () => names.shift()!)
    const plan = await planNicknameBatch(rows, generate)
    expect(plan.updates).toEqual([
      { id: 'c1', nickname: 'Amber 0001' },
      { id: 'c3', nickname: 'Velvet 0002' },
    ])
    expect(plan.skipped).toEqual(['c2'])
  })

  it('never plans the same nickname twice in one run (case-insensitive)', async () => {
    const names = ['Amber 0001', 'amber 0001', 'Ember 0003']
    const generate = vi.fn(async () => names.shift()!)
    const seen = new Set<string>()
    const plan = await planNicknameBatch([rows[0], rows[2]], generate, seen)
    expect(plan.updates.map((u) => u.nickname)).toEqual(['Amber 0001', 'Ember 0003'])
    expect(seen.has('ember 0003')).toBe(true)
  })
})

describe('applyNicknameBatch', () => {
  it('writes only rows still without a nickname', async () => {
    const updateMany = vi.fn(async ({ where }: { where: { id: string } }) => ({ count: where.id === 'c1' ? 1 : 0 }))
    const result = await applyNicknameBatch(
      [{ id: 'c1', nickname: 'Amber 0001' }, { id: 'c3', nickname: 'Velvet 0002' }],
      updateMany,
    )
    expect(updateMany).toHaveBeenCalledWith({ where: { id: 'c1', nickname: null }, data: { nickname: 'Amber 0001' } })
    expect(result).toEqual({ written: 1, unchanged: ['c3'], collisions: [] })
  })

  it('records a unique-constraint collision instead of aborting the run', async () => {
    const updateMany = vi.fn(async () => {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    })
    const result = await applyNicknameBatch([{ id: 'c1', nickname: 'Amber 0001' }], updateMany)
    expect(result).toEqual({ written: 0, unchanged: [], collisions: ['c1'] })
  })

  it('rethrows any other error', async () => {
    const updateMany = vi.fn(async () => {
      throw new Error('connection lost')
    })
    await expect(applyNicknameBatch([{ id: 'c1', nickname: 'Amber 0001' }], updateMany)).rejects.toThrow('connection lost')
  })
})

describe('backfill script wiring', () => {
  it('guards the database before importing db and is dry-run by default', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync('scripts/backfill-nicknames.ts', 'utf8')
    expect(src).toContain('checkDatabaseSafety(')
    expect(src).toContain("args.has('--apply')")
    expect(src.indexOf('checkDatabaseSafety(')).toBeLessThan(src.indexOf("import('../src/lib/db')"))
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    expect(pkg.scripts['nicknames:backfill']).toBe('bun run scripts/backfill-nicknames.ts')
  })
})
