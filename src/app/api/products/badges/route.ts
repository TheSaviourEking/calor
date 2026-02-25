import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.customerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get unique badges from existing products
        const products = await db.product.findMany({
            where: {
                badge: { not: null }
            },
            select: {
                badge: true
            },
            distinct: ['badge']
        })

        const defaultBadges = ['bestseller', 'new', 'sale', 'limited edition', 'editors-pick']
        const existingBadges = products.map(p => p.badge as string)

        // Combine, unique, and sort
        const allBadges = Array.from(new Set([...defaultBadges, ...existingBadges]))
            .sort((a, b) => a.localeCompare(b))

        return NextResponse.json(allBadges)
    } catch (error) {
        console.error('Error fetching badges:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
