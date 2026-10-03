import { createHash, timingSafeEqual } from 'crypto'

// Cron endpoints are called by the VPS crontab with
// `Authorization: Bearer $CRON_SECRET` (see scripts/setup-crontab.sh).
// Fails closed: with no secret configured, nothing is authorized.

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const received = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`

  // Reject if header had leading/trailing whitespace
  if (received !== received.trim()) return false

  return timingSafeEqual(digest(received), digest(expected))
}
