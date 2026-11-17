import { db } from '@/lib/db'
import { generateNickname } from '@/lib/discretion'

const MAX_TRIES = 5

/** A generated nickname nobody has (case-insensitive). After 5 collisions, adds a 6th digit. */
export async function uniqueGeneratedNickname(): Promise<string> {
  let candidate = ''
  for (let i = 0; i < MAX_TRIES; i++) {
    candidate = generateNickname()
    const taken = await db.customer.findFirst({
      where: { nickname: { equals: candidate, mode: 'insensitive' } },
      select: { id: true },
    })
    if (!taken) return candidate
  }
  return `${candidate}${Math.floor(Math.random() * 10)}`
}
