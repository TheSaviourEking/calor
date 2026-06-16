import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

const insensitive = Prisma.QueryMode.insensitive

function buildTextSearch(query: string): Prisma.ProductWhereInput['OR'] {
  return [
    { name: { contains: query, mode: insensitive } },
    { shortDescription: { contains: query, mode: insensitive } },
    { fullDescription: { contains: query, mode: insensitive } },
    { tags: { contains: query, mode: insensitive } },
    { category: { is: { name: { contains: query, mode: insensitive } } } },
  ]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(40, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const sortBy = searchParams.get('sort') || 'relevance'
  const categorySlug = searchParams.get('category')
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
  const inStock = searchParams.get('inStock') === 'true'
  const isDigital = searchParams.get('isDigital') === 'true'
  const badge = searchParams.get('badge')

  if (query.length < 2) {
    return NextResponse.json({
      results: [],
      pagination: { total: 0, page, limit, pages: 0 },
      aggregations: null,
    })
  }

  // Resolve category id from slug if provided
  let categoryId: string | undefined
  if (categorySlug) {
    const cat = await db.category.findUnique({ where: { slug: categorySlug }, select: { id: true } })
    categoryId = cat?.id
  }

  // Build typed where clause
  const where: Prisma.ProductWhereInput = {
    published: true,
    OR: buildTextSearch(query),
  }

  if (categoryId) where.categoryId = categoryId
  if (inStock) where.inventoryCount = { gt: 0 }
  if (isDigital) where.isDigital = true
  if (badge) where.badge = badge

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Prisma.IntFilter = {}
    if (minPrice !== undefined) priceFilter.gte = minPrice
    if (maxPrice !== undefined) priceFilter.lte = maxPrice
    where.variants = { some: { price: priceFilter } }
  }

  // Sort order
  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }]
  if (sortBy === 'price_asc' || sortBy === 'price_desc') {
    // Fallback to creation date — variant price sorting requires aggregation
    orderBy = [{ createdAt: sortBy === 'price_asc' ? 'asc' : 'desc' }]
  } else if (sortBy === 'newest') {
    orderBy = [{ createdAt: 'desc' }]
  } else if (sortBy === 'popularity' || sortBy === 'rating') {
    orderBy = [{ purchaseCount: 'desc' }]
  }

  const skip = (page - 1) * limit

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          take: 1,
          orderBy: { price: 'asc' },
          select: { id: true, price: true, stock: true },
        },
        images: {
          take: 2,
          orderBy: { sortOrder: 'asc' },
          select: { url: true, altText: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ])

  // Aggregations — run against unfiltered base query
  const baseWhere: Prisma.ProductWhereInput = {
    published: true,
    OR: buildTextSearch(query),
  }

  const [allProducts, allCategories] = await Promise.all([
    db.product.findMany({
      where: baseWhere,
      include: {
        variants: { select: { price: true }, take: 1, orderBy: { price: 'asc' } },
      },
    }),
    db.category.findMany({ select: { id: true, name: true, slug: true } }),
  ])

  // Category aggregation
  const categoryCount: Record<string, number> = {}
  for (const p of allProducts) {
    categoryCount[p.categoryId] = (categoryCount[p.categoryId] || 0) + 1
  }
  const categoriesAgg = allCategories
    .filter((c) => categoryCount[c.id])
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: categoryCount[c.id] }))
    .sort((a, b) => b.count - a.count)

  // Badge aggregation
  const badgeCount: Record<string, number> = {}
  for (const p of allProducts) {
    if (p.badge) badgeCount[p.badge] = (badgeCount[p.badge] || 0) + 1
  }
  const badgesAgg = Object.entries(badgeCount).map(([badge, count]) => ({ badge, count }))

  // Price range from separate query
  const variantPrices = await db.variant.aggregate({
    where: { product: baseWhere },
    _min: { price: true },
    _max: { price: true },
  })
  const priceRange = {
    min: variantPrices._min.price ?? 0,
    max: variantPrices._max.price ?? 100000,
  }

  // Map results with relevance score
  const results = products.map((p) => {
    const price = p.variants[0]?.price || 0
    const nameMatch = p.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 0
    const score = nameMatch + (p.purchaseCount > 20 ? 1 : 0)
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      badge: p.badge,
      category: p.category,
      variants: p.variants,
      images: p.images,
      inventoryCount: p.inventoryCount,
      isDigital: p.isDigital,
      reviewCount: p._count.reviews,
      avgRating: 0,
      price,
      originalPrice: p.originalPrice,
      relevanceScore: score,
    }
  })

  if (sortBy === 'relevance') {
    results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
  } else if (sortBy === 'price_asc') {
    results.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => b.price - a.price)
  }

  return NextResponse.json({
    results,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    aggregations: {
      categories: categoriesAgg,
      badges: badgesAgg,
      priceRange,
      inStockCount: allProducts.filter((p) => p.inventoryCount > 0).length,
      digitalCount: allProducts.filter((p) => p.isDigital).length,
    },
  })
}
