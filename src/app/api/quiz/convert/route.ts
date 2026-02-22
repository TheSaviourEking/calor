import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, productIds } = await request.json()

    if (!sessionId || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Find the quiz result
    const quizResult = await db.quizResult.findUnique({
      where: { sessionId }
    })

    if (!quizResult) {
      return NextResponse.json({ error: 'Quiz result not found' }, { status: 404 })
    }

    // Mark as converted
    await db.quizResult.update({
      where: { id: quizResult.id },
      data: { convertedToCart: true }
    })

    // Update product purchase intent count
    for (const productId of productIds) {
      await db.product.update({
        where: { id: productId },
        data: {
          purchaseCount: { increment: 1 }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz conversion tracked'
    })
  } catch (error) {
    console.error('Quiz conversion error:', error)
    return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 })
  }
}
