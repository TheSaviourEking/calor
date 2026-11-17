import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 object storage for product photos. Objects are served from the
// bucket's public URL (R2_PUBLIC_URL, or the default r2.dev domain).

function settings() {
  const accountId = process.env.R2_ACCOUNT_ID
  const base = process.env.R2_PUBLIC_URL || (accountId ? `https://pub-${accountId}.r2.dev` : '')
  return {
    accountId,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
    publicBase: base.replace(/\/+$/, ''),
  }
}

export function isStorageConfigured(): boolean {
  const s = settings()
  return Boolean(s.accountId && s.accessKeyId && s.secretAccessKey && s.bucket)
}

export function publicUrl(key: string): string {
  return `${settings().publicBase}/${key}`
}

// True only for a URL under our bucket's public base
function isUnderPublicBase(url: string, prefix = ''): boolean {
  const base = settings().publicBase
  return base !== '' && url.startsWith(`${base}/${prefix}`)
}

/** True when the URL points at an original this app stored under originals/. */
export function isStoredOriginal(url: unknown): url is string {
  return typeof url === 'string' && isUnderPublicBase(url, 'originals/')
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const s = settings()
  if (!s.accountId || !s.accessKeyId || !s.secretAccessKey || !s.bucket) {
    throw new Error('R2 storage is not configured')
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${s.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
  })
  await client.send(new PutObjectCommand({ Bucket: s.bucket, Key: key, Body: body, ContentType: contentType }))
  return publicUrl(key)
}

// Resolves a site-relative path ("/images/x.png", never "//host") against the
// app's own origin. Reads the env var directly: @/lib/config throws at import
// when unrelated env vars are missing. Returns null if it cannot stay on-origin.
function appOriginUrl(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//')) return null
  const base = process.env.NEXT_PUBLIC_BASE_URL
  if (!base) return null
  try {
    const origin = new URL(base).origin
    const resolved = new URL(path, origin)
    return resolved.origin === origin ? resolved.href : null
  } catch {
    return null
  }
}

/**
 * Reads a stored photo back: a data: URL is decoded in place, a URL under the
 * bucket's public base or a site-relative path on the app's own origin is
 * fetched without following redirects. Any other URL is refused, so this never
 * fetches an arbitrary host.
 */
export async function getObject(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',')
    if (comma === -1) throw new Error('Malformed data URL')
    const meta = url.slice(5, comma)
    const payload = url.slice(comma + 1)
    return meta.endsWith(';base64')
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload))
  }

  const target = isUnderPublicBase(url) ? url : appOriginUrl(url)
  if (!target) throw new Error('Refusing to fetch a URL outside photo storage')

  const res = await fetch(target, { redirect: 'error' })
  if (!res.ok) throw new Error(`Failed to fetch ${target}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
