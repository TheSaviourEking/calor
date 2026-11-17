// Copy of publicDisplayName from src/lib/discretion.ts, which is the source of
// truth. The mini-service cannot import from src/. Keep the two identical:
// src/__tests__/realtime/display-name-parity.test.ts fails if they diverge.

type NameParts = {
  nickname?: string | null
  firstName?: string | null
  lastName?: string | null
}

/** Nickname if set, else "First L."; never email or full last name. */
export function publicDisplayName(p: NameParts | null | undefined, fallback = 'Guest'): string {
  if (!p) return fallback
  const nickname = p.nickname?.trim()
  if (nickname) return nickname
  const first = p.firstName?.trim()
  if (!first) return fallback
  const last = p.lastName?.trim()
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}
