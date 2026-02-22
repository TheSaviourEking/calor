import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.productImage.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

// Update image order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { sortOrder, altText } = body

    const image = await db.productImage.update({
      where: { id },
      data: {
        ...(sortOrder !== undefined && { sortOrder }),
        ...(altText !== undefined && { altText }),
      },
    })

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Image update error:', error)
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    )
  }
}
