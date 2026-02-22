import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get sensory profile for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const sensory = await db.sensoryProfile.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!sensory) {
      // Return a default sensory profile based on product category
      const product = await db.product.findUnique({
        where: { id: productId },
        include: { category: true }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Generate default sensory profile
      const defaultProfile = generateDefaultSensoryProfile(product)
      return NextResponse.json({ sensory: defaultProfile, isDefault: true })
    }

    return NextResponse.json({ sensory, isDefault: false })
  } catch (error) {
    console.error('Error fetching sensory profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sensory profile' },
      { status: 500 }
    )
  }
}

// POST - Create or update sensory profile
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const sensory = await db.sensoryProfile.upsert({
      where: { productId: data.productId },
      create: {
        productId: data.productId,
        textureType: data.textureType,
        textureIntensity: data.textureIntensity,
        surfaceFeel: data.surfaceFeel,
        firmness: data.firmness,
        flexibility: data.flexibility,
        vibrationLevels: data.vibrationLevels,
        vibrationPatterns: data.vibrationPatterns,
        motorType: data.motorType,
        maxIntensity: data.maxIntensity,
        noiseLevel: data.noiseLevel,
        temperatureResponsive: data.temperatureResponsive || false,
        warmingSupported: data.warmingSupported || false,
        coolingSupported: data.coolingSupported || false,
        soundProfile: data.soundProfile ? JSON.stringify(data.soundProfile) : null,
        weight: data.weight,
        weightFeel: data.weightFeel,
        gripFeel: data.gripFeel,
        warmingSensation: data.warmingSensation || false,
        coolingSensation: data.coolingSensation || false,
      },
      update: {
        textureType: data.textureType,
        textureIntensity: data.textureIntensity,
        surfaceFeel: data.surfaceFeel,
        firmness: data.firmness,
        flexibility: data.flexibility,
        vibrationLevels: data.vibrationLevels,
        vibrationPatterns: data.vibrationPatterns,
        motorType: data.motorType,
        maxIntensity: data.maxIntensity,
        noiseLevel: data.noiseLevel,
        temperatureResponsive: data.temperatureResponsive || false,
        warmingSupported: data.warmingSupported || false,
        coolingSupported: data.coolingSupported || false,
        soundProfile: data.soundProfile ? JSON.stringify(data.soundProfile) : null,
        weight: data.weight,
        weightFeel: data.weightFeel,
        gripFeel: data.gripFeel,
        warmingSensation: data.warmingSensation || false,
        coolingSensation: data.coolingSensation || false,
      }
    })

    return NextResponse.json({ sensory })
  } catch (error) {
    console.error('Error saving sensory profile:', error)
    return NextResponse.json(
      { error: 'Failed to save sensory profile' },
      { status: 500 }
    )
  }
}

// Generate a default sensory profile based on product category
function generateDefaultSensoryProfile(product: { id: string; name: string; category: { slug: string; name: string } }) {
  const categorySlug = product.category?.slug?.toLowerCase() || ''
  
  // Default profiles based on category
  const categoryDefaults: Record<string, Partial<typeof defaultProfile>> = {
    vibrators: {
      textureType: 'smooth',
      surfaceFeel: 'silky',
      firmness: 'medium',
      flexibility: 'semi-flexible',
      vibrationLevels: 10,
      vibrationPatterns: 8,
      motorType: 'rumbly',
      maxIntensity: 8,
      noiseLevel: 'quiet',
    },
    masturbators: {
      textureType: 'textured',
      surfaceFeel: 'velvety',
      firmness: 'soft',
      flexibility: 'flexible',
    },
    dildos: {
      textureType: 'smooth',
      surfaceFeel: 'silky',
      firmness: 'firm',
      flexibility: 'semi-flexible',
    },
    couples: {
      textureType: 'smooth',
      surfaceFeel: 'silky',
      firmness: 'medium',
      flexibility: 'flexible',
      vibrationLevels: 10,
      vibrationPatterns: 12,
      motorType: 'rumbly',
      maxIntensity: 7,
      noiseLevel: 'quiet',
    },
  }

  const defaultProfile = {
    productId: product.id,
    textureType: 'smooth',
    textureIntensity: 5,
    surfaceFeel: 'silky',
    firmness: 'medium',
    flexibility: 'semi-flexible',
    vibrationLevels: null as number | null,
    vibrationPatterns: null as number | null,
    motorType: null as string | null,
    maxIntensity: null as number | null,
    noiseLevel: null as string | null,
    temperatureResponsive: false,
    warmingSupported: false,
    coolingSupported: false,
    weight: null as number | null,
    weightFeel: 'medium',
    gripFeel: 'ergonomic',
    warmingSensation: false,
    coolingSensation: false,
  }

  return {
    ...defaultProfile,
    ...(categoryDefaults[categorySlug] || {}),
    product: {
      id: product.id,
      name: product.name,
    }
  }
}
