import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { detectWhiteBackground } from './detect'
import { MAX_INPUT_PIXELS } from './ingest'
import { getObject } from './storage'
import type { PhotoTreatment } from './types'

export interface BackfillRow {
  id: string
  url: string
  originalUrl: string | null
  treatment: string
}

export interface BackfillUpdate {
  id: string
  data: {
    originalUrl: string
    treatment: PhotoTreatment
    whiteBackground: boolean
    width: number
    height: number
  }
}

/**
 * Works out what to write for existing product images. Pure: all I/O goes
 * through `load`. Composites and rows that already have an original are left
 * alone; rows whose image cannot be read are skipped and passed to `onSkip`.
 */
export async function planBackfill(
  rows: BackfillRow[],
  load: (url: string) => Promise<Buffer>,
  onSkip?: (id: string, reason: string) => void,
): Promise<BackfillUpdate[]> {
  const plan: BackfillUpdate[] = []

  for (const row of rows) {
    if (row.treatment === 'composite' || row.originalUrl) continue

    try {
      const buffer = await load(row.url)
      const meta = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()
      if (!meta.width || !meta.height) throw new Error('image has no dimensions')

      // EXIF orientations 5-8 rotate by 90 degrees, so the displayed size is swapped
      const rotated = (meta.orientation ?? 1) >= 5
      const whiteBackground = await detectWhiteBackground(buffer)

      plan.push({
        id: row.id,
        data: {
          originalUrl: row.url,
          treatment: whiteBackground ? 'blend' : 'original',
          whiteBackground,
          width: rotated ? meta.height : meta.width,
          height: rotated ? meta.width : meta.height,
        },
      })
    } catch (err) {
      onSkip?.(row.id, err instanceof Error ? err.message : String(err))
    }
  }

  return plan
}

/**
 * Loader for mixed legacy data: site-relative paths are read from the public
 * directory (never outside it), data: and R2 URLs go through getObject, and
 * anything else is refused.
 */
export function createLoader(publicDir: string): (url: string) => Promise<Buffer> {
  const root = path.resolve(publicDir)
  return async (url) => {
    if (url.startsWith('/') && !url.startsWith('//')) {
      const file = path.resolve(root, `.${url}`)
      if (file !== root && !file.startsWith(root + path.sep)) {
        throw new Error(`Path resolves outside public/: ${url}`)
      }
      return fs.readFile(file)
    }
    if (url.startsWith('data:')) return getObject(url)
    try {
      return await getObject(url)
    } catch {
      throw new Error(`Unsupported image URL: ${url.slice(0, 80)}`)
    }
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/** Decides whether the script may touch this database. Never echoes credentials. */
export function checkDatabaseSafety(
  databaseUrl: string | undefined,
  allowRemote: boolean,
): { ok: true } | { ok: false; reason: string } {
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL is not set' }
  let host: string
  try {
    host = new URL(databaseUrl).hostname
  } catch {
    return { ok: false, reason: 'DATABASE_URL could not be parsed' }
  }
  if (LOCAL_HOSTS.has(host) || allowRemote) return { ok: true }
  return {
    ok: false,
    reason: `DATABASE_URL host "${host}" is not localhost or 127.0.0.1; pass --i-mean-production to run against it`,
  }
}
