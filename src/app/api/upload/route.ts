import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@/lib/auth/session'
import { v4 as uuidv4 } from 'uuid'

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

        // Validate R2 configuration
        const accountId = process.env.R2_ACCOUNT_ID
        const accessKeyId = process.env.R2_ACCESS_KEY_ID
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
        const bucketName = process.env.R2_BUCKET_NAME
        const publicUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`

        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
            console.warn("R2 credentials missing, returning mock URL for development.")
            // Return a mock URL if R2 isn't configured so local dev doesn't totally break
            return NextResponse.json({
                success: true,
                url: `https://mock-r2-url.local/${uuidv4()}-${file.name}`
            })
        }

        const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

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
