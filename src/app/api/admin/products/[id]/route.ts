import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'
import { checkAndSendStockAlerts } from '@/lib/stock-alerts'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return adminApiHandler(request, async () => {

    try {
      const { id } = await params
      const body = await request.json()

      // Get old product to check inventory changes
      const oldProduct = await db.product.findUnique({
        where: { id },
        include: { variants: true },
      })

      const product = await db.product.update({
        where: { id },
        data: body,
        include: {
          category: true,
          variants: true,
        },
      })

      // Check if inventory was updated from out of stock to in stock
      const wasOutOfStock = !oldProduct || oldProduct.inventoryCount <= 0
      const isNowInStock = product.inventoryCount > 0

      // Also check if any variant came back in stock
      const variantWasOutOfStock = oldProduct?.variants.some(v => v.stock <= 0) || false
      const variantIsNowInStock = product.variants.some(v => v.stock > 0)

      // Trigger stock alerts if product came back in stock
      if ((wasOutOfStock && isNowInStock) || (variantWasOutOfStock && variantIsNowInStock)) {
        // Run in background - don't wait for it
        checkAndSendStockAlerts(id).catch(err => {
          console.error('Error sending stock alerts:', err)
        })
      }

      return NextResponse.json({ product })
    } catch (error) {
      console.error('Product update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return adminApiHandler(request, async () => {

    try {
      const { id } = await params

      // Check if product has orders
      const orderItems = await db.orderItem.count({
        where: { productId: id },
      })

      if (orderItems > 0) {
        // Soft delete by unpublishing
        await db.product.update({
          where: { id },
          data: { published: false },
        })
        return NextResponse.json({
          success: true,
          message: 'Product has orders and was unpublished instead of deleted'
        })
      }

      // Hard delete if no orders
      await db.product.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Product delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return adminApiHandler(request, async () => {

    try {
      const { id } = await params
      const product = await db.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
          images: true,
        },
      })

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ product })
    } catch (error) {
      console.error('Product fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }
  })
}
