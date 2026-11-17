// Single source of truth for the remote hosts next/image may optimize. Used by
// next.config.ts (images.remotePatterns) and by ProductPhoto, which serves any
// other absolute URL unoptimized so off-list hosts still render instead of
// throwing "hostname is not configured" (dev) or returning 400 (production).
//
// Kept free of imports so next.config.ts can load it directly.

export type StaticRemotePattern = { protocol: 'https'; hostname: string }

export const STATIC_REMOTE_PATTERNS: readonly StaticRemotePattern[] = [
  { protocol: 'https', hostname: 'cdn.pixabay.com' },
  // Default R2 bucket URL
  { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: '*.r2.dev' },
]

// Same semantics as next/image: "*" matches exactly one subdomain label,
// "**" matches one or more labels.
function hostMatches(pattern: string, host: string): boolean {
  const p = pattern.toLowerCase().split('.')
  const h = host.toLowerCase().split('.')
  if (p[0] === '**') {
    const rest = p.slice(1)
    return h.length > rest.length && h.slice(h.length - rest.length).join('.') === rest.join('.')
  }
  if (p.length !== h.length) return false
  return p.every((label, i) => (label === '*' ? h[i].length > 0 : label === h[i]))
}

/**
 * True when next/image can optimize this src with the static allowlist:
 * site-relative paths and https URLs on an allowlisted host. data: URLs,
 * protocol-relative URLs and anything off-list must be served unoptimized.
 */
export function isOptimizableSrc(src: string): boolean {
  if (src.startsWith('/')) return !src.startsWith('//')
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return false
  }
  return STATIC_REMOTE_PATTERNS.some(
    (p) => url.protocol === `${p.protocol}:` && hostMatches(p.hostname, url.hostname),
  )
}
