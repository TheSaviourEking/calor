import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/auth/guards'
import { checkRateLimit } from '@/lib/rate-limit'
import { isStorageConfigured } from '@/lib/photos/storage'
import { ingestPhoto, InvalidImageError } from '@/lib/photos/ingest'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// Admin-only product photo upload. Stores the original under originals/ and
// returns how the storefront should treat it.
export async function POST(req: NextRequest) {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

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

        const formData = await req.formData()
        const file = formData.get('file')
        const studio = formData.get('studio') === 'true'

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type not allowed. Accepted types: ${ALLOWED_MIME_TYPES.join(', ')}` },
                { status: 400 }
            )
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const photo = await ingestPhoto(buffer, { studio })

        return NextResponse.json(photo)
    } catch (error) {
        if (error instanceof InvalidImageError) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
