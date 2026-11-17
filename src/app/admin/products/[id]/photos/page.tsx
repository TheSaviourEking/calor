import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getBackgroundRemover } from '@/lib/photos/background'
import PhotosClient from './PhotosClient'

export const dynamic = 'force-dynamic'

// The admin layout already restricts this page to admins
export default async function ProductPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      images: {
        take: 50,
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          url: true,
          altText: true,
          originalUrl: true,
          treatment: true,
          backdrop: true,
          reviewStatus: true,
          whiteBackground: true,
          compositeUrl: true,
          reviewNote: true,
        },
      },
    },
  })
  if (!product) notFound()

  return (
    <PhotosClient
      productId={product.id}
      productName={product.name}
      initialImages={product.images}
      canComposite={getBackgroundRemover() !== null}
    />
  )
}
