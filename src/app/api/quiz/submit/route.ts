import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface QuizAnswer {
  questionId: string
  answer: string | string[]
}

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  categoryId: string
  tags: string
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, answers, customerId } = await request.json()

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get all products for scoring
    const products = await db.product.findMany({
      where: { published: true },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: true
      }
    })

    // Build user profile from answers
    const userProfile = buildUserProfile(answers)

    // Score products based on quiz answers
    const recommendations = scoreProducts(userProfile, products)

    // Save quiz result
    const quizResult = await db.quizResult.create({
      data: {
        sessionId,
        customerId: customerId || null,
        recommendations: JSON.stringify(recommendations),
        profile: JSON.stringify(userProfile)
      }
    })

    // Get full product details for recommendations
    const recommendedProducts = await Promise.all(
      recommendations.slice(0, 6).map(async (rec: { productId: string; score: number; reasons: string[] }) => {
        const product = products.find(p => p.id === rec.productId)
        if (!product) return null

        const avgRating = await db.review.aggregate({
          where: { productId: product.id, isApproved: true },
          _avg: { rating: true }
        })

        return {
          ...product,
          avgRating: avgRating._avg.rating || 0,
          recommendation: {
            score: rec.score,
            reasons: rec.reasons
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      resultId: quizResult.id,
      profile: userProfile,
      recommendations: recommendedProducts.filter(Boolean)
    })
  } catch (error) {
    console.error('Quiz submission error:', error)
    return NextResponse.json({ error: 'Failed to process quiz' }, { status: 500 })
  }
}

function buildUserProfile(answers: QuizAnswer[]): Record<string, string | string[]> {
  const profile: Record<string, string | string[]> = {}

  for (const answer of answers) {
    profile[answer.questionId] = answer.answer
  }

  const experienceAnswer = answers.find(a => {
    const ans = a.answer
    return Array.isArray(ans)
      ? ans.includes('beginner') || ans.includes('intermediate') || ans.includes('advanced')
      : typeof ans === 'string' && ['beginner', 'intermediate', 'advanced', 'expert'].includes(ans)
  })

  const goalsAnswer = answers.find(a => Array.isArray(a.answer))

  return {
    experience: (typeof experienceAnswer?.answer === 'string' ? experienceAnswer.answer : 'intermediate') as string,
    goals: (Array.isArray(goalsAnswer?.answer) ? goalsAnswer.answer : ['pleasure']) as string[],
    allAnswers: JSON.stringify(answers)
  }
}

/**
 * Score products based on user profile answers.
 * Uses tag matching and category affinity — no external AI dependency.
 */
function scoreProducts(
  profile: Record<string, string | string[]>,
  products: Product[]
): { productId: string; score: number; reasons: string[] }[] {
  const experience = profile.experience as string
  const goals = Array.isArray(profile.goals) ? profile.goals as string[] : ['pleasure']

  const scored = products.map(product => {
    let score = 60
    const reasons: string[] = []

    // Tag matching
    let tags: string[] = []
    try {
      tags = JSON.parse(product.tags || '[]')
    } catch { tags = [] }

    // Experience level matching
    if (experience === 'beginner' && tags.some(t => ['beginner', 'gentle', 'starter', 'intimate'].includes(t))) {
      score += 15
      reasons.push('Great for beginners')
    }
    if (experience === 'advanced' && tags.some(t => ['advanced', 'powerful', 'intense'].includes(t))) {
      score += 15
      reasons.push('Matches your experience level')
    }

    // Goals matching
    if (goals.some(g => tags.includes(g))) {
      score += 10
      reasons.push('Aligns with your goals')
    }

    // Quality signals
    if (tags.some(t => ['premium', 'body-safe', 'rechargeable', 'waterproof'].includes(t))) {
      score += 5
      reasons.push('High quality materials')
    }

    if (reasons.length === 0) {
      reasons.push('Popular choice', 'High quality', 'Body-safe materials')
    }

    return { productId: product.id, score, reasons }
  })

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score).slice(0, 6)
}
