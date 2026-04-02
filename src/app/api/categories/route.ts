import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { requireAdmin } from '@/lib/admin/middleware'

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.customerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const categories = await db.category.findMany({
            orderBy: { sortOrder: 'asc' }
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const auth = await requireAdmin()
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 })
        }

        const { name, description, iconName, sortOrder } = await req.json()
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

        const category = await db.category.create({
            data: {
                name,
                slug,
                iconName: iconName || 'box',
                description: description || `Category for ${name}`,
                sortOrder: sortOrder ?? 0,
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
