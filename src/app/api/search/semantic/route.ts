import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

const insensitive = Prisma.QueryMode.insensitive

// ============================================================
// SEMANTIC SEARCH — Strategy Pattern
//
// Current: Smart keyword expansion (no external service needed)
//
// To upgrade to vector embeddings:
//   1. Add OPENAI_API_KEY (or COHERE_API_KEY) to .env
//   2. Add PGVECTOR_URL or PINECONE_API_KEY to .env
//   3. Run one-time product embedding script
//   4. Implement vectorSearch() below and set the env var
//   5. The response shape is identical — frontend needs zero changes
// ============================================================

// Intent/attribute extraction — maps natural language to search terms
function analyzeQuery(query: string): {
  keywords: string[]
  intent: string
  attributes: Record<string, string>
  expandedTerms: string[]
} {
  const lower = query.toLowerCase()
  const words = lower.split(/\s+/).filter((w) => w.length > 2)

  // Intent detection
  let intent = 'browse'
  if (/couple|partner|together|intimate|connect/.test(lower)) intent = 'couples'
  else if (/gift|present|surprise|birthday|anniversary|wedding/.test(lower)) intent = 'gifting'
  else if (/beginner|first time|starter|new to|introduction/.test(lower)) intent = 'beginner'
  else if (/discreet|private|quiet|silent/.test(lower)) intent = 'discretion'
  else if (/wellness|health|self.care|relax|massage/.test(lower)) intent = 'wellness'
  else if (/lubricant|lube|oil/.test(lower)) intent = 'lubricant'
  else if (/lingerie|wear|outfit|apparel/.test(lower)) intent = 'apparel'

  // Attribute extraction
  const attributes: Record<string, string> = {}
  if (/vibrat|massag|wand/.test(lower)) attributes.type = 'toy'
  if (/silk|satin|lace|cotton/.test(lower)) attributes.material = lower.match(/silk|satin|lace|cotton/)?.[0] || ''
  if (/recharg|usb|battery/.test(lower)) attributes.power = 'rechargeable'
  if (/waterproof|shower|bath/.test(lower)) attributes.waterproof = 'true'
  if (/organic|natural|vegan/.test(lower)) attributes.organic = 'true'

  // Keyword expansion — add semantically related terms
  const expansions: Record<string, string[]> = {
    couple: ['couples', 'partner', 'together', 'connection', 'intimacy'],
    massage: ['massager', 'wand', 'touch', 'relaxation'],
    quiet: ['silent', 'discreet', 'whisper'],
    beginner: ['starter', 'intro', 'gentle'],
    gift: ['gifting', 'present', 'set', 'bundle'],
    lube: ['lubricant', 'oil', 'water-based', 'aloe'],
    lingerie: ['bodysuit', 'robe', 'apparel', 'wear'],
    wellness: ['self-care', 'health', 'relaxation'],
    toy: ['vibrator', 'massager', 'wand', 'device'],
    fiction: ['novel', 'story', 'erotica', 'book'],
    education: ['guide', 'instructional', 'learn'],
  }

  const expandedTerms: string[] = [...words]
  for (const word of words) {
    for (const [key, values] of Object.entries(expansions)) {
      if (word.includes(key) || key.includes(word)) {
        expandedTerms.push(...values)
      }
    }
  }

  return {
    keywords: words,
    intent,
    attributes,
    expandedTerms: [...new Set(expandedTerms)],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 20 } = body

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], total: 0, analysis: null })
    }

    // ──────────────────────────────────────────────────────
    // VECTOR SEARCH BRANCH (future — gated by env var)
    // When OPENAI_API_KEY + vector DB are configured, this
    // branch takes over with zero frontend changes needed.
    // ──────────────────────────────────────────────────────
    // if (process.env.OPENAI_API_KEY && process.env.PGVECTOR_URL) {
    //   return await vectorSearch(query, limit)
    // }

    // ──────────────────────────────────────────────────────
    // SMART KEYWORD EXPANSION FALLBACK
    // ──────────────────────────────────────────────────────
    const analysis = analyzeQuery(query)

    // Build multi-term OR conditions from expanded terms
    const searchTerms = [...new Set([query, ...analysis.expandedTerms])]

    const orConditions: Prisma.ProductWhereInput[] = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: insensitive } },
      { shortDescription: { contains: term, mode: insensitive } },
      { tags: { contains: term, mode: insensitive } },
    ])

    // Also search full description and category
    orConditions.push(
      { fullDescription: { contains: query, mode: insensitive } },
      { category: { is: { name: { contains: query, mode: insensitive } } } },
    )

    // Apply intent-based category boost
    const intentCategoryMap: Record<string, string[]> = {
      couples: ['couples', 'intimacy-toys'],
      gifting: ['couples', 'lingerie-apparel', 'wellness-body'],
      beginner: ['wellness-body', 'couples'],
      discretion: ['intimacy-toys', 'sexual-health'],
      wellness: ['wellness-body'],
      lubricant: ['wellness-body', 'sexual-health'],
      apparel: ['lingerie-apparel'],
    }

    const intentCategories = intentCategoryMap[analysis.intent] || []

    const products = await db.product.findMany({
      where: {
        published: true,
        OR: orConditions,
      },
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
        _count: { select: { reviews: true } },
      },
      take: limit * 2, // fetch extra to allow re-ranking
    })

    // Re-rank by relevance score
    const scored = products.map((p) => {
      let score = 0

      // Exact name match — highest weight
      if (p.name.toLowerCase().includes(query.toLowerCase())) score += 10

      // Category intent match
      if (intentCategories.includes(p.category.slug)) score += 5

      // Expanded keyword matches
      for (const term of analysis.expandedTerms) {
        if (p.name.toLowerCase().includes(term)) score += 2
        if (p.shortDescription.toLowerCase().includes(term)) score += 1
      }

      // Popularity boost
      if (p.purchaseCount > 50) score += 3
      else if (p.purchaseCount > 20) score += 1

      // Bestseller badge boost
      if (p.badge === 'bestseller') score += 2

      const price = p.variants[0]?.price || 0
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
        fitType: analysis.intent,
      }
    })

    // Sort by score descending, take requested limit
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
    const results = scored.slice(0, limit)

    return NextResponse.json({
      results,
      total: results.length,
      analysis: {
        keywords: analysis.keywords,
        intent: analysis.intent,
        attributes: analysis.attributes,
      },
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0, analysis: null },
      { status: 500 }
    )
  }
}
