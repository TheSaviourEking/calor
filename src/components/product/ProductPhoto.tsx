import Image from 'next/image'
import type { PhotoTreatment } from '@/lib/photos/types'
import { isOptimizableSrc } from '@/lib/photos/image-hosts'

type ProductPhotoProps = {
  src: string | null | undefined
  alt: string
  treatment?: PhotoTreatment | null
  aspect?: 'square' | 'portrait' | 'fill'
  sizes?: string
  priority?: boolean
  className?: string
}

const ASPECT_CLASS = {
  square: 'relative aspect-square',
  portrait: 'relative aspect-[3/4]',
  fill: 'absolute inset-0',
} as const

export default function ProductPhoto({
  src,
  alt,
  treatment,
  aspect = 'square',
  sizes,
  priority,
  className,
}: ProductPhotoProps) {
  const tileClass = [
    'overflow-hidden bg-sand [container-type:size]',
    ASPECT_CLASS[aspect],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={tileClass} data-treatment={treatment ?? 'original'}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!isOptimizableSrc(src)}
          className={`object-contain${treatment === 'blend' ? ' mix-blend-multiply' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display text-charcoal/10 leading-none"
            style={{ fontWeight: 300, fontSize: 'min(50cqw, 50cqh, 6rem)' }}
          >
            {alt.charAt(0)}
          </span>
        </div>
      )}
    </div>
  )
}
