#!/usr/bin/env node
// Applies pending Prisma migrations as part of a deploy build.
//
// Wired into `bun run build`, so it runs on every Vercel build:
//   - Production builds (VERCEL_ENV=production) migrate automatically.
//   - Every other build skips, unless MIGRATE_ON_DEPLOY=true is set for that
//     environment (use this for staging, which has its own database).
//   - MIGRATE_ON_DEPLOY=false turns it off anywhere.
//
// Preview builds skip by default because they usually share a database with
// another environment: a pull request must not migrate it before it is merged.
//
// If the migration fails the build fails, and the previous deployment keeps
// serving. Migrations must therefore stay compatible with the code that is
// already live (add or relax first, remove in a later deploy).

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Decides whether this build should migrate, and against which connection.
 * @param {Record<string, string | undefined>} env
 * @returns {{ run: boolean, reason?: string, databaseUrl?: string, error?: string }}
 */
export function migrationPlan(env) {
  const flag = (env.MIGRATE_ON_DEPLOY || '').trim().toLowerCase()

  if (flag === 'false') {
    return { run: false, reason: 'MIGRATE_ON_DEPLOY=false' }
  }

  if (flag !== 'true' && env.VERCEL_ENV !== 'production') {
    return {
      run: false,
      reason: env.VERCEL_ENV
        ? `VERCEL_ENV=${env.VERCEL_ENV} (set MIGRATE_ON_DEPLOY=true to migrate this environment)`
        : 'not a deploy build (set MIGRATE_ON_DEPLOY=true to migrate)',
    }
  }

  // Migrations need a session connection. A transaction-mode pooler (Supabase
  // port 6543, PgBouncer) cannot run them, so a direct url wins when present.
  const databaseUrl = env.MIGRATE_DATABASE_URL || env.DIRECT_URL || env.DATABASE_URL
  if (!databaseUrl) {
    return { run: true, error: 'No database url: set DATABASE_URL (or MIGRATE_DATABASE_URL) for this environment' }
  }

  return { run: true, databaseUrl }
}

/**
 * Turns a known `prisma migrate deploy` failure into a next step.
 * @param {string} output
 * @returns {string | null}
 */
export function failureHint(output) {
  if (output.includes('P3005')) {
    return [
      'This database has tables but no migration history (it was created with `prisma db push`).',
      'Baseline it once, from a machine whose DATABASE_URL points at this database:',
      '  1. See what the database is missing:  bun run db:drift',
      '     It prints the SQL needed to reach schema.prisma. It should be empty, or contain',
      '     only changes from migrations newer than the two historical ones.',
      '  2. Record the two historical migrations as applied:  bun run db:baseline',
      'Then redeploy. Later migrations are applied automatically.',
    ].join('\n')
  }

  if (output.includes('P3009') || output.includes('P3018')) {
    return [
      'A migration failed part-way and is recorded as failed, so later deploys stop here.',
      'Fix the database by hand, then mark it:  bunx prisma migrate resolve --applied "<migration name>"',
      '(or --rolled-back "<migration name>" if you undid it), and redeploy.',
    ].join('\n')
  }

  if (/prepared statement .* already exists/i.test(output) || output.includes('P1001') || output.includes('P1017')) {
    return [
      'The migration could not use this connection. Pooled connections in transaction mode cannot run migrations.',
      'Set MIGRATE_DATABASE_URL (or DIRECT_URL) to a direct or session-mode connection string for this environment.',
    ].join('\n')
  }

  return null
}

function say(message) {
  process.stdout.write(`[migrate-deploy] ${message}\n`)
}

function main() {
  const plan = migrationPlan(process.env)

  if (!plan.run) {
    say(`Skipping migrations: ${plan.reason}`)
    return 0
  }

  if (plan.error) {
    say(plan.error)
    return 1
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const prisma = path.join(root, 'node_modules', '.bin', 'prisma')

  say('Applying pending migrations...')
  const result = spawnSync(prisma, ['migrate', 'deploy'], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: plan.databaseUrl },
    encoding: 'utf8',
  })

  // Prisma prints the host but never the credentials; redact any url anyway
  const output = `${result.stdout || ''}${result.stderr || ''}`.replace(/postgres(ql)?:\/\/\S+/g, '<database url>')
  process.stdout.write(output)

  if (result.error) {
    say(`Could not run prisma: ${result.error.message}`)
    return 1
  }

  if (result.status !== 0) {
    const hint = failureHint(output)
    say('Migration failed. The build stops here; the previous deployment stays live.')
    if (hint) process.stdout.write(`\n${hint}\n\n`)
    return result.status ?? 1
  }

  say('Database is up to date.')
  return 0
}

// Only run when executed directly, not when imported by tests
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main())
}
