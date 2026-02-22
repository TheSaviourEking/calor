import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const author = searchParams.get('author')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const featured = searchParams.get('featured')

    const where: Record<string, unknown> = {
      published: true,
      publishedAt: { lte: new Date() },
    }

    if (category) {
      where.category = { slug: category }
    }

    if (author) {
      where.author = { id: author }
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    // Get posts
    const posts = await db.blogPost.findMany({ /* take: handled */
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: featured === 'true' 
        ? { viewCount: 'desc' }
        : { publishedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get total count
    const total = await db.blogPost.count({ where })

    // Get featured post if requested
    let featuredPost = null
    if (featured === 'true' && offset === 0) {
      featuredPost = await db.blogPost.findFirst({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
      })
    }

    return NextResponse.json({
      posts,
      featuredPost,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total,
      },
    })
  } catch (error) {
    console.error('Blog posts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Admin only
  const { requireAdmin } = await import('@/lib/admin/middleware')
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      slug,
      title,
      excerpt,
      content,
      featuredImage,
      authorId,
      categoryId,
      tags,
      readTime,
      metaTitle,
      metaDescription,
      published,
    } = body

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      )
    }

    const post = await db.blogPost.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        featuredImage,
        authorId,
        categoryId,
        tags: tags ? JSON.stringify(tags) : '[]',
        readTime: readTime || 5,
        metaTitle,
        metaDescription,
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
      include: {
        author: true,
        category: true,
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Blog post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
