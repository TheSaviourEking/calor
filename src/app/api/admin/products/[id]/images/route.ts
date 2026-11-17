import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth/guards'
import { checkRateLimit } from '@/lib/rate-limit'
import { isStorageConfigured } from '@/lib/photos/storage'
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  ingestPhoto,
  InvalidImageError,
} from '@/lib/photos/ingest'

// Upload image for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser()
  if (!auth.ok) return auth.response

  // Shares the /api/upload budget: one limit per admin across both upload paths
  const limit = await checkRateLimit(`upload:${auth.customerId}`, { windowMs: 60_000, maxRequests: 60 })
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Try again in a minute.' }, { status: 429 })
  }

  try {
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: 'Image upload is not configured. R2 storage credentials are missing.' },
        { status: 503 }
      )
    }

    const { id } = await params
    // Before storing anything, so a bad id leaves no orphaned object
    const product = await db.product.findUnique({ where: { id }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const altText = formData.get('altText') as string || ''

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted types: ${ALLOWED_UPLOAD_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const photo = await ingestPhoto(Buffer.from(await file.arrayBuffer()), { studio: false })

    // Get current max sort order
    const existingImages = await db.productImage.findMany({ /* take: handled */
      where: { productId: id },
      orderBy: { sortOrder: 'desc' },
      take: 1,
    })

    const sortOrder = existingImages.length > 0 ? existingImages[0].sortOrder + 1 : 0

    // Create image record
    const image = await db.productImage.create({
      data: {
        productId: id,
        url: photo.url,
        originalUrl: photo.originalUrl,
        altText: altText || `Product image ${sortOrder + 1}`,
        sortOrder,
        treatment: photo.treatment,
        whiteBackground: photo.whiteBackground,
        width: photo.width,
        height: photo.height,
      },
    })

    return NextResponse.json({ image })
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

// Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const { id } = await params

    const images = await db.productImage.findMany({ take: 50,
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Image fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
