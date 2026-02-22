import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get ticket categories
export async function GET() {
  try {
    const categories = await db.supportTicketCategory.findMany({ take: 50,
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tickets: true } }
      }
    })

    // Auto-seed default categories if none exist
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Order Issues', slug: 'order-issues', description: 'Questions about orders, shipping, or delivery', iconName: 'package' },
        { name: 'Product Questions', slug: 'product-questions', description: 'Questions about products, sizing, or materials', iconName: 'help-circle' },
        { name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Return requests and refund inquiries', iconName: 'refresh-cw' },
        { name: 'Account Help', slug: 'account-help', description: 'Login, password, and account issues', iconName: 'user' },
        { name: 'Payment Issues', slug: 'payment-issues', description: 'Payment problems and billing questions', iconName: 'credit-card' },
        { name: 'General Inquiry', slug: 'general-inquiry', description: 'Other questions and feedback', iconName: 'message-square' }
      ]

      await db.supportTicketCategory.createMany({
        data: defaultCategories.map((cat, index) => ({
          ...cat,
          sortOrder: index,
          responseTimeHours: 24
        }))
      })

      const newCategories = await db.supportTicketCategory.findMany({ take: 50,
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      })

      return NextResponse.json({ categories: newCategories })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// Create/update category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await db.customer.findUnique({
      where: { id: session.customerId }
    })

    if (!customer?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, iconName, responseTimeHours, resolutionTimeHours, autoAssignToId, sortOrder } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const category = await db.supportTicketCategory.create({
      data: {
        name,
        slug,
        description,
        iconName,
        responseTimeHours,
        resolutionTimeHours,
        autoAssignToId,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
