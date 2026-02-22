import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { adminApiHandler } from '@/lib/admin/middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return adminApiHandler(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()

      const updateData: Record<string, unknown> = {}

      if (typeof body.isAdmin === 'boolean') {
        updateData.isAdmin = body.isAdmin
      }

      const customer = await db.customer.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ customer })
    } catch (error) {
      console.error('Customer update error:', error)
      return NextResponse.json(
        { error: 'Failed to update customer' },
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
      const customer = await db.customer.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          addresses: true,
          loyaltyAccount: {
            include: {
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      return NextResponse.json({ customer })
    } catch (error) {
      console.error('Customer fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      )
    }
  })
}
