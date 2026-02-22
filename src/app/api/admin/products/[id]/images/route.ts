import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin/middleware'

// Upload image for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const altText = formData.get('altText') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to base64 for storage (in production, use cloud storage)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

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
        url: dataUrl,
        altText: altText || `Product image ${sortOrder + 1}`,
        sortOrder,
      },
    })

    return NextResponse.json({ image })
  } catch (error) {
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
