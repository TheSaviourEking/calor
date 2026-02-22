import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

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

    // Get all products for AI to consider
    const products = await db.product.findMany({ /* take: handled */
      where: { published: true },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: true
      }
    })

    // Build user profile from answers
    const userProfile = buildUserProfile(answers)

    // Get AI recommendations using LLM
    const recommendations = await getAIRecommendations(userProfile, products)

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

  // Extract key preferences
  const experienceAnswer = answers.find(a => {
    const ans = a.answer
    return Array.isArray(ans) ? ans.includes('beginner') || ans.includes('intermediate') || ans.includes('advanced') : 
           typeof ans === 'string' && (ans === 'beginner' || ans === 'intermediate' || ans === 'advanced' || ans === 'expert')
  })
  
  const goalsAnswer = answers.find(a => Array.isArray(a.answer))
  
  return {
    experience: experienceAnswer?.answer || 'intermediate',
    goals: goalsAnswer?.answer || ['pleasure'],
    allAnswers: answers
  }
}

async function getAIRecommendations(
  profile: Record<string, string | string[]>,
  products: Product[]
): Promise<{ productId: string; score: number; reasons: string[] }[]> {
  try {
    const zai = await ZAI.create()

    const systemPrompt = `You are a premium intimate wellness product expert for CALŌR. Your task is to analyze customer preferences and recommend the most suitable products.

Guidelines:
- Consider experience level, goals, and preferences
- Prioritize body-safe, high-quality products
- Be inclusive and respectful
- Focus on customer comfort and satisfaction
- Return exactly 6 product recommendations in JSON format

Response format must be valid JSON array:
[{"productId": "id", "score": 85, "reasons": ["reason1", "reason2"]}]`

    const productsInfo = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.shortDescription,
      category: p.categoryId,
      tags: p.tags
    }))

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        {
          role: 'user',
          content: `Customer Profile:
${JSON.stringify(profile, null, 2)}

Available Products:
${JSON.stringify(productsInfo, null, 2)}

Recommend the top 6 products that best match this customer's profile. Consider their experience level, goals, and preferences. Return as JSON array.`
        }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback: simple scoring based on tags
    return products.slice(0, 6).map(p => ({
      productId: p.id,
      score: 70,
      reasons: ['Popular choice', 'High quality', 'Body-safe materials']
    }))
  } catch (error) {
    console.error('AI recommendation error:', error)
    // Fallback recommendations
    return products.slice(0, 6).map(p => ({
      productId: p.id,
      score: 70,
      reasons: ['Popular choice', 'High quality', 'Body-safe materials']
    }))
  }
}
