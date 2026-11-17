import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { detectWhiteBackground } from './detect'
import { putObject } from './storage'
import type { PhotoTreatment } from './types'

// Decoding cost grows with pixel count, not file size; a small file can claim
// a huge canvas. Anything above this is rejected before it is decoded.
export const MAX_INPUT_PIXELS = 50_000_000

export class InvalidImageError extends Error {}

export interface IngestedPhoto {
  url: string
  originalUrl: string
  treatment: PhotoTreatment
  whiteBackground: boolean
  width: number
  height: number
}

// Detected container format -> stored extension and content type
function storedAs(meta: sharp.Metadata): { ext: string; contentType: string } | null {
  switch (meta.format) {
    case 'jpeg': return { ext: 'jpg', contentType: 'image/jpeg' }
    case 'png': return { ext: 'png', contentType: 'image/png' }
    case 'webp': return { ext: 'webp', contentType: 'image/webp' }
    case 'gif': return { ext: 'gif', contentType: 'image/gif' }
    case 'heif': return meta.compression === 'av1' ? { ext: 'avif', contentType: 'image/avif' } : null
    default: return null
  }
}

/**
 * Validates an uploaded photo by its bytes, stores the untouched original under
 * originals/ and decides how the storefront should present it.
 */
export async function ingestPhoto(buffer: Buffer, { studio }: { studio: boolean }): Promise<IngestedPhoto> {
  let meta: sharp.Metadata
  try {
    meta = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()
  } catch {
    throw new InvalidImageError('File does not appear to be a valid image.')
  }

  const stored = storedAs(meta)
  if (!stored || !meta.width || !meta.height) {
    throw new InvalidImageError('File does not appear to be a valid image.')
  }

  // EXIF orientations 5-8 rotate by 90 degrees, so the displayed size is swapped
  const rotated = (meta.orientation ?? 1) >= 5
  const width = rotated ? meta.height : meta.width
  const height = rotated ? meta.width : meta.height

  let whiteBackground: boolean
  try {
    whiteBackground = await detectWhiteBackground(buffer)
  } catch {
    throw new InvalidImageError('File does not appear to be a valid image.')
  }

  const url = await putObject(`originals/${uuidv4()}.${stored.ext}`, buffer, stored.contentType)
  const treatment: PhotoTreatment = !studio && whiteBackground ? 'blend' : 'original'

  return { url, originalUrl: url, treatment, whiteBackground, width, height }
}
