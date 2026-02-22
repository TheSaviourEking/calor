import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get audit logs (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (adminId) where.adminId = adminId
    if (action) where.action = action
    if (entity) where.entity = entity
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({ /* take: handled */
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.auditLog.count({ where })
    ])

    // Get unique values for filters
    const [actions, entities, admins] = await Promise.all([
      db.auditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { action: 'asc' }
      }),
      db.auditLog.groupBy({
        by: ['entity'],
        _count: { id: true },
        orderBy: { entity: 'asc' }
      }),
      db.auditLog.findMany({ take: 50,
        where: { adminId: { not: null } },
        select: { adminId: true, adminEmail: true },
        distinct: ['adminId']
      })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        actions: actions.map(a => ({ action: a.action, count: a._count.id })),
        entities: entities.map(e => ({ entity: e.entity, count: e._count.id })),
        admins: admins.filter(a => a.adminId).map(a => ({
          id: a.adminId,
          email: a.adminEmail
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    
    const { action, entity, entityId, changes, description, success, errorMessage } = body

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const log = await db.auditLog.create({
      data: {
        adminId: session?.customerId || null,
        adminEmail: session?.customerId 
          ? (await db.customer.findUnique({ 
              where: { id: session.customerId },
              select: { email: true }
            }))?.email 
          : null,
        action,
        entity,
        entityId,
        changes: changes ? JSON.stringify(changes) : null,
        description,
        ipAddress: ipAddress.toString(),
        userAgent,
        success: success ?? true,
        errorMessage
      }
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
