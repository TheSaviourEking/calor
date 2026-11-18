// Guard for one-off data scripts: they run against localhost unless the
// operator explicitly opts in to another host. Pure: no db import.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

// Query parameters that libpq-style clients may use to connect somewhere other
// than the URL's hostname
const HOST_OVERRIDE_PARAMS = new Set(['host', 'hostaddr'])

/** Decides whether the script may touch this database. Never echoes credentials. */
export function checkDatabaseSafety(
  databaseUrl: string | undefined,
  allowRemote: boolean,
): { ok: true; notice?: string } | { ok: false; reason: string } {
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL is not set' }
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return { ok: false, reason: 'DATABASE_URL could not be parsed' }
  }
  const host = url.hostname

  const overrides = [...url.searchParams].filter(([key]) => HOST_OVERRIDE_PARAMS.has(key.toLowerCase()))
  if (overrides.length > 0) {
    const described = overrides.map(([key, value]) => `${key}="${value}"`).join(', ')
    if (!allowRemote) {
      return {
        ok: false,
        reason: `DATABASE_URL query parameter ${described} can override host "${host}"; pass --i-mean-production to run against it`,
      }
    }
    return { ok: true, notice: `DATABASE_URL query parameter ${described} overrides host "${host}"; effective host: ${overrides[overrides.length - 1][1]}` }
  }

  if (LOCAL_HOSTS.has(host) || allowRemote) return { ok: true }
  return {
    ok: false,
    reason: `DATABASE_URL host "${host}" is not localhost or 127.0.0.1; pass --i-mean-production to run against it`,
  }
}
