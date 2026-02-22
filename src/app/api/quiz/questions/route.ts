// Quiz questions API - AI Product Quiz feature (Phase 2)
// Updated: Force recompilation for Prisma client sync
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const questions = await db.quizQuestion.findMany({ take: 50,
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })

    // If no questions exist, seed default questions
    if (questions.length === 0) {
      const defaultQuestions = [
        {
          question: "What's your experience level with intimate wellness products?",
          description: "This helps us recommend products suited to your comfort level",
          type: "single",
          category: "experience",
          options: JSON.stringify([
            { value: "beginner", label: "Beginner - Just starting to explore", icon: "sprout", weight: 1 },
            { value: "intermediate", label: "Intermediate - Some experience", icon: "leaf", weight: 2 },
            { value: "advanced", label: "Advanced - Very experienced", icon: "tree", weight: 3 },
            { value: "expert", label: "Expert - Extensive knowledge", icon: "crown", weight: 4 }
          ]),
          weight: 3,
          sortOrder: 1
        },
        {
          question: "What are your primary wellness goals?",
          description: "Select all that apply",
          type: "multiple",
          category: "goals",
          options: JSON.stringify([
            { value: "pleasure", label: "Enhanced pleasure", icon: "sparkles", weight: 1 },
            { value: "intimacy", label: "Deepen intimacy with partner", icon: "heart", weight: 1 },
            { value: "self_care", label: "Self-care & relaxation", icon: "lotus", weight: 1 },
            { value: "health", label: "Pelvic health", icon: "activity", weight: 1 },
            { value: "exploration", label: "Exploring new experiences", icon: "compass", weight: 1 },
            { value: "education", label: "Learning about my body", icon: "book", weight: 1 }
          ]),
          weight: 3,
          sortOrder: 1
        },
        {
          question: "Are you shopping for yourself or with a partner?",
          description: "We'll tailor recommendations accordingly",
          type: "single",
          category: "preferences",
          options: JSON.stringify([
            { value: "solo", label: "Just for me", icon: "user", weight: 1 },
            { value: "partner", label: "With a partner", icon: "users", weight: 1 },
            { value: "both", label: "Both solo and partnered", icon: "heartHandshake", weight: 1 }
          ]),
          weight: 2,
          sortOrder: 1
        },
        {
          question: "What sensations do you most enjoy?",
          description: "Select all that appeal to you",
          type: "multiple",
          category: "preferences",
          options: JSON.stringify([
            { value: "vibration", label: "Vibration", icon: "zap", weight: 1 },
            { value: "pressure", label: "Pressure & suction", icon: "target", weight: 1 },
            { value: "temperature", label: "Temperature play", icon: "thermometer", weight: 1 },
            { value: "texture", label: "Textured surfaces", icon: "grid", weight: 1 },
            { value: "movement", label: "Thrusting & movement", icon: "arrowUp", weight: 1 },
            { value: "gentle", label: "Gentle & subtle", icon: "feather", weight: 1 }
          ]),
          weight: 2,
          sortOrder: 2
        },
        {
          question: "Do you have any sensitivities we should consider?",
          description: "This helps us recommend body-safe materials",
          type: "multiple",
          category: "concerns",
          options: JSON.stringify([
            { value: "none", label: "No sensitivities", icon: "check", weight: 1 },
            { value: "latex", label: "Latex sensitivity", icon: "alertCircle", weight: 1 },
            { value: "fragrance", label: "Fragrance sensitivity", icon: "wind", weight: 1 },
            { value: "skin", label: "Sensitive skin", icon: "shield", weight: 1 }
          ]),
          weight: 2,
          sortOrder: 1
        },
        {
          question: "What's your preferred noise level?",
          description: "Discretion matters to many of our customers",
          type: "single",
          category: "preferences",
          options: JSON.stringify([
            { value: "ultra_quiet", label: "Ultra-quiet is essential", icon: "volumeX", weight: 1 },
            { value: "quiet", label: "Prefer quiet operation", icon: "volume1", weight: 1 },
            { value: "moderate", label: "Moderate noise is fine", icon: "volume2", weight: 1 },
            { value: "no_preference", label: "No preference", icon: "volume", weight: 1 }
          ]),
          weight: 1,
          sortOrder: 3
        },
        {
          question: "What's your preferred power source?",
          description: "For rechargeable vs battery-operated products",
          type: "single",
          category: "preferences",
          options: JSON.stringify([
            { value: "rechargeable", label: "Rechargeable (USB)", icon: "batteryCharging", weight: 1 },
            { value: "batteries", label: "Batteries (easy replacement)", icon: "battery", weight: 1 },
            { value: "manual", label: "Manual (no power needed)", icon: "hand", weight: 1 },
            { value: "no_preference", label: "No preference", icon: "helpCircle", weight: 1 }
          ]),
          weight: 1,
          sortOrder: 4
        },
        {
          question: "What's most important to you in a product?",
          description: "We'll prioritize recommendations based on your choice",
          type: "single",
          category: "goals",
          options: JSON.stringify([
            { value: "quality", label: "Premium quality", icon: "award", weight: 1 },
            { value: "value", label: "Best value for money", icon: "tag", weight: 1 },
            { value: "discretion", label: "Maximum discretion", icon: "eyeOff", weight: 1 },
            { value: "innovation", label: "Latest technology", icon: "cpu", weight: 1 },
            { value: "design", label: "Beautiful design", icon: "palette", weight: 1 }
          ]),
          weight: 2,
          sortOrder: 2
        },
        {
          question: "What's your comfort level with product size?",
          description: "This helps us recommend appropriately sized products",
          type: "single",
          category: "preferences",
          options: JSON.stringify([
            { value: "small", label: "Prefer smaller/compact", icon: "minimize", weight: 1 },
            { value: "medium", label: "Medium/standard size", icon: "maximize", weight: 1 },
            { value: "large", label: "Comfortable with larger", icon: "maximize2", weight: 1 },
            { value: "variety", label: "Interested in variety", icon: "layers", weight: 1 }
          ]),
          weight: 1,
          sortOrder: 5
        },
        {
          question: "Any specific features you're looking for?",
          description: "Select all that interest you",
          type: "multiple",
          category: "goals",
          options: JSON.stringify([
            { value: "app_control", label: "App/smart control", icon: "smartphone", weight: 1 },
            { value: "waterproof", label: "Waterproof", icon: "droplet", weight: 1 },
            { value: "remote", label: "Remote control", icon: "radio", weight: 1 },
            { value: "dual_motor", label: "Dual motors", icon: "zap", weight: 1 },
            { value: "hands_free", label: "Hands-free", icon: "hand", weight: 1 },
            { value: "customizable", label: "Customizable settings", icon: "sliders", weight: 1 }
          ]),
          weight: 2,
          sortOrder: 3
        }
      ]

      for (const q of defaultQuestions) {
        await db.quizQuestion.create({ data: q })
      }

      const seededQuestions = await db.quizQuestion.findMany({ take: 50,
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
      })

      return NextResponse.json({ questions: seededQuestions })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
