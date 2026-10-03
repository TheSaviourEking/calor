import type { RealtimeUser } from './realtime-token'

// Pure authorization rules shared by the socket services.

export function isAdmin(user: RealtimeUser | null | undefined): boolean {
  return user?.isAdmin === true
}

// A stream is controlled by its own host or by any admin.
export function canControlStream(
  user: RealtimeUser | null | undefined,
  stream: { hostId: string } | null | undefined
): boolean {
  if (!user || !stream) return false
  if (user.isAdmin) return true

  return !!user.hostId && user.hostId === stream.hostId
}

// Returns a trimmed message no longer than maxLength, or null if there is nothing usable.
export function cleanMessage(input: unknown, maxLength: number): string | null {
  if (typeof input !== 'string') return null

  const trimmed = input.trim()
  if (!trimmed) return null

  return trimmed.slice(0, maxLength)
}
