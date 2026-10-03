// Cron endpoints are called by the VPS crontab with
// `Authorization: Bearer $CRON_SECRET` (see scripts/setup-crontab.sh).
// Fails closed: with no secret configured, nothing is authorized.
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  return request.headers.get('authorization') === `Bearer ${secret}`
}
