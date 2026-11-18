/* eslint-disable no-console -- CLI script, output is the interface */
// Gives every existing member without a nickname a generated one, so public
// surfaces stop falling back to "First L.". Dry run by default.
//
//   bun run nicknames:backfill               (dry run: prints the plan, writes nothing)
//   bun run nicknames:backfill -- --apply    (write)
//   --i-mean-production                      (allow a DATABASE_URL host other than localhost)
import { checkDatabaseSafety } from '../src/lib/scripts/db-safety'
import { applyNicknameBatch, planNicknameBatch } from '../src/lib/account/nickname-backfill'

const BATCH_SIZE = 200

async function main() {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')

  const safety = checkDatabaseSafety(process.env.DATABASE_URL, args.has('--i-mean-production'))
  if (!safety.ok) {
    console.error(`Refusing to run: ${safety.reason}`)
    process.exit(1)
  }
  if (safety.notice) console.warn(safety.notice)

  // Imported only after the guard so a refused run never opens a connection
  const { db } = await import('../src/lib/db')
  const { uniqueGeneratedNickname } = await import('../src/lib/nickname')

  const seen = new Set<string>()
  let scanned = 0
  let planned = 0
  let skipped = 0
  let written = 0
  let cursor: string | undefined

  try {
    for (;;) {
      const rows = await db.customer.findMany({
        // Keyset on id, not a Prisma cursor: rows written in the last batch
        // no longer match nickname: null, and anonymised rows stay null forever
        where: { nickname: null, ...(cursor ? { id: { gt: cursor } } : {}) },
        select: { id: true, email: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
      })
      if (rows.length === 0) break
      cursor = rows[rows.length - 1].id
      scanned += rows.length

      const plan = await planNicknameBatch(rows, uniqueGeneratedNickname, seen)
      planned += plan.updates.length
      skipped += plan.skipped.length
      for (const u of plan.updates) console.log(`${u.id}  ${u.nickname}`)

      if (apply) {
        const result = await applyNicknameBatch(plan.updates, (a) => db.customer.updateMany(a))
        written += result.written
        for (const id of result.unchanged) console.warn(`NOT WRITTEN ${id}: chose a nickname since planning`)
        for (const id of result.collisions) console.warn(`NOT WRITTEN ${id}: nickname taken meanwhile; re-run to retry`)
      }
    }

    console.log(`\nScanned ${scanned}, planned ${planned}, skipped ${skipped} (anonymised or no free name).`)
    if (!apply) console.log('Dry run: nothing written. Re-run with -- --apply to write.')
    else console.log(`Wrote ${written} of ${planned} planned rows.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
