import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/rfm - Get RFM overview and statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'calculate') {
      return calculateRFM()
    }

    if (action === 'segments') {
      return getSegmentDistribution()
    }

    // Default: return RFM overview
    return getRFMOverview()
  } catch (error) {
    console.error('RFM API error:', error)
    return NextResponse.json({ error: 'Failed to process RFM request' }, { status: 500 })
  }
}

// POST /api/admin/rfm - Run RFM calculation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'calculate') {
      return calculateRFM()
    }

    if (action === 'seed-segments') {
      return seedDefaultSegments()
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('RFM calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate RFM' }, { status: 500 })
  }
}

// Calculate RFM scores for all customers
async function calculateRFM() {
  const now = new Date()
  
  // Get all customers with their orders
  const customers = await db.customer.findMany({ take: 50,
    where: {
      isAdmin: false,
    },
    include: {
      orders: {
        where: {
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        select: {
          totalCents: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (customers.length === 0) {
    return NextResponse.json({ 
      message: 'No customers to analyze',
      calculated: 0 
    })
  }

  // Calculate raw values for each customer
  const customerMetrics = customers.map(customer => {
    const orders = customer.orders
    const totalOrders = orders.length
    const totalSpentCents = orders.reduce((sum, o) => sum + o.totalCents, 0)
    const avgOrderCents = totalOrders > 0 ? Math.round(totalSpentCents / totalOrders) : 0
    
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : 9999 // Never ordered

    return {
      customerId: customer.id,
      daysSinceLastOrder,
      totalOrders,
      totalSpentCents,
      avgOrderCents,
    }
  })

  // Calculate percentiles for scoring
  const recencyValues = customerMetrics.map(c => c.daysSinceLastOrder).sort((a, b) => a - b)
  const frequencyValues = customerMetrics.map(c => c.totalOrders).sort((a, b) => a - b)
  const monetaryValues = customerMetrics.map(c => c.totalSpentCents).sort((a, b) => a - b)

  const getPercentile = (sortedArray: number[], value: number) => {
    const index = sortedArray.indexOf(value)
    return sortedArray.length > 1 ? index / (sortedArray.length - 1) : 0
  }

  const getScore = (percentile: number) => {
    if (percentile >= 0.8) return 5
    if (percentile >= 0.6) return 4
    if (percentile >= 0.4) return 3
    if (percentile >= 0.2) return 2
    return 1
  }

  // Calculate RFM scores for each customer
  let calculated = 0
  for (const metrics of customerMetrics) {
    const recencyPercentile = getPercentile(recencyValues, metrics.daysSinceLastOrder)
    const frequencyPercentile = getPercentile(frequencyValues, metrics.totalOrders)
    const monetaryPercentile = getPercentile(monetaryValues, metrics.totalSpentCents)

    // Invert recency percentile (lower days = better = higher score)
    const recencyScore = getScore(1 - recencyPercentile)
    const frequencyScore = getScore(frequencyPercentile)
    const monetaryScore = getScore(monetaryPercentile)

    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`

    // Determine lifecycle stage
    const lifecycleStage = determineLifecycleStage(recencyScore, frequencyScore, monetaryScore, metrics.daysSinceLastOrder)

    // Calculate churn risk
    const churnRisk = calculateChurnRisk(recencyScore, frequencyScore, metrics.daysSinceLastOrder)

    // Predict LTV (simple model)
    const predictedLTV = Math.round(metrics.totalSpentCents * (1 + (frequencyScore * 0.2)))

    // Upsert RFM metrics
    await db.customerRFM.upsert({
      where: { customerId: metrics.customerId },
      create: {
        customerId: metrics.customerId,
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore,
        daysSinceLastOrder: metrics.daysSinceLastOrder,
        totalOrders: metrics.totalOrders,
        totalSpentCents: metrics.totalSpentCents,
        avgOrderCents: metrics.avgOrderCents,
        recencyPercentile: 1 - recencyPercentile,
        frequencyPercentile,
        monetaryPercentile,
        lifecycleStage,
        churnRisk,
        predictedLTV,
        calculatedAt: now,
      },
      update: {
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore,
        daysSinceLastOrder: metrics.daysSinceLastOrder,
        totalOrders: metrics.totalOrders,
        totalSpentCents: metrics.totalSpentCents,
        avgOrderCents: metrics.avgOrderCents,
        recencyPercentile: 1 - recencyPercentile,
        frequencyPercentile,
        monetaryPercentile,
        lifecycleStage,
        churnRisk,
        predictedLTV,
        calculatedAt: now,
      }
    })

    calculated++
  }

  // Assign customers to segments
  await assignCustomersToSegments()

  return NextResponse.json({
    message: 'RFM calculation completed',
    calculated,
    timestamp: now.toISOString(),
  })
}

function determineLifecycleStage(r: number, f: number, m: number, daysSince: number): string {
  // Champion: Recent, frequent, high spender
  if (r >= 4 && f >= 4 && m >= 4) return 'champion'
  
  // Loyal Customer: Frequent buyers
  if (f >= 4 && m >= 3) return 'active'
  
  // Potential Loyalist: Recent, moderate frequency
  if (r >= 4 && f >= 2 && f <= 3) return 'active'
  
  // New Customer: Very recent, low frequency
  if (r >= 4 && f <= 2) return 'new'
  
  // At Risk: Haven't purchased recently
  if (r <= 2 && f >= 3) return 'at_risk'
  
  // Can't Lose Them: High value but at risk
  if (r <= 2 && f >= 4 && m >= 4) return 'at_risk'
  
  // Hibernating: Low recency and frequency
  if (r <= 2 && f <= 2) return 'churned'
  
  // Lost: Very long since last purchase
  if (daysSince > 365) return 'lost'
  
  return 'active'
}

function calculateChurnRisk(r: number, f: number, daysSince: number): number {
  // Base risk from recency score (lower score = higher risk)
  let risk = (5 - r) * 0.15
  
  // Add risk from inactivity
  if (daysSince > 90) risk += 0.2
  if (daysSince > 180) risk += 0.2
  if (daysSince > 365) risk += 0.3
  
  // Reduce risk for loyal customers
  if (f >= 4) risk -= 0.15
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, risk))
}

async function assignCustomersToSegments() {
  // Get all active segments
  const segments = await db.customerSegment.findMany({ take: 50,
    where: { isActive: true },
    orderBy: { priority: 'asc' }
  })

  // Get all customer RFM data
  const customerRFMs = await db.customerRFM.findMany({ take: 50,
    include: {
      customer: {
        select: { id: true }
      }
    }
  })

  // Clear existing segment memberships
  await db.segmentMember.deleteMany({})

  // Assign each customer to the best matching segment
  for (const rfm of customerRFMs) {
    const matchingSegment = segments.find(segment => {
      // Check RFM ranges
      if (segment.recencyMin !== null && rfm.daysSinceLastOrder < segment.recencyMin) return false
      if (segment.recencyMax !== null && rfm.daysSinceLastOrder > segment.recencyMax) return false
      if (segment.frequencyMin !== null && rfm.totalOrders < segment.frequencyMin) return false
      if (segment.frequencyMax !== null && rfm.totalOrders > segment.frequencyMax) return false
      if (segment.monetaryMin !== null && rfm.totalSpentCents < segment.monetaryMin) return false
      if (segment.monetaryMax !== null && rfm.totalSpentCents > segment.monetaryMax) return false
      return true
    })

    if (matchingSegment) {
      await db.segmentMember.create({
        data: {
          segmentId: matchingSegment.id,
          customerId: rfm.customerId,
          recencyScore: rfm.recencyScore,
          frequencyScore: rfm.frequencyScore,
          monetaryScore: rfm.monetaryScore,
          rfmScore: rfm.rfmScore,
          daysSinceLastOrder: rfm.daysSinceLastOrder,
          totalOrders: rfm.totalOrders,
          totalSpentCents: rfm.totalSpentCents,
          avgOrderCents: rfm.avgOrderCents,
        }
      })
    }
  }

  // Update segment stats
  for (const segment of segments) {
    const members = await db.segmentMember.findMany({ take: 50,
      where: { segmentId: segment.id }
    })
    
    const totalRevenue = members.reduce((sum, m) => sum + m.totalSpentCents, 0)
    const avgOrder = members.length > 0 
      ? Math.round(members.reduce((sum, m) => sum + m.avgOrderCents, 0) / members.length)
      : 0

    await db.customerSegment.update({
      where: { id: segment.id },
      data: {
        customerCount: members.length,
        totalRevenue,
        avgOrderValue: avgOrder,
      }
    })
  }
}

async function seedDefaultSegments() {
  const defaultSegments = [
    {
      slug: 'champions',
      name: 'Champions',
      description: 'Best customers - recent, frequent, high spenders',
      recencyMin: 0,
      recencyMax: 30,
      frequencyMin: 4,
      frequencyMax: null,
      monetaryMin: 10000,
      monetaryMax: null,
      type: 'rfm',
      color: 'gold',
      iconName: 'Trophy',
      priority: 1,
      suggestedActions: JSON.stringify([
        'Reward with exclusive early access',
        'Request reviews and referrals',
        'VIP treatment and personal outreach'
      ])
    },
    {
      slug: 'loyal-customers',
      name: 'Loyal Customers',
      description: 'Consistent buyers with good spending',
      recencyMin: 0,
      recencyMax: 60,
      frequencyMin: 3,
      frequencyMax: null,
      monetaryMin: 5000,
      monetaryMax: null,
      type: 'rfm',
      color: 'sage',
      iconName: 'Heart',
      priority: 2,
      suggestedActions: JSON.stringify([
        'Loyalty program enrollment',
        'Cross-sell related products',
        'Personalized recommendations'
      ])
    },
    {
      slug: 'potential-loyalists',
      name: 'Potential Loyalists',
      description: 'Recent customers with potential to become loyal',
      recencyMin: 0,
      recencyMax: 45,
      frequencyMin: 1,
      frequencyMax: 2,
      monetaryMin: 0,
      monetaryMax: null,
      type: 'rfm',
      color: 'terracotta',
      iconName: 'UserPlus',
      priority: 3,
      suggestedActions: JSON.stringify([
        'Onboarding email series',
        'Membership benefits intro',
        'Engagement incentives'
      ])
    },
    {
      slug: 'at-risk',
      name: 'At Risk',
      description: 'Previously active customers who haven\'t purchased recently',
      recencyMin: 60,
      recencyMax: 180,
      frequencyMin: 2,
      frequencyMax: null,
      monetaryMin: 0,
      monetaryMax: null,
      type: 'rfm',
      color: 'ember',
      iconName: 'AlertTriangle',
      priority: 4,
      suggestedActions: JSON.stringify([
        'Win-back email campaign',
        'Special re-engagement offer',
        'Survey to understand needs'
      ])
    },
    {
      slug: 'hibernating',
      name: 'Hibernating',
      description: 'Low engagement customers',
      recencyMin: 90,
      recencyMax: 365,
      frequencyMin: 0,
      frequencyMax: 2,
      monetaryMin: 0,
      monetaryMax: null,
      type: 'rfm',
      color: 'warm-gray',
      iconName: 'Moon',
      priority: 5,
      suggestedActions: JSON.stringify([
        'Aggressive discount offers',
        'Product education content',
        'Last-chance re-engagement'
      ])
    },
    {
      slug: 'lost',
      name: 'Lost',
      description: 'Customers who haven\'t purchased in over a year',
      recencyMin: 365,
      recencyMax: null,
      frequencyMin: 0,
      frequencyMax: null,
      monetaryMin: 0,
      monetaryMax: null,
      type: 'rfm',
      color: 'charcoal',
      iconName: 'UserX',
      priority: 6,
      suggestedActions: JSON.stringify([
        'Final re-engagement attempt',
        'Remove from active marketing',
        'Archive for future analysis'
      ])
    }
  ]

  let created = 0
  for (const segment of defaultSegments) {
    await db.customerSegment.upsert({
      where: { slug: segment.slug },
      create: segment,
      update: segment
    })
    created++
  }

  return NextResponse.json({
    message: 'Default segments seeded',
    created
  })
}

async function getRFMOverview() {
  // Get overall stats
  const totalCustomers = await db.customer.count({
    where: { isAdmin: false }
  })

  const customersWithRFM = await db.customerRFM.count()

  const avgScores = await db.customerRFM.aggregate({
    _avg: {
      recencyScore: true,
      frequencyScore: true,
      monetaryScore: true,
      churnRisk: true,
      predictedLTV: true,
    }
  })

  const lifecycleDistribution = await db.customerRFM.groupBy({
    by: ['lifecycleStage'],
    _count: { id: true }
  })

  const segments = await db.customerSegment.findMany({ take: 50,
    where: { isActive: true },
    orderBy: { priority: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      color: true,
      iconName: true,
      customerCount: true,
      totalRevenue: true,
      avgOrderValue: true,
    }
  })

  return NextResponse.json({
    overview: {
      totalCustomers,
      analyzedCustomers: customersWithRFM,
      avgScores: {
        recency: avgScores._avg.recencyScore || 0,
        frequency: avgScores._avg.frequencyScore || 0,
        monetary: avgScores._avg.monetaryScore || 0,
      },
      avgChurnRisk: avgScores._avg.churnRisk || 0,
      avgPredictedLTV: avgScores._avg.predictedLTV || 0,
    },
    lifecycleDistribution: lifecycleDistribution.map(l => ({
      stage: l.lifecycleStage,
      count: l._count.id
    })),
    segments,
  })
}

async function getSegmentDistribution() {
  const distribution = await db.customerRFM.groupBy({
    by: ['rfmScore'],
    _count: { id: true },
    _avg: {
      totalSpentCents: true,
      churnRisk: true,
    }
  })

  return NextResponse.json({
    distribution: distribution.map(d => ({
      score: d.rfmScore,
      count: d._count.id,
      avgSpent: d._avg.totalSpentCents || 0,
      avgChurnRisk: d._avg.churnRisk || 0,
    }))
  })
}
