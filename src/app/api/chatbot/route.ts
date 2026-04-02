import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/chatbot - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const conversation = await db.chatbotConversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({
        conversation: null,
        messages: [],
      })
    }

    return NextResponse.json({
      conversation,
      messages: conversation.messages,
    })
  } catch (error) {
    console.error('Error fetching chatbot conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// POST /api/chatbot - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, customerId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    // Find or create conversation
    let conversation = sessionId
      ? await db.chatbotConversation.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 8,
          },
        },
      })
      : null

    if (!conversation) {
      const newSessionId = sessionId || nanoid()
      const created = await db.chatbotConversation.create({
        data: {
          sessionId: newSessionId,
          customerId: customerId || null,
          status: 'active',
        },
      })
      conversation = { ...created, messages: [] }
    }

    // Store user message
    await db.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        content: message,
      },
    })

    // Increment message count
    await db.chatbotConversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 1 } },
    })

    // Build conversation context
    const conversationContext = conversation.messages
      .reverse()
      .map(m => `${m.senderType}: ${m.content}`)
      .join('\n')

    // Generate AI response
    const aiResponse = await generateAIResponse(message, conversation, customerId, conversationContext)

    // Store bot response
    const botMessage = await db.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'bot',
        content: aiResponse.content,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        suggestedActions: aiResponse.suggestedActions ? JSON.stringify(aiResponse.suggestedActions) : null,
        relatedProducts: aiResponse.relatedProducts ? JSON.stringify(aiResponse.relatedProducts) : null,
      },
    })

    // Update conversation intent
    if (aiResponse.intent && !conversation.intent) {
      await db.chatbotConversation.update({
        where: { id: conversation.id },
        data: {
          intent: aiResponse.intent,
          sentiment: aiResponse.sentiment,
        },
      })
    }

    return NextResponse.json({
      sessionId: conversation.sessionId,
      message: botMessage,
      suggestedActions: aiResponse.suggestedActions,
      relatedProducts: aiResponse.relatedProducts,
      needsEscalation: aiResponse.needsEscalation,
    })
  } catch (error) {
    console.error('Error processing chatbot message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// ==========================================================
// PRODUCT CONTEXT BUILDER
// ==========================================================

// Build a human-readable brief from a product's full data
function buildProductBrief(product: Record<string, unknown>): string {
  const lines: string[] = []
  const p = product as Record<string, unknown>

  lines.push(`**${p.name}**`)
  if (p.shortDescription) lines.push(`${p.shortDescription}`)

  // Price
  const variants = p.variants as Array<{ name: string; price: number; stock: number }> | undefined
  if (variants && variants.length > 0) {
    const prices = variants.map(v => v.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    if (minPrice === maxPrice) {
      lines.push(`💰 Price: $${(minPrice / 100).toFixed(2)}`)
    } else {
      lines.push(`💰 Price: $${(minPrice / 100).toFixed(2)} – $${(maxPrice / 100).toFixed(2)}`)
    }

    // Variants
    if (variants.length > 1) {
      const inStock = variants.filter(v => v.stock > 0)
      lines.push(`🎨 Variants: ${variants.map(v => v.name).join(', ')} (${inStock.length} in stock)`)
    }
  }

  // Material
  if (p.materialInfo) lines.push(`🧪 Material: ${p.materialInfo}`)

  // Waterproof
  if (p.waterproofRating) {
    const wpLabels: Record<string, string> = {
      'IPX7': 'Fully submersible (bath/shower safe)',
      'IPX8': 'Deep submersible',
      'IPX6': 'Water jet resistant',
      'IPX5': 'Water jet resistant',
      'IPX4': 'Splash-proof',
    }
    lines.push(`💧 Waterproof: ${p.waterproofRating} — ${wpLabels[p.waterproofRating as string] || 'Water resistant'}`)
  }

  // Battery & Charging
  if (p.batteryType || p.chargeTimeMinutes || p.usageTimeMinutes) {
    const parts: string[] = []
    if (p.batteryType) {
      const btLabels: Record<string, string> = {
        'rechargeable_lithium': 'Rechargeable Li-Ion',
        'usb_powered': 'USB Powered',
        'aaa': 'AAA Batteries',
        'aa': 'AA Batteries',
      }
      parts.push(btLabels[p.batteryType as string] || (p.batteryType as string))
    }
    if (p.usageTimeMinutes) parts.push(`${formatMinutes(p.usageTimeMinutes as number)} usage`)
    if (p.chargeTimeMinutes) parts.push(`${formatMinutes(p.chargeTimeMinutes as number)} charge`)
    if (p.chargingMethod) parts.push(`${(p.chargingMethod as string).replace(/-/g, ' ')} charging`)
    lines.push(`🔋 Battery: ${parts.join(', ')}`)
  }

  // Sensory Profile
  const sp = p.sensoryProfile as Record<string, unknown> | undefined
  if (sp) {
    const traits: string[] = []
    if (sp.textureType) traits.push(`${sp.textureType} texture`)
    if (sp.firmness) traits.push(`${sp.firmness} firmness`)
    if (sp.flexibility) traits.push(`${sp.flexibility}`)
    if (sp.surfaceFeel) traits.push(`${sp.surfaceFeel} surface`)
    if (sp.gripFeel) traits.push(`${sp.gripFeel} grip`)
    if (traits.length > 0) lines.push(`✋ Feel: ${traits.join(', ')}`)

    if (sp.vibrationLevels) lines.push(`📳 Vibration: ${sp.vibrationLevels} levels`)
    if (sp.noiseLevel) lines.push(`🔇 Noise: ${sp.noiseLevel}`)
    if (sp.weight) lines.push(`⚖️ Weight: ${sp.weight}g`)
    if (sp.warmingSupported) lines.push(`🌡️ Warming function supported`)
  }

  // Size
  const sv = p.sizeVisualization as Record<string, unknown> | undefined
  if (sv) {
    const dims: string[] = []
    if (sv.length) dims.push(`${sv.length}mm long`)
    if (sv.width) dims.push(`${sv.width}mm wide`)
    if (sv.diameter) dims.push(`${sv.diameter}mm diameter`)
    if (sv.insertableLength) dims.push(`${sv.insertableLength}mm insertable`)
    if (dims.length > 0) lines.push(`📏 Size: ${dims.join(', ')}`)
  }

  // What's in the Box
  if (p.whatsInTheBox) {
    lines.push(`📦 In the box: ${(p.whatsInTheBox as string).replace(/\n/g, ', ')}`)
  }

  // Key Features
  const features = p.features as Array<{ name: string; description: string }> | undefined
  if (features && features.length > 0) {
    lines.push(`✨ Key features: ${features.map(f => f.name).join(', ')}`)
  }

  // Safety
  if (p.safetyInfo) {
    try {
      const safety = typeof p.safetyInfo === 'string' ? JSON.parse(p.safetyInfo) : p.safetyInfo
      const safeTags: string[] = []
      if (safety.bodySafe) safeTags.push('body-safe')
      if (safety.phthalateFree) safeTags.push('phthalate-free')
      if (safety.latexFree) safeTags.push('latex-free')
      if (safeTags.length > 0) lines.push(`✅ Safety: ${safeTags.join(', ')}`)
    } catch { /* skip */ }
  }

  // Category
  const category = p.category as Record<string, unknown> | undefined
  if (category) lines.push(`📂 Category: ${category.name}`)

  // Link
  if (p.slug) lines.push(`🔗 [View Product →](/product/${p.slug})`)

  return lines.join('\n')
}

function formatMinutes(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${mins} min`
}

// ==========================================================
// DEEP PRODUCT SEARCH
// ==========================================================

async function searchProducts(query: string, limit = 3) {
  // Extract meaningful keywords (skip stop words)
  const stopWords = new Set(['what', 'have', 'your', 'show', 'about', 'does', 'that', 'this', 'with', 'from', 'the', 'and', 'for', 'can', 'you', 'tell', 'me', 'more', 'is', 'it', 'are', 'do', 'any', 'how', 'much', 'which', 'best', 'like', 'want', 'need', 'looking'])
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))

  if (searchTerms.length === 0) return []

  try {
    return await db.product.findMany({
      where: {
        published: true,
        OR: searchTerms.flatMap(term => [
          { name: { contains: term, mode: 'insensitive' } },
          { shortDescription: { contains: term, mode: 'insensitive' } },
          { fullDescription: { contains: term, mode: 'insensitive' } },
          { tags: { contains: term, mode: 'insensitive' } },
          { materialInfo: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
        ]),
      },
      take: limit,
      include: {
        category: true,
        variants: true,
        features: { take: 5 },
        sensoryProfile: true,
        sizeVisualization: true,
      },
    })
  } catch {
    return []
  }
}

// Fetch a single product with full context
async function _getProductContext(productIdentifier: string) {
  try {
    return await db.product.findFirst({
      where: {
        published: true,
        OR: [
          { name: { contains: productIdentifier, mode: 'insensitive' } },
          { slug: { contains: productIdentifier, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        variants: true,
        features: true,
        sensoryProfile: true,
        sizeVisualization: true,
        sizeRecommendation: true,
      },
    })
  } catch {
    return null
  }
}

// ==========================================================
// KNOWLEDGE BASE SEARCH
// ==========================================================

async function searchKnowledge(message: string, intent: string | null): Promise<{ answer: string; id: string } | null> {
  const lowerMessage = message.toLowerCase()
  const keywords = lowerMessage.split(/\s+/).filter(w => w.length > 3)

  try {
    // Strategy 1: Direct question match
    let entry = await db.chatbotKnowledge.findFirst({
      where: {
        question: { contains: message, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: { usageCount: 'desc' },
    })

    // Strategy 2: Keyword match with intent filtering
    if (!entry && keywords.length > 0) {
      entry = await db.chatbotKnowledge.findFirst({
        where: {
          AND: [
            { isActive: true },
            {
              OR: keywords.slice(0, 4).map(kw => ({
                keywords: { contains: kw, mode: 'insensitive' as const },
              })),
            },
            // Optionally filter by intent for better precision
            ...(intent ? [{ intent }] : []),
          ],
        },
        orderBy: { usageCount: 'desc' },
      })
    }

    // Strategy 3: Broader keyword match without intent filter
    if (!entry && keywords.length > 0) {
      entry = await db.chatbotKnowledge.findFirst({
        where: {
          OR: keywords.slice(0, 4).map(kw => ({
            keywords: { contains: kw, mode: 'insensitive' as const },
          })),
          isActive: true,
        },
        orderBy: { usageCount: 'desc' },
      })
    }

    if (entry) {
      // Update usage stats
      await db.chatbotKnowledge.update({
        where: { id: entry.id },
        data: { usageCount: { increment: 1 } },
      }).catch(() => { /* non-critical */ })

      return { answer: entry.answer, id: entry.id }
    }
  } catch {
    // Knowledge base may be empty or errored
  }

  return null
}

// ==========================================================
// AI RESPONSE GENERATOR
// ==========================================================

async function generateAIResponse(
  message: string,
  conversation: { id: string; sessionId: string; customerId: string | null; intent?: string | null },
  customerId: string | null,
  _conversationContext: string
): Promise<{
  content: string
  intent: string | null
  confidence: number
  suggestedActions: string[] | null
  relatedProducts: string[] | null
  sentiment: string | null
  needsEscalation: boolean
}> {
  const lowerMessage = message.toLowerCase().trim()

  // ------ INTENT DETECTION ------
  const { intent, confidence } = detectIntent(lowerMessage)

  // ------ SENTIMENT DETECTION ------
  const sentiment = detectSentiment(lowerMessage)

  // ------ GENERATE RESPONSE ------
  let content = ''
  let suggestedActions: string[] | null = null
  let relatedProducts: string[] | null = null
  let needsEscalation = false

  // Step 1: Check knowledge base first
  const kbResult = await searchKnowledge(message, intent)

  // Step 2: For product-related intents, fetch real product data
  const isProductRelated = ['product_inquiry', 'product_recommendation'].includes(intent || '') ||
    lowerMessage.match(/\b(product|size|waterproof|battery|vibrat|quiet|material|silicone|rechargeable|how big|how long|what.?s in|included|features|colors?|variants?)\b/)

  let productContext: string | null = null
  let foundProducts: Array<{ id: string; slug: string; name: string }> = []

  if (isProductRelated) {
    const products = await searchProducts(message)
    if (products.length > 0) {
      foundProducts = products.map(p => ({ id: p.id, slug: p.slug, name: p.name }))
      relatedProducts = products.map(p => p.id)

      if (products.length === 1) {
        // Single product match → give detailed context
        productContext = buildProductBrief(products[0] as unknown as Record<string, unknown>)
      } else {
        // Multiple matches → brief list
        productContext = products
          .map(p => buildProductBrief(p as unknown as Record<string, unknown>))
          .join('\n\n---\n\n')
      }
    }
  }

  // Step 3: Build the response
  if (productContext && foundProducts.length > 0) {
    // Product-aware response
    if (foundProducts.length === 1) {
      content = `Here's what I know about this product:\n\n${productContext}`

      // If asking a specific question about the product, try to answer it directly
      if (lowerMessage.includes('waterproof') || lowerMessage.includes('water')) {
        const p = (await searchProducts(message, 1))[0]
        if (p) {
          const wp = (p as unknown as Record<string, unknown>).waterproofRating
          if (wp) {
            content = `Yes! The **${p.name}** has an **${wp}** waterproof rating — `
            if (wp === 'IPX7') content += 'it\'s fully submersible and safe for bath or shower use. 🚿'
            else if (wp === 'IPX8') content += 'it\'s deep submersible — safe for all water activities.'
            else content += 'it has water resistance for worry-free use.'
            content += `\n\n${productContext}`
          } else {
            content = `The **${p.name}** doesn't have a waterproof rating listed. I'd recommend keeping it dry.\n\n${productContext}`
          }
        }
      } else if (lowerMessage.includes('battery') || lowerMessage.includes('charge') || lowerMessage.includes('how long')) {
        const p = (await searchProducts(message, 1))[0]
        if (p) {
          const product = p as unknown as Record<string, unknown>
          const parts: string[] = []
          if (product.usageTimeMinutes) parts.push(`**${formatMinutes(product.usageTimeMinutes as number)}** of usage per charge`)
          if (product.chargeTimeMinutes) parts.push(`charges in **${formatMinutes(product.chargeTimeMinutes as number)}**`)
          if (product.chargingMethod) parts.push(`via **${(product.chargingMethod as string).replace(/-/g, ' ')}**`)
          if (parts.length > 0) {
            content = `The **${p.name}** has ${parts.join(', ')}. 🔋\n\n${productContext}`
          }
        }
      } else if (lowerMessage.includes('size') || lowerMessage.includes('big') || lowerMessage.includes('dimension') || lowerMessage.includes('measurement')) {
        content = `Here are the full specs for the **${foundProducts[0].name}**:\n\n${productContext}`
      }
    } else {
      content = `I found ${foundProducts.length} products that match:\n\n${productContext}\n\nWould you like more details about any of these?`
    }
    suggestedActions = ['browse_products', 'get_recommendations']
  } else if (kbResult) {
    // Knowledge base response
    content = kbResult.answer
  } else {
    // Fallback: intent-based hardcoded responses
    const result = await generateIntentResponse(intent, lowerMessage, customerId, sentiment)
    content = result.content
    suggestedActions = result.suggestedActions
    relatedProducts = result.relatedProducts
    needsEscalation = result.needsEscalation
  }

  // If we didn't set actions yet, set defaults based on intent
  if (!suggestedActions) {
    suggestedActions = getDefaultActions(intent)
  }

  // Escalation check
  const escalationTriggers = ['speak to someone', 'human', 'real person', 'manager', 'complaint', 'legal', 'lawsuit', 'talk to someone', 'agent']
  if (escalationTriggers.some(t => lowerMessage.includes(t))) {
    needsEscalation = true
    content += '\n\n🔗 I understand you\'d like to speak with a team member. I\'m connecting you to our support team now.'
    suggestedActions = ['escalate_to_support']
  }

  // Empathy for negative sentiment
  if (sentiment === 'negative' && !needsEscalation) {
    content = 'I\'m sorry to hear that. Let me help make things right.\n\n' + content
  }

  return {
    content,
    intent,
    confidence,
    suggestedActions,
    relatedProducts,
    sentiment,
    needsEscalation,
  }
}

// ==========================================================
// INTENT DETECTION
// ==========================================================

function detectIntent(lowerMessage: string): { intent: string; confidence: number } {
  const intentPatterns: Record<string, { patterns: string[]; exactPhrases?: string[]; confidence: number }> = {
    order_status: {
      patterns: ['order', 'tracking', 'where is', 'shipping status', 'delivery', 'my package', 'shipped', 'arrived'],
      exactPhrases: ["where's my order", 'track my order', 'order status', 'when will it arrive'],
      confidence: 0.85,
    },
    returns: {
      patterns: ['return', 'refund', 'exchange', 'send back', 'money back', 'damaged', 'wrong item', 'broken'],
      exactPhrases: ['start a return', 'i want a refund', 'wrong size'],
      confidence: 0.85,
    },
    product_inquiry: {
      patterns: ['product', 'size', 'color', 'available', 'stock', 'how does', 'work', 'best', 'popular', 'new arrivals', 'vibrat', 'silicone', 'waterproof', 'rechargeable', 'quiet', 'powerful', 'materials', 'features'],
      exactPhrases: ['what do you sell', 'show me products', 'what do you have'],
      confidence: 0.75,
    },
    product_recommendation: {
      patterns: ['recommend', 'suggest', 'best for', 'help me choose', 'first time', 'beginner', 'couples', 'solo', 'gift', 'for my partner'],
      exactPhrases: ['what should i get', 'help me pick', 'recommend something'],
      confidence: 0.85,
    },
    account_help: {
      patterns: ['account', 'login', 'password', 'email', 'profile', 'settings', 'sign up', 'register'],
      confidence: 0.8,
    },
    shipping_info: {
      patterns: ['shipping', 'ship', 'deliver', 'delivery time', 'how long', 'cost to ship', 'free shipping', 'international', 'packaging', 'discreet'],
      exactPhrases: ['how long does shipping take', 'is shipping free', 'do you ship internationally'],
      confidence: 0.85,
    },
    payment_help: {
      patterns: ['payment', 'card', 'charge', 'billing', 'pay', 'checkout', 'crypto', 'bitcoin', 'paypal', 'gift card', 'promo code', 'discount', 'coupon'],
      confidence: 0.8,
    },
    privacy_security: {
      patterns: ['privacy', 'discreet', 'billing statement', 'credit card statement', 'packaging look', 'who can see', 'anonymous', 'data', 'secure'],
      exactPhrases: ['is it discreet', 'what shows on my statement', 'is my data safe'],
      confidence: 0.9,
    },
    warranty_care: {
      patterns: ['warranty', 'guarantee', 'defective', 'cleaning', 'care', 'maintain', 'store', 'battery', 'how to clean', 'storage', 'lubricant', 'lube'],
      confidence: 0.8,
    },
    greeting: {
      patterns: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'howdy', 'sup', 'yo'],
      confidence: 0.6,
    },
    thanks: {
      patterns: ['thank', 'thanks', 'appreciate', 'helpful', 'great help'],
      confidence: 0.9,
    },
    general: {
      patterns: ['help', 'support', 'question', 'info', 'about', 'what is calor'],
      confidence: 0.5,
    },
  }

  let bestIntent = 'general'
  let bestScore = 0

  for (const [intentName, config] of Object.entries(intentPatterns)) {
    let score = 0

    if (config.exactPhrases) {
      for (const phrase of config.exactPhrases) {
        if (lowerMessage.includes(phrase)) {
          score = config.confidence + 0.1
          break
        }
      }
    }

    if (score === 0) {
      const matchCount = config.patterns.filter(p => lowerMessage.includes(p)).length
      if (matchCount > 0) {
        score = config.confidence * (0.6 + 0.4 * Math.min(matchCount / 3, 1))
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestIntent = intentName
    }
  }

  return { intent: bestIntent, confidence: Math.min(bestScore || 0.5, 0.99) }
}

// ==========================================================
// SENTIMENT DETECTION
// ==========================================================

function detectSentiment(lowerMessage: string): string {
  const negativeWords = ['angry', 'frustrated', 'disappointed', 'terrible', 'bad', 'worst', 'hate', 'unacceptable', 'awful', 'scam', 'ripped off', 'furious', 'ridiculous']
  const positiveWords = ['great', 'love', 'amazing', 'wonderful', 'excellent', 'fantastic', 'best', 'perfect', 'awesome', 'incredible', 'impressed', 'happy']

  if (negativeWords.some(w => lowerMessage.includes(w))) return 'negative'
  if (positiveWords.some(w => lowerMessage.includes(w))) return 'positive'
  return 'neutral'
}

// ==========================================================
// INTENT-BASED FALLBACK RESPONSES
// ==========================================================

async function generateIntentResponse(
  intent: string | null,
  lowerMessage: string,
  customerId: string | null,
  sentiment: string
): Promise<{
  content: string
  suggestedActions: string[] | null
  relatedProducts: string[] | null
  needsEscalation: boolean
}> {
  let content = ''
  let suggestedActions: string[] | null = null
  const relatedProducts: string[] | null = null
  const needsEscalation = false

  switch (intent) {
    case 'order_status':
      if (customerId) {
        try {
          const recentOrders = await db.order.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 3,
          })
          if (recentOrders.length > 0) {
            const order = recentOrders[0]
            const statusLabels: Record<string, string> = {
              'PENDING': '⏳ Pending', 'PROCESSING': '📦 Being Prepared',
              'SHIPPED': '🚚 On Its Way', 'DELIVERED': '✅ Delivered', 'CANCELLED': '❌ Cancelled',
            }
            content = `Here's your most recent order:\n\n**Order #${order.reference.slice(0, 8).toUpperCase()}**\nStatus: ${statusLabels[order.status] || order.status}\n`
            if (order.trackingNumber) content += `Tracking: ${order.trackingNumber}\n`
            if (order.status === 'PROCESSING') content += '\nWe\'re preparing your order for shipment. You\'ll receive tracking soon!'
            else if (order.status === 'SHIPPED') content += '\nYour order is on its way!'
          } else {
            content = 'I don\'t see any recent orders on your account. You can track a guest order using your order reference number.'
          }
        } catch {
          content = 'I\'m having trouble looking up your orders right now. Please check your account dashboard.'
        }
      } else {
        content = 'I can help you track your order! Please log in to see your orders, or enter your order reference number (starts with CAL-).'
      }
      suggestedActions = ['view_orders', 'track_order']
      break

    case 'returns':
      content = 'Our return policy allows returns within **30 days** of delivery for unused items in original packaging. Free returns on orders over $50.\n\nWould you like to start a return?'
      suggestedActions = sentiment === 'negative'
        ? ['start_return', 'escalate_to_support']
        : ['start_return', 'return_policy']
      break

    case 'product_recommendation':
      content = 'I\'d love to help you find the perfect match! 💫\n\nOur **recommendation quiz** takes about 2 minutes and considers your preferences, experience level, and what you\'re looking for.\n\nOr tell me:\n• Is this for **solo** or **couples** use?\n• Any must-have **features**? (waterproof, quiet, rechargeable)\n• Is this a **gift**?'
      suggestedActions = ['get_recommendations', 'browse_products']
      break

    case 'greeting': {
      const greetings = [
        'Hey there! 🌟 I\'m your CALŌR concierge. I can help you find products, track orders, or answer any questions. What can I do for you?',
        'Hello! ✨ Welcome to CALŌR. Whether you\'re browsing, tracking, or need advice — I\'m here to help!',
        'Hi! 👋 I\'m the CALŌR assistant. I know everything about our products. Ask me anything!',
      ]
      content = greetings[Math.floor(Math.random() * greetings.length)]
      suggestedActions = ['browse_products', 'track_order', 'get_recommendations']
      break
    }

    case 'thanks': {
      const thankResponses = [
        'You\'re welcome! 😊 Happy to help. Don\'t hesitate to reach out anytime!',
        'My pleasure! ✨ Come back whenever you need anything.',
        'Glad I could help! 🌟 Enjoy your experience with CALŌR.',
      ]
      content = thankResponses[Math.floor(Math.random() * thankResponses.length)]
      suggestedActions = ['browse_products', 'get_recommendations']
      break
    }

    default:
      content = 'I\'m here to help! I can assist with:\n\n📦 **Order Tracking**\n🔄 **Returns & Exchanges**\n🛍️ **Product Discovery** — I know every detail about our catalog\n🚚 **Shipping & Payment**\n🔒 **Privacy & Security**\n\nJust ask, or tap an option below!'
      suggestedActions = ['browse_products', 'track_order', 'get_recommendations', 'start_return']
      break
  }

  return { content, suggestedActions, relatedProducts, needsEscalation }
}

function getDefaultActions(intent: string | null): string[] {
  const defaults: Record<string, string[]> = {
    order_status: ['view_orders', 'track_order'],
    returns: ['start_return', 'return_policy'],
    product_inquiry: ['browse_products', 'get_recommendations'],
    product_recommendation: ['get_recommendations', 'browse_products'],
    shipping_info: ['track_order', 'browse_products'],
    payment_help: ['browse_products'],
    privacy_security: ['browse_products', 'shipping_policy'],
    warranty_care: ['browse_products'],
    account_help: ['account_settings', 'reset_password'],
    greeting: ['browse_products', 'track_order', 'get_recommendations'],
    thanks: ['browse_products', 'get_recommendations'],
  }
  return defaults[intent || ''] || ['browse_products', 'track_order', 'get_recommendations']
}
