// Subscription plans API - Phase 2 feature
// Updated: Force recompilation for Prisma client sync
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({ take: 50,
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    })

    // If no plans exist, seed default plans
    if (plans.length === 0) {
      const defaultPlans = [
        {
          slug: "discovery-box",
          name: "Discovery Box",
          description: "Perfect for those beginning their wellness journey. Each month, receive a curated selection of beginner-friendly products designed to help you explore safely and comfortably.",
          shortDescription: "Start your exploration with beginner-friendly essentials",
          priceCents: 4900, // $49/month
          interval: "monthly",
          intervalCount: 1,
          features: JSON.stringify([
            "3-4 curated products monthly",
            "Beginner-friendly selections",
            "Educational content included",
            "Discreet packaging",
            "Cancel anytime",
            "Loyalty points on every box"
          ]),
          boxContents: JSON.stringify([
            "Massage oil or candle",
            "Beginner-safe accessories",
            "Premium lubricant sample",
            "Educational guide"
          ]),
          sortOrder: 1
        },
        {
          slug: "intimacy-box",
          name: "Intimacy Box",
          description: "Our most popular subscription! Receive a thoughtfully curated collection of premium products each month, perfect for solo or partner exploration.",
          shortDescription: "Our bestselling monthly curation of premium products",
          priceCents: 7900, // $79/month
          interval: "monthly",
          intervalCount: 1,
          features: JSON.stringify([
            "5-6 premium products monthly",
            "Value worth $120+",
            "Mix of wellness & pleasure items",
            "Exclusive subscriber products",
            "Priority access to new releases",
            "Double loyalty points",
            "Free shipping"
          ]),
          boxContents: JSON.stringify([
            "Premium massager or accessory",
            "Luxury lubricant",
            "Intimacy enhancement products",
            "Body care items",
            "Surprise exclusive item"
          ]),
          sortOrder: 2
        },
        {
          slug: "couples-box",
          name: "Couples Box",
          description: "Designed for partners to explore together. Each box contains items carefully selected to enhance connection and shared experiences.",
          shortDescription: "Curated for couples to explore together",
          priceCents: 9900, // $99/month
          interval: "monthly",
          intervalCount: 1,
          features: JSON.stringify([
            "5-7 couple-focused products",
            "Value worth $150+",
            "Partner activity guides",
            "His & hers selections",
            "Exclusive couples products",
            "Priority customer support",
            "Free shipping"
          ]),
          boxContents: JSON.stringify([
            "Couples toy or game",
            "Massage essentials",
            "Mood-setting items",
            "Communication cards",
            "Shared experience accessories"
          ]),
          sortOrder: 3
        },
        {
          slug: "luxury-box",
          name: "Luxury Box",
          description: "The ultimate indulgence for connoisseurs. Experience the finest products from top brands, with exclusive items not available elsewhere.",
          shortDescription: "Premium curation for the discerning enthusiast",
          priceCents: 14900, // $149/month
          interval: "monthly",
          intervalCount: 1,
          features: JSON.stringify([
            "6-8 luxury products",
            "Value worth $250+",
            "Exclusive designer items",
            "Personal concierge service",
            "First access to limited editions",
            "Triple loyalty points",
            "Complimentary gift wrapping",
            "Free express shipping"
          ]),
          boxContents: JSON.stringify([
            "Designer toy or device",
            "Premium wellness products",
            "Luxury skincare",
            "Exclusive collaborations",
            "Personalized recommendations"
          ]),
          sortOrder: 4
        },
        {
          slug: "quarterly-box",
          name: "Quarterly Box",
          description: "Receive a larger curated collection every three months. Perfect for those who prefer less frequent deliveries with more products.",
          shortDescription: "Seasonal curation delivered every 3 months",
          priceCents: 19900, // $199/quarter
          interval: "quarterly",
          intervalCount: 3,
          features: JSON.stringify([
            "10-12 premium products",
            "Value worth $300+",
            "Seasonal themes",
            "Full-size products",
            "Exclusive quarterly releases",
            "Double loyalty points",
            "Free shipping"
          ]),
          boxContents: JSON.stringify([
            "Seasonal curated selection",
            "Full-size wellness products",
            "Exclusive items",
            "Seasonal theme items",
            "Educational content"
          ]),
          sortOrder: 5
        }
      ]

      for (const plan of defaultPlans) {
        await db.subscriptionPlan.create({ data: plan })
      }

      const seededPlans = await db.subscriptionPlan.findMany({ take: 50,
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { subscriptions: true }
          }
        }
      })

      return NextResponse.json({ plans: seededPlans })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
