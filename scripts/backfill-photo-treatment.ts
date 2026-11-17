/* eslint-disable no-console -- CLI script, output is the interface */
// Backfills originalUrl / treatment / whiteBackground / width / height on existing
// ProductImage rows. Dry run by default; writes only with --apply.
//
//   bun run photos:backfill                 (dry run)
//   bun run photos:backfill --apply         (write)
//   --i-mean-production                     (allow a DATABASE_URL host other than localhost)
import path from 'path'
import { applyBackfill, checkDatabaseSafety, createLoader, planBackfill, type BackfillUpdate } from '../src/lib/photos/backfill'

const PAGE_SIZE = 100

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
  const load = createLoader(path.join(process.cwd(), 'public'))

  const updates: BackfillUpdate[] = []
  const skipped: { id: string; reason: string }[] = []
  let scanned = 0
  let cursor: string | undefined

  try {
    for (;;) {
      const rows = await db.productImage.findMany({
        where: { originalUrl: null, treatment: { not: 'composite' } },
        select: { id: true, url: true, originalUrl: true, treatment: true },
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
      if (rows.length === 0) break
      cursor = rows[rows.length - 1].id
      scanned += rows.length

      updates.push(...(await planBackfill(rows, load, (id, reason) => skipped.push({ id, reason }))))
    }

    for (const u of updates) {
      console.log(`${u.id}  ${u.data.treatment.padEnd(8)} ${u.data.width}x${u.data.height}  ${u.data.originalUrl.slice(0, 70)}`)
    }
    for (const s of skipped) console.warn(`SKIPPED ${s.id}: ${s.reason}`)
    console.log(`\nScanned ${scanned}, planned ${updates.length}, skipped ${skipped.length}.`)

    if (!apply) {
      console.log('Dry run: nothing written. Re-run with --apply to write.')
      return
    }

    // Conditional writes: rows approved or changed since planning are left alone
    const result = await applyBackfill(updates, (args) => db.productImage.updateMany(args))
    for (const id of result.unchanged) console.warn(`NOT WRITTEN ${id}: no longer qualifies (changed since planning)`)
    console.log(`Wrote ${result.written} of ${result.planned} planned rows.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
