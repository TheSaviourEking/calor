import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth/guards'
import { reviewComposite, type ReviewDecision } from '@/lib/photos/job'

type Params = { params: Promise<{ id: string; imageId: string }> }

const isDecision = (v: unknown): v is ReviewDecision => v === 'approve' || v === 'reject'

// Approve a composite (it becomes the live photo) or reject it (the original returns)
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdminUser()
  if (!auth.ok) return auth.response

  try {
    const { id, imageId } = await params
    const body = await request.json().catch(() => null)
    const decision: unknown = body?.decision
    if (!isDecision(decision)) {
      return NextResponse.json({ error: 'Decision must be approve or reject.' }, { status: 400 })
    }

    const onProduct = await db.productImage.findFirst({ where: { id: imageId, productId: id }, select: { id: true } })
    if (!onProduct) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

    const result = await reviewComposite(imageId, decision)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ image: result.image })
  } catch (error) {
    console.error('Composite review error:', error)
    return NextResponse.json({ error: 'Failed to review the composite' }, { status: 500 })
  }
}
