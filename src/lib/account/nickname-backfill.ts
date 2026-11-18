// Planning and writing for scripts/backfill-nicknames.ts. Pure: the database
// and the nickname generator are passed in, so this is testable with mocks.

export interface NicknameRow {
  id: string
  email: string
}

export interface NicknameUpdate {
  id: string
  nickname: string
}

const MAX_TRIES = 5

/** Account deletion leaves `deleted+<id>@invalid`; those rows get no nickname. */
export function isAnonymisedCustomer(row: { email: string }): boolean {
  return /^deleted\+.*@invalid$/i.test(row.email)
}

/**
 * One generated nickname per live member. `seen` spans the whole run, so two
 * rows never get the same name even before either is written.
 */
export async function planNicknameBatch(
  rows: NicknameRow[],
  generate: () => Promise<string>,
  seen: Set<string> = new Set(),
): Promise<{ updates: NicknameUpdate[]; skipped: string[] }> {
  const updates: NicknameUpdate[] = []
  const skipped: string[] = []
  for (const row of rows) {
    if (isAnonymisedCustomer(row)) {
      skipped.push(row.id)
      continue
    }
    let nickname = await generate()
    for (let i = 1; i < MAX_TRIES && seen.has(nickname.toLowerCase()); i++) {
      nickname = await generate()
    }
    if (seen.has(nickname.toLowerCase())) {
      skipped.push(row.id)
      continue
    }
    seen.add(nickname.toLowerCase())
    updates.push({ id: row.id, nickname })
  }
  return { updates, skipped }
}

type NicknameUpdateMany = (args: {
  where: { id: string; nickname: null }
  data: { nickname: string }
}) => Promise<{ count: number }>

/**
 * Conditional writes: a member who chose a nickname since planning keeps it.
 * A unique-constraint clash (someone took the name meanwhile) is recorded and
 * left for the next run rather than aborting the batch.
 */
export async function applyNicknameBatch(
  updates: NicknameUpdate[],
  updateMany: NicknameUpdateMany,
): Promise<{ written: number; unchanged: string[]; collisions: string[] }> {
  let written = 0
  const unchanged: string[] = []
  const collisions: string[] = []
  for (const u of updates) {
    try {
      const { count } = await updateMany({ where: { id: u.id, nickname: null }, data: { nickname: u.nickname } })
      if (count > 0) written += count
      else unchanged.push(u.id)
    } catch (err) {
      if ((err as { code?: string })?.code === 'P2002') collisions.push(u.id)
      else throw err
    }
  }
  return { written, unchanged, collisions }
}
