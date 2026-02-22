import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Get active flash sales
export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    const flashSales = await db.promotion.findMany({ take: 50,
      where: {
        isActive: true,
        isFlashSale: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: 'asc' },
    })

    // Get products that are part of flash sales
    const productsWithFlashSale = []
    
    for (const sale of flashSales) {
      if (sale.appliesTo) {
        const appliesTo = JSON.parse(sale.appliesTo)
        
        if (appliesTo.productIds && appliesTo.productIds.length > 0) {
          const products = await db.product.findMany({ /* take: handled */
            where: {
              id: { in: appliesTo.productIds },
              published: true,
            },
            include: {
              images: { take: 1 },
              variants: { take: 1 },
              category: true,
            },
          })
          
          for (const product of products) {
            productsWithFlashSale.push({
              ...product,
              flashSalePrice: sale.flashSalePrice || Math.floor((product.variants[0]?.price || 0) * (100 - sale.value) / 100),
              flashSaleEndsAt: sale.endsAt,
              flashSaleName: sale.name,
              originalPrice: product.variants[0]?.price || 0,
            })
          }
        }
      }
    }

    return NextResponse.json({
      flashSales,
      products: productsWithFlashSale,
    })
  } catch (error) {
    console.error('Flash sales fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flash sales' },
      { status: 500 }
    )
  }
}
