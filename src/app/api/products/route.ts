import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.customerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const {
            name, shortDescription, fullDescription,
            price, originalPrice, compareAtPrice, sku,
            status, categoryId, images, videos,
            isDigital, isRestricted, requiresConsentGate, inventoryCount, badge,
            materialInfo, safetyInfo, cleaningGuide, usageGuide, estimatedDeliveryDays,
            waterproofRating, whatsInTheBox, batteryType, chargeTimeMinutes, usageTimeMinutes, chargingMethod,
            tags, metaTitle, metaDescription,
            sensoryProfile, features, sizeVisualization, sizeRecommendation,
            model3D, regionalPrices
        } = body

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        // Generate a basic slug from the name
        let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

        // Check for slug uniqueness and append a short ID if duplicate exists
        const existingProduct = await db.product.findUnique({
            where: { slug }
        })

        if (existingProduct) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
        }

        let targetCategoryId = categoryId?.trim()

        if (targetCategoryId) {
            // Validate that the provided category ID actually exists
            const categoryExists = await db.category.findUnique({
                where: { id: targetCategoryId }
            })
            if (!categoryExists) {
                targetCategoryId = null // Clear it so we trigger the fallback below
            }
        }

        if (!targetCategoryId) {
            // Find or create a default "Uncategorized" category
            let defaultCategory = await db.category.findUnique({
                where: { slug: 'uncategorized' }
            })

            if (!defaultCategory) {
                defaultCategory = await db.category.create({
                    data: {
                        name: 'Uncategorized',
                        slug: 'uncategorized',
                        description: 'Default category for products',
                        iconName: 'box'
                    }
                })
            }
            targetCategoryId = defaultCategory.id
        }

        const product = await db.product.create({
            data: {
                name,
                slug,
                shortDescription: shortDescription || '',
                fullDescription: fullDescription || '',
                categoryId: targetCategoryId,
                tags: JSON.stringify(tags || []),
                metaTitle: metaTitle || null,
                metaDescription: metaDescription || null,
                published: status === 'active',
                isDigital: !!isDigital,
                isRestricted: !!isRestricted,
                requiresConsentGate: !!requiresConsentGate,
                badge: badge === 'none' ? null : (badge || null),
                inventoryCount: inventoryCount ? parseInt(inventoryCount) : 0,
                originalPrice: originalPrice ? parseInt(originalPrice) : null,
                materialInfo: materialInfo || null,
                safetyInfo: safetyInfo || null,
                cleaningGuide: cleaningGuide || null,
                usageGuide: usageGuide || null,
                estimatedDeliveryDays: estimatedDeliveryDays ? parseInt(estimatedDeliveryDays) : 5,
                waterproofRating: waterproofRating || null,
                whatsInTheBox: whatsInTheBox || null,
                batteryType: batteryType || null,
                chargeTimeMinutes: chargeTimeMinutes ? parseInt(chargeTimeMinutes) : null,
                usageTimeMinutes: usageTimeMinutes ? parseInt(usageTimeMinutes) : null,
                chargingMethod: chargingMethod || null,

                variants: {
                    create: body.variants && body.variants.length > 0
                        ? body.variants.map((v: any) => ({
                            name: v.name || 'Default',
                            price: v.price || parseInt(price),
                            sku: v.sku || `${sku || name.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                            stock: v.stock || 0
                        }))
                        : [{
                            name: 'Default',
                            price: parseInt(price),
                            sku: sku || name.replace(/\s+/g, '-').toUpperCase(),
                            stock: inventoryCount ? parseInt(inventoryCount) : 0,
                        }]
                },
                images: images && images.length > 0 ? {
                    create: images.map((img: any, index: number) => ({
                        url: img.url,
                        altText: img.altText || `${name} - Image ${index + 1}`,
                        sortOrder: img.sortOrder || index
                    }))
                } : undefined,
                videos: videos && videos.length > 0 ? {
                    create: videos.map((vid: any, index: number) => ({
                        url: vid.url,
                        thumbnailUrl: vid.thumbnailUrl || null,
                        title: vid.title || `${name} - Video ${index + 1}`,
                        description: vid.description || null,
                        duration: vid.duration || null,
                        source: vid.source || (vid.url.includes('youtube.com') || vid.url.includes('vimeo.com') ? 'youtube' : 'upload'),
                        videoType: vid.videoType || 'demo',
                        isFeatured: !!vid.isFeatured,
                        sortOrder: vid.sortOrder || index,
                    }))
                } : undefined,
                sensoryProfile: sensoryProfile ? {
                    create: {
                        hasElectronics: !!sensoryProfile.hasElectronics,
                        textureType: sensoryProfile.textureType || null,
                        textureIntensity: sensoryProfile.textureIntensity ? parseInt(sensoryProfile.textureIntensity) : null,
                        surfaceFeel: sensoryProfile.surfaceFeel || null,
                        firmness: sensoryProfile.firmness || null,
                        flexibility: sensoryProfile.flexibility || null,
                        vibrationLevels: sensoryProfile.vibrationLevels ? parseInt(sensoryProfile.vibrationLevels) : null,
                        vibrationPatterns: sensoryProfile.vibrationPatterns ? parseInt(sensoryProfile.vibrationPatterns) : null,
                        motorType: sensoryProfile.motorType || null,
                        maxIntensity: sensoryProfile.maxIntensity ? parseInt(sensoryProfile.maxIntensity) : null,
                        noiseLevel: sensoryProfile.noiseLevel || null,
                        temperatureResponsive: !!sensoryProfile.temperatureResponsive,
                        warmingSupported: !!sensoryProfile.warmingSupported,
                        coolingSupported: !!sensoryProfile.coolingSupported,
                        soundProfile: sensoryProfile.soundProfile || null,
                        weight: sensoryProfile.weight ? parseInt(sensoryProfile.weight) : null,
                        weightFeel: sensoryProfile.weightFeel || null,
                        gripFeel: sensoryProfile.gripFeel || null,
                        warmingSensation: !!sensoryProfile.warmingSensation,
                        coolingSensation: !!sensoryProfile.coolingSensation,
                    }
                } : undefined,
                features: features && features.length > 0 ? {
                    create: features.map((f: any) => ({
                        name: f.name,
                        description: f.description,
                        category: f.category,
                        iconType: f.iconType,
                        isKeyFeature: !!f.isKeyFeature
                    }))
                } : undefined,
                sizeVisualization: sizeVisualization ? {
                    create: {
                        length: sizeVisualization.length ? parseFloat(sizeVisualization.length) : null,
                        width: sizeVisualization.width ? parseFloat(sizeVisualization.width) : null,
                        height: sizeVisualization.height ? parseFloat(sizeVisualization.height) : null,
                        diameter: sizeVisualization.diameter ? parseFloat(sizeVisualization.diameter) : null,
                        insertableLength: sizeVisualization.insertableLength ? parseFloat(sizeVisualization.insertableLength) : null,
                        circumference: sizeVisualization.circumference ? parseFloat(sizeVisualization.circumference) : null,
                    }
                } : undefined,
                sizeRecommendation: sizeRecommendation ? {
                    create: {
                        fitType: sizeRecommendation.fitType || 'true_to_size',
                        notes: sizeRecommendation.notes || null,
                    }
                } : undefined,
                model3D: model3D && model3D.modelUrl ? {
                    create: {
                        modelUrl: model3D.modelUrl,
                        modelType: model3D.modelType || 'glb',
                        thumbnailUrl: model3D.thumbnailUrl || null,
                        arSupported: !!model3D.arSupported,
                        arScale: model3D.arScale ? parseFloat(model3D.arScale) : 1.0,
                    }
                } : undefined,
                regionalPrices: regionalPrices && regionalPrices.length > 0 ? {
                    create: regionalPrices.map((rp: any) => ({
                        countryCode: rp.countryCode,
                        currency: rp.currency,
                        priceCents: parseInt(rp.priceCents),
                        compareAtPriceCents: rp.compareAtPriceCents ? parseInt(rp.compareAtPriceCents) : null,
                        isActive: true
                    }))
                } : undefined
            },
        })

        return NextResponse.json({ success: true, product })
    } catch (error: any) {
        console.error('Error creating product:', error)
        if (error.code) console.error('Prisma Error Code:', error.code)
        if (error.meta) console.error('Prisma Error Meta:', error.meta)
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
            code: error.code
        }, { status: 500 })
    }
}
