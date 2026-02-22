import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List product experiences (user-generated content)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = { 
      isApproved: true,
      isPublic: true 
    }
    
    if (productId) where.productId = productId
    if (type) where.experienceType = type
    if (featured === 'true') where.isFeatured = true

    const [experiences, total] = await Promise.all([
      db.productExperience.findMany({ /* take: handled */
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1 }
            }
          },
          customer: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          likes: {
            select: { id: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      db.productExperience.count({ where })
    ])

    // Increment view count
    if (experiences.length > 0) {
      await Promise.all(
        experiences.map(exp => 
          db.productExperience.update({
            where: { id: exp.id },
            data: { viewsCount: { increment: 1 } }
          })
        )
      )
    }

    return NextResponse.json({ 
      experiences: experiences.map(exp => ({
        ...exp,
        likesCount: exp.likes.length,
        commentsCount: exp._count.comments,
        customerName: exp.customer 
          ? `${exp.customer.firstName} ${exp.customer.lastName.charAt(0)}.`
          : exp.guestName || 'Anonymous',
        images: exp.images ? JSON.parse(exp.images) : [],
      })),
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    )
  }
}

// POST - Create a new product experience
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const data = await request.json()
    
    const experience = await db.productExperience.create({
      data: {
        productId: data.productId,
        customerId: session?.customerId || null,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        title: data.title,
        content: data.content,
        experienceType: data.experienceType || 'story',
        images: data.images ? JSON.stringify(data.images) : null,
        videoUrl: data.videoUrl,
        rating: data.rating,
        enjoymentRating: data.enjoymentRating,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isApproved: false, // Requires moderation
        isPublic: true,
      }
    })

    return NextResponse.json({ 
      experience,
      message: 'Experience submitted for review' 
    })
  } catch (error) {
    console.error('Error creating experience:', error)
    return NextResponse.json(
      { error: 'Failed to create experience' },
      { status: 500 }
    )
  }
}
