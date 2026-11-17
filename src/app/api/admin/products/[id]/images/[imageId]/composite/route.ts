import { NextRequest, NextResponse, after } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminUser } from '@/lib/auth/guards'
import { getBackgroundRemover } from '@/lib/photos/background'
import { runCompositeJob } from '@/lib/photos/job'
import { isBackdrop } from '@/lib/photos/types'

type Params = { params: Promise<{ id: string; imageId: string }> }

// Start a calo. composite for one product photo. The job runs after the
// response; the admin approves or rejects the result on the photos page.
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdminUser()
  if (!auth.ok) return auth.response

  try {
    const { id, imageId } = await params
    const body = await request.json().catch(() => null)
    const backdrop: unknown = body?.backdrop
    if (!isBackdrop(backdrop)) {
      return NextResponse.json({ error: 'Choose a backdrop: satin, linen or blush.' }, { status: 400 })
    }

    if (!getBackgroundRemover()) {
      return NextResponse.json({ error: 'Background removal is not set up yet.' }, { status: 409 })
    }

    // Claim the image before scheduling, so two requests cannot start two jobs.
    // Clearing the old composite means nothing can approve it before the job starts.
    const claim = await db.productImage.updateMany({
      where: { id: imageId, productId: id, reviewStatus: { not: 'pending' } },
      data: { reviewStatus: 'pending', backdrop, compositeUrl: null, reviewNote: null },
    })
    if (claim.count === 0) {
      const exists = await db.productImage.findFirst({ where: { id: imageId, productId: id }, select: { id: true } })
      return exists
        ? NextResponse.json({ error: 'A composite is already being made for this photo.' }, { status: 409 })
        : NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    after(() => runCompositeJob(imageId, backdrop))
    return NextResponse.json({ status: 'pending' }, { status: 202 })
  } catch (error) {
    console.error('Composite request error:', error)
    return NextResponse.json({ error: 'Failed to start the composite' }, { status: 500 })
  }
}
