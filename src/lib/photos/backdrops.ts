import { getObject, isStorageConfigured, publicUrl } from './storage'
import type { Backdrop } from './types'

/** Reads a calo. backdrop from photo storage (backdrops/<name>.jpg). */
export async function loadBackdrop(name: Backdrop): Promise<Buffer> {
  if (!isStorageConfigured()) throw new Error('Photo storage is not configured')
  return getObject(publicUrl(`backdrops/${name}.jpg`))
}
