// Consultants API - Virtual consultations feature (Phase 2)
// Updated: Force recompilation for Prisma client sync
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consultantId = searchParams.get('id')

    if (consultantId) {
      const consultant = await db.consultant.findUnique({
        where: { id: consultantId },
        include: {
          availability: true,
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              booking: {
                select: { type: true }
              }
            }
          }
        }
      })

      if (!consultant) {
        return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
      }

      return NextResponse.json({ consultant })
    }

    // Get all available consultants
    const consultants = await db.consultant.findMany({ take: 50,
      where: { isAvailable: true },
      include: {
        availability: true,
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ]
    })

    // If no consultants exist, seed sample consultants
    if (consultants.length === 0) {
      const sampleConsultants = [
        {
          name: "Dr. Sarah Chen",
          title: "Sexual Wellness Expert",
          bio: "With over 15 years of experience in sexual health and wellness, Dr. Chen specializes in helping individuals and couples explore their intimate needs with confidence and safety. Her approach combines scientific knowledge with compassionate care.",
          credentials: JSON.stringify([
            { title: "PhD in Human Sexuality", institution: "Institute for Advanced Study of Human Sexuality", year: 2008 },
            { title: "Certified Sex Therapist", institution: "AASECT", year: 2010 }
          ]),
          specialities: JSON.stringify(["couples", "solo", "toys", "education", "health"]),
          languages: JSON.stringify(["en", "zh"]),
          rating: 4.9,
          reviewCount: 0,
          hourlyRate: 15000, // $150
          isAvailable: true
        },
        {
          name: "Marcus Williams",
          title: "Relationship Coach",
          bio: "Marcus helps couples deepen their connection and explore new dimensions of intimacy together. His holistic approach focuses on communication, trust, and mutual pleasure.",
          credentials: JSON.stringify([
            { title: "MA in Marriage and Family Therapy", institution: "Northwestern University", year: 2012 },
            { title: "Certified Intimacy Coach", institution: "I-Coaching Academy", year: 2015 }
          ]),
          specialities: JSON.stringify(["couples", "communication", "intimacy", "education"]),
          languages: JSON.stringify(["en"]),
          rating: 4.8,
          reviewCount: 0,
          hourlyRate: 12000, // $120
          isAvailable: true
        },
        {
          name: "Dr. Priya Sharma",
          title: "Pelvic Health Specialist",
          bio: "Dr. Sharma combines her medical expertise with a passion for helping people understand their bodies. She specializes in pelvic floor health, postpartum wellness, and helping clients find products that support their health goals.",
          credentials: JSON.stringify([
            { title: "MD, OB-GYN", institution: "Johns Hopkins University", year: 2005 },
            { title: "Fellowship in Pelvic Medicine", institution: "Mayo Clinic", year: 2008 }
          ]),
          specialities: JSON.stringify(["health", "pelvic", "postpartum", "education", "toys"]),
          languages: JSON.stringify(["en", "hi"]),
          rating: 5.0,
          reviewCount: 0,
          hourlyRate: 18000, // $180
          isAvailable: true
        }
      ]

      for (const consultant of sampleConsultants) {
        await db.consultant.create({ data: consultant })
      }

      const seededConsultants = await db.consultant.findMany({ take: 50,
        where: { isAvailable: true },
        include: {
          availability: true,
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ]
      })

      return NextResponse.json({ consultants: seededConsultants })
    }

    return NextResponse.json({ consultants })
  } catch (error) {
    console.error('Error fetching consultants:', error)
    return NextResponse.json({ error: 'Failed to fetch consultants' }, { status: 500 })
  }
}
