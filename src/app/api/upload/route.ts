import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@/lib/auth/session'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.customerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type not allowed. Accepted types: ${ALLOWED_MIME_TYPES.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Validate the file is actually an image using sharp metadata
        try {
            const metadata = await sharp(buffer).metadata()
            if (!metadata.width || !metadata.height) {
                return NextResponse.json(
                    { error: 'File does not appear to be a valid image.' },
                    { status: 400 }
                )
            }
        } catch {
            return NextResponse.json(
                { error: 'File does not appear to be a valid image.' },
                { status: 400 }
            )
        }

        // Validate R2 configuration
        const accountId = process.env.R2_ACCOUNT_ID
        const accessKeyId = process.env.R2_ACCESS_KEY_ID
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
        const bucketName = process.env.R2_BUCKET_NAME
        const publicUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`

        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
            return NextResponse.json(
                { error: 'Image upload is not configured. R2 storage credentials are missing.' },
                { status: 503 }
            )
        }

        const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        })

        const fileExtension = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExtension}`

        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
        }))

        // Ensure no trailing slash
        const formattedPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl

        return NextResponse.json({ success: true, url: `${formattedPublicUrl}/${fileName}` })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
