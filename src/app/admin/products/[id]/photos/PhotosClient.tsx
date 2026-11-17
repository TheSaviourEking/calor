'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ProductPhoto from '@/components/product/ProductPhoto'
import { BACKDROPS, isPhotoTreatment, type Backdrop, type PhotoTreatment } from '@/lib/photos/types'

export interface PhotoRow {
  id: string
  url: string
  altText: string
  originalUrl: string | null
  treatment: string
  backdrop: string | null
  reviewStatus: string
  whiteBackground: boolean
  compositeUrl: string | null
  reviewNote: string | null
}

interface PhotosClientProps {
  productId: string
  productName: string
  initialImages: PhotoRow[]
  canComposite: boolean
}

const POLL_MS = 3000

const TREATMENT_LABEL: Record<PhotoTreatment, string> = {
  original: 'Original',
  blend: 'Blended',
  composite: 'calo. composite',
}

const BACKDROP_LABEL: Record<Backdrop, string> = { satin: 'Satin', linen: 'Linen', blush: 'Blush' }

const LABEL = 'font-body text-warm-gray text-[10px] uppercase tracking-wider'
const PRIMARY =
  'px-4 py-2 bg-charcoal text-cream font-body text-xs uppercase tracking-wider hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
const SECONDARY =
  'px-4 py-2 border border-sand font-body text-xs uppercase tracking-wider text-charcoal hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const treatmentOf = (value: string): PhotoTreatment => (isPhotoTreatment(value) ? value : 'original')

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

export default function PhotosClient({ productId, productName, initialImages, canComposite }: PhotosClientProps) {
  const [images, setImages] = useState<PhotoRow[]>(initialImages)
  const anyPending = images.some((image) => image.reviewStatus === 'pending')

  // Refresh while any composite is being made; stops once nothing is pending
  useEffect(() => {
    if (!anyPending) return
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/images`, { cache: 'no-store' })
        if (!res.ok) return
        const { images: fresh } = (await res.json()) as { images: PhotoRow[] }
        setImages(fresh)
      } catch {
        // Try again on the next tick
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [anyPending, productId])

  const replace = (image: PhotoRow) => setImages((rows) => rows.map((row) => (row.id === image.id ? image : row)))

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 font-body text-warm-gray text-xs hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Products
        </Link>
        <h1 className="font-display text-charcoal text-2xl mt-2" style={{ fontWeight: 400 }}>
          {productName} — photos
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          A calo. composite only changes the background. It goes live once you approve it.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="font-body text-warm-gray text-sm bg-warm-white border border-sand p-6">
          This product has no photos yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {images.map((image) => (
            <PhotoRowItem
              key={image.id}
              productId={productId}
              image={image}
              canComposite={canComposite}
              onChange={replace}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface PhotoRowItemProps {
  productId: string
  image: PhotoRow
  canComposite: boolean
  onChange: (image: PhotoRow) => void
}

function PhotoRowItem({ productId, image, canComposite, onChange }: PhotoRowItemProps) {
  const [backdrop, setBackdrop] = useState<Backdrop>('satin')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const base = `/api/admin/products/${productId}/images/${image.id}`
  const pending = image.reviewStatus === 'pending'
  const making = pending && !image.compositeUrl
  const awaitingReview = pending && !!image.compositeUrl
  const liveComposite = image.reviewStatus === 'approved' && image.treatment === 'composite'

  async function createComposite() {
    setBusy(true)
    setError(null)
    try {
      const { ok, data } = await postJson(`${base}/composite`, { backdrop })
      if (!ok) {
        setError(typeof data.error === 'string' ? data.error : 'The composite could not be started.')
        return
      }
      onChange({ ...image, reviewStatus: 'pending', backdrop, compositeUrl: null, reviewNote: null })
    } catch {
      setError('The composite could not be started.')
    } finally {
      setBusy(false)
    }
  }

  async function review(decision: 'approve' | 'reject') {
    setBusy(true)
    setError(null)
    try {
      const { ok, data } = await postJson(`${base}/review`, { decision })
      if (!ok) {
        setError(typeof data.error === 'string' ? data.error : 'The review could not be saved.')
        return
      }
      onChange(data.image as PhotoRow)
    } catch {
      setError('The review could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="bg-warm-white border border-sand p-6 flex flex-col lg:flex-row gap-6">
      <div className="flex-shrink-0 space-y-2">
        <p className={LABEL}>Live photo</p>
        <div className="relative w-36 h-36">
          <ProductPhoto src={image.url} alt={image.altText} treatment={treatmentOf(image.treatment)} aspect="fill" sizes="144px" />
        </div>
        <p className={LABEL}>{TREATMENT_LABEL[treatmentOf(image.treatment)]}</p>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {image.compositeUrl && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <figure className="space-y-2">
                <figcaption className={LABEL}>Original</figcaption>
                <div className="relative aspect-square">
                  <ProductPhoto
                    src={image.originalUrl ?? image.url}
                    alt={`${image.altText} (original)`}
                    treatment={image.whiteBackground ? 'blend' : 'original'}
                    aspect="fill"
                    sizes="224px"
                  />
                </div>
              </figure>
              <figure className="space-y-2">
                <figcaption className={LABEL}>
                  Composite{image.backdrop ? ` · ${BACKDROP_LABEL[image.backdrop as Backdrop] ?? image.backdrop}` : ''}
                </figcaption>
                <div className="relative aspect-square">
                  <ProductPhoto
                    src={image.compositeUrl}
                    alt={`${image.altText} (calo. composite)`}
                    treatment="composite"
                    aspect="fill"
                    sizes="224px"
                  />
                </div>
              </figure>
            </div>
            <div className="flex gap-3">
              {awaitingReview && (
                <button type="button" onClick={() => review('approve')} disabled={busy} className={PRIMARY}>
                  Approve
                </button>
              )}
              {(awaitingReview || liveComposite) && (
                <button type="button" onClick={() => review('reject')} disabled={busy} className={SECONDARY}>
                  Reject
                </button>
              )}
            </div>
          </div>
        )}

        {making && (
          <p className="font-body text-warm-gray text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Making the calo. composite…
          </p>
        )}

        {image.reviewStatus === 'rejected' && image.reviewNote && (
          <p className="font-body text-terracotta text-sm">{image.reviewNote}</p>
        )}

        <div className="space-y-2">
          <p className={LABEL}>Backdrop</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-sand" role="radiogroup" aria-label="Backdrop">
              {BACKDROPS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={backdrop === option}
                  onClick={() => setBackdrop(option)}
                  className={`px-3 py-2 font-body text-xs uppercase tracking-wider transition-colors ${
                    backdrop === option ? 'bg-sand text-charcoal' : 'text-warm-gray hover:bg-cream'
                  }`}
                >
                  {BACKDROP_LABEL[option]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={createComposite}
              disabled={!canComposite || pending || busy}
              className={PRIMARY}
            >
              Create calo. composite
            </button>
          </div>
          {!canComposite && <p className="font-body text-warm-gray text-xs">Background removal is not set up yet.</p>}
        </div>

        {error && <p className="font-body text-terracotta text-sm">{error}</p>}
      </div>
    </li>
  )
}
