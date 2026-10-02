// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { migrationPlan, failureHint } from '../../../scripts/migrate-deploy.mjs'

const url = 'postgresql://user:pass@db.example:5432/app'

describe('migrationPlan', () => {
  it('migrates on a Vercel production build', () => {
    expect(migrationPlan({ VERCEL_ENV: 'production', DATABASE_URL: url })).toEqual({ run: true, databaseUrl: url })
  })

  it('skips Vercel preview builds, which may share the production database', () => {
    const plan = migrationPlan({ VERCEL_ENV: 'preview', DATABASE_URL: url })
    expect(plan.run).toBe(false)
  })

  it('skips local and CI builds', () => {
    expect(migrationPlan({ DATABASE_URL: url }).run).toBe(false)
  })

  it('lets an environment opt in, e.g. the staging deployment', () => {
    expect(migrationPlan({ VERCEL_ENV: 'preview', MIGRATE_ON_DEPLOY: 'true', DATABASE_URL: url })).toEqual({
      run: true,
      databaseUrl: url,
    })
  })

  it('lets production opt out', () => {
    expect(migrationPlan({ VERCEL_ENV: 'production', MIGRATE_ON_DEPLOY: 'false', DATABASE_URL: url }).run).toBe(false)
  })

  it('prefers a direct connection over the pooled one', () => {
    const direct = 'postgresql://user:pass@direct.example:5432/app'
    const migrate = 'postgresql://user:pass@migrate.example:5432/app'
    expect(migrationPlan({ VERCEL_ENV: 'production', DATABASE_URL: url, DIRECT_URL: direct }).databaseUrl).toBe(direct)
    expect(
      migrationPlan({ VERCEL_ENV: 'production', DATABASE_URL: url, DIRECT_URL: direct, MIGRATE_DATABASE_URL: migrate })
        .databaseUrl
    ).toBe(migrate)
  })

  it('fails the build when it should migrate but has no database url', () => {
    const plan = migrationPlan({ VERCEL_ENV: 'production' })
    expect(plan.run).toBe(true)
    expect(plan.databaseUrl).toBeUndefined()
    expect(plan.error).toMatch(/DATABASE_URL/)
  })

  it('never puts the connection string in the skip reason', () => {
    const plan = migrationPlan({ VERCEL_ENV: 'preview', DATABASE_URL: url })
    expect(JSON.stringify(plan)).not.toContain('pass')
  })
})

describe('failureHint', () => {
  it('explains the one-time baseline when the database was created without migrations', () => {
    const hint = failureHint('Error: P3005\n\nThe database schema is not empty.')
    expect(hint).toMatch(/db:baseline/)
  })

  it('explains a failed migration that needs resolving', () => {
    expect(failureHint('Error: P3009\n\nmigrate found failed migrations')).toMatch(/migrate resolve/)
  })

  it('points at the pooler when the connection cannot prepare statements', () => {
    expect(failureHint('prepared statement "s0" already exists')).toMatch(/MIGRATE_DATABASE_URL/)
  })

  it('has nothing to add for an unknown failure', () => {
    expect(failureHint('something else broke')).toBeNull()
  })
})
