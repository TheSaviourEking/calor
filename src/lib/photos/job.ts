import { db } from '@/lib/db'
import { getBackgroundRemover, type BackgroundRemover } from './background'
import { loadBackdrop as defaultLoadBackdrop } from './backdrops'
import { composeOnBackdrop, encodeComposite, verifyCutoutMatchesOriginal, verifyProductUntouched } from './composite'
import { getObject, putObject } from './storage'
import { isBackdrop, type Backdrop } from './types'

/**
 * Builds a calo. composite for one product image and leaves it pending for an
 * admin to approve. Only the background may change: the cutout is checked
 * against the original and the product is checked again in the composite.
 *
 * Never touches the live photo (url/treatment) and never throws: any failure
 * marks the row rejected with a note an admin can read.
 */

// A failure whose message is already fit to show an admin.
class Rejection extends Error {}

const CUTOUT_NOTES = {
  transparency: 'The cut-out came back without a transparent background.',
  size: 'The cut-out does not match the original photo.',
  empty: 'The cut-out did not contain any solid part of the product.',
} as const

function changedNote(maxDiff: number): string {
  return `The product changed during processing (colour difference ${maxDiff}), so the composite was not used.`
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Runs a step, turning any error into a Rejection with the given note.
async function step<T>(note: string | ((err: unknown) => string), run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    throw new Rejection(typeof note === 'string' ? note : note(err))
  }
}

async function update(imageId: string, data: Record<string, unknown>): Promise<void> {
  await db.productImage.update({ where: { id: imageId }, data })
}

export async function runCompositeJob(
  imageId: string,
  backdrop: Backdrop,
  deps: { remover?: BackgroundRemover; loadBackdrop?: typeof defaultLoadBackdrop } = {},
): Promise<void> {
  try {
    if (!isBackdrop(backdrop)) throw new Rejection('That backdrop is not available.')
    await update(imageId, { reviewStatus: 'pending', backdrop, compositeUrl: null, reviewNote: null })

    const image = await db.productImage.findUnique({ where: { id: imageId } })
    if (!image) throw new Rejection('This photo no longer exists.')

    const remover = deps.remover ?? getBackgroundRemover()
    if (!remover) throw new Rejection('Background removal is not set up yet.')

    const original = await step('The original photo could not be read.', () =>
      getObject(image.originalUrl ?? image.url),
    )
    const cutout = await step((err) => `The background-removal service failed: ${messageOf(err)}`, () =>
      remover.remove(original),
    )

    const check = await step('The cut-out could not be checked against the original photo.', () => verifyCutoutMatchesOriginal(original, cutout))
    if (!check.ok) {
      const reason = check.reason ?? 'changed'
      throw new Rejection(reason === 'changed' ? changedNote(check.maxDiff) : CUTOUT_NOTES[reason])
    }

    const backdropImage = await step(`The ${backdrop} backdrop could not be loaded.`, () =>
      (deps.loadBackdrop ?? defaultLoadBackdrop)(backdrop),
    )
    const { raw, placement, scaledCutout } = await composeOnBackdrop({ cutout, backdrop: backdropImage })
    const honesty = verifyProductUntouched(raw, scaledCutout, placement)
    if (!honesty.ok) throw new Rejection(changedNote(honesty.maxDiff))

    const body = await encodeComposite(raw)
    const compositeUrl = await step('The composite could not be saved.', () =>
      putObject(`composites/${imageId}-${backdrop}-${Date.now()}.webp`, body, 'image/webp'),
    )
    await update(imageId, { compositeUrl })
  } catch (err) {
    const reviewNote = err instanceof Rejection ? err.message : `The composite could not be made: ${messageOf(err)}`
    if (!(err instanceof Rejection)) console.error(`[photos] composite job failed for ${imageId}:`, err)
    try {
      await update(imageId, { reviewStatus: 'rejected', reviewNote })
    } catch (writeErr) {
      console.error(`[photos] could not record the composite failure for ${imageId}:`, writeErr)
    }
  }
}
