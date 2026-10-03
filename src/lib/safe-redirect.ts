// Returns the value only if it is a path on this site; otherwise the fallback.
// Used wherever a redirect target comes from the URL, so a crafted link cannot
// send a visitor to another origin.
export function safeInternalPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback

  // Must be an absolute path: one leading slash, not "//host" or "/\host"
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback

  // No control characters, raw or percent-encoded
  if (/[\u0000-\u001f\u007f]/.test(value) || /%0[0-9a-f]|%1[0-9a-f]|%7f/i.test(value)) return fallback

  return value
}
