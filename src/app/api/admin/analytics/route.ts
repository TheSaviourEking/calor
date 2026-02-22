import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Get analytics data for admin dashboard
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
    const period = searchParams.get('period') || '30d'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    let dateFilter: Date
    const now = new Date()
    
    switch (period) {
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    if (startDate) {
      dateFilter = new Date(startDate)
    }

    // Fetch metrics
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      newCustomers,
      totalProducts,
      publishedProducts,
      pendingReviews,
      openTickets,
      recentOrders,
      topProducts,
      ordersByStatus
    ] = await Promise.all([
      // Total orders in period
      db.order.count({
        where: { createdAt: { gte: dateFilter } }
      }),

      // Total revenue in period
      db.order.aggregate({
        where: { 
          createdAt: { gte: dateFilter },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        _sum: { totalCents: true }
      }),

      // Total customers
      db.customer.count(),

      // New customers in period
      db.customer.count({
        where: { createdAt: { gte: dateFilter } }
      }),

      // Total products
      db.product.count(),

      // Published products
      db.product.count({
        where: { published: true }
      }),

      // Pending reviews
      db.review.count({
        where: { isApproved: false }
      }),

      // Open support tickets
      db.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } }
      }),

      // Recent orders
      db.order.findMany({ /* take: handled */
        where: { createdAt: { gte: dateFilter } },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { name: true, quantity: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Top selling products
      db.orderItem.groupBy({
        by: ['productId', 'name'],
        where: {
          order: { createdAt: { gte: dateFilter } }
        },
        _sum: { quantity: true, priceCents: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      }),

      // Orders by status
      db.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: dateFilter } },
        _count: { id: true }
      })
    ])

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 
      ? Math.round((totalRevenue._sum.totalCents || 0) / totalOrders) 
      : 0

    // Calculate conversion rate (simplified)
    const pageViews = await db.productView.count({
      where: { viewedAt: { gte: dateFilter } }
    })
    
    const conversionRate = pageViews > 0 
      ? ((totalOrders / pageViews) * 100).toFixed(2)
      : '0'

    // Get sales by day using raw query
    const salesByDay = await db.$queryRaw<Array<{ date: string; total: bigint; count: bigint }>>`
      SELECT 
        date(createdAt) as date,
        SUM(totalCents) as total,
        COUNT(*) as count
      FROM "Order"
      WHERE createdAt >= datetime('now', '-30 days')
        AND status != 'CANCELLED'
        AND status != 'REFUNDED'
      GROUP BY date(createdAt)
      ORDER BY date DESC
    `

    return NextResponse.json({
      period,
      dateRange: {
        start: dateFilter,
        end: now
      },
      metrics: {
        orders: {
          total: totalOrders,
          revenue: totalRevenue._sum.totalCents || 0,
          averageValue: avgOrderValue
        },
        customers: {
          total: totalCustomers,
          new: newCustomers
        },
        products: {
          total: totalProducts,
          published: publishedProducts
        },
        reviews: {
          pending: pendingReviews
        },
        support: {
          openTickets: openTickets
        },
        conversion: {
          pageViews,
          conversionRate,
          ordersByStatus: ordersByStatus.map(s => ({
            status: s.status,
            count: s._count.id
          }))
        }
      },
      charts: {
        salesByDay: salesByDay.map(day => ({
          date: day.date,
          total: Number(day.total),
          count: Number(day.count)
        }))
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        reference: order.reference,
        customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest',
        email: order.customer?.email || order.guestEmail,
        total: order.totalCents,
        status: order.status,
        items: order.items.length,
        createdAt: order.createdAt
      })),
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: p._sum.quantity || 0,
        revenue: p._sum.priceCents || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
