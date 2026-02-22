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
        })
      : null

    if (!conversation) {
      const newSessionId = sessionId || nanoid()
      conversation = await db.chatbotConversation.create({
        data: {
          sessionId: newSessionId,
          customerId: customerId || null,
          status: 'active',
        },
      })
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

    // Generate AI response
    const aiResponse = await generateAIResponse(message, conversation, customerId)

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

    // Update conversation with detected intent
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

// AI Response Generator
async function generateAIResponse(
  message: string,
  conversation: { id: string; sessionId: string; customerId: string | null },
  customerId: string | null
): Promise<{
  content: string
  intent: string | null
  confidence: number
  suggestedActions: string[] | null
  relatedProducts: string[] | null
  sentiment: string | null
  needsEscalation: boolean
}> {
  const lowerMessage = message.toLowerCase()

  // Detect intent
  let intent: string | null = null
  let confidence = 0.5
  let sentiment: string | null = 'neutral'

  // Intent detection patterns
  const intentPatterns: Record<string, { patterns: string[]; confidence: number }> = {
    order_status: {
      patterns: ['order', 'tracking', 'where is', 'shipping', 'delivery', 'my package'],
      confidence: 0.8,
    },
    returns: {
      patterns: ['return', 'refund', 'exchange', 'send back', 'money back'],
      confidence: 0.8,
    },
    product_inquiry: {
      patterns: ['product', 'size', 'color', 'available', 'stock', 'how does', 'work'],
      confidence: 0.7,
    },
    account_help: {
      patterns: ['account', 'login', 'password', 'email', 'profile', 'settings'],
      confidence: 0.8,
    },
    shipping_info: {
      patterns: ['shipping', 'ship', 'deliver', 'delivery time', 'how long'],
      confidence: 0.8,
    },
    payment_help: {
      patterns: ['payment', 'card', 'charge', 'billing', 'pay', 'checkout'],
      confidence: 0.8,
    },
    general: {
      patterns: ['help', 'hi', 'hello', 'hey', 'support'],
      confidence: 0.6,
    },
  }

  // Match intent
  for (const [intentName, config] of Object.entries(intentPatterns)) {
    if (config.patterns.some(pattern => lowerMessage.includes(pattern))) {
      intent = intentName
      confidence = config.confidence
      break
    }
  }

  // Sentiment detection
  const negativeWords = ['angry', 'frustrated', 'disappointed', 'terrible', 'bad', 'worst', 'hate', 'unacceptable']
  const positiveWords = ['great', 'love', 'amazing', 'wonderful', 'excellent', 'fantastic', 'best']

  if (negativeWords.some(word => lowerMessage.includes(word))) {
    sentiment = 'negative'
  } else if (positiveWords.some(word => lowerMessage.includes(word))) {
    sentiment = 'positive'
  }

  // Check knowledge base
  const knowledgeEntry = await db.chatbotKnowledge.findFirst({
    where: {
      OR: [
        { question: { contains: message, mode: 'insensitive' } },
        { keywords: { contains: message.split(' ')[0], mode: 'insensitive' } },
      ],
      isActive: true,
    },
  })

  // Generate response based on intent
  let content = ''
  let suggestedActions: string[] | null = null
  let relatedProducts: string[] | null = null
  let needsEscalation = false

  if (knowledgeEntry) {
    // Use knowledge base response
    content = knowledgeEntry.answer
    confidence = Math.max(confidence, 0.9)

    // Update usage stats
    await db.chatbotKnowledge.update({
      where: { id: knowledgeEntry.id },
      data: { usageCount: { increment: 1 } },
    })
  } else {
    // Generate response based on intent
    switch (intent) {
      case 'order_status':
        if (customerId) {
          // Fetch recent orders
          const recentOrders = await db.order.findMany({ /* take: handled */
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            take: 3,
          })

          if (recentOrders.length > 0) {
            const order = recentOrders[0]
            content = `I found your most recent order #${order.reference.slice(0, 8).toUpperCase()}. It's currently "${order.status.replace('_', ' ')}". `
            
            if (order.trackingNumber) {
              content += `Your tracking number is ${order.trackingNumber}.`
            } else if (order.status === 'SHIPPED') {
              content += `It's on its way to you!`
            } else if (order.status === 'PROCESSING') {
              content += `We're preparing your order for shipment.`
            }
          } else {
            content = `I couldn't find any recent orders associated with your account. Would you like to check an order using your order number?`
          }
        } else {
          content = `I'd be happy to help you check your order status! Please provide your order number (starts with CAL-) or log in to your account.`
        }
        suggestedActions = ['view_orders', 'track_order']
        break

      case 'returns':
        content = `Our return policy allows returns within 30 days of delivery for unused items in original packaging. `
        content += `To start a return, you can visit our Returns Portal or I can help guide you through the process.`
        suggestedActions = ['start_return', 'return_policy']
        break

      case 'product_inquiry':
        content = `I can help you find information about our products. `
        content += `Are you looking for a specific product, or would you like recommendations?`
        suggestedActions = ['search_products', 'get_recommendations']

        // Try to find relevant products
        const searchTerms = message.split(' ').filter(w => w.length > 3)
        if (searchTerms.length > 0) {
          const products = await db.product.findMany({ /* take: handled */
            where: {
              OR: searchTerms.map(term => ({
                name: { contains: term, mode: 'insensitive' },
              })),
              published: true,
            },
            take: 3,
          })
          if (products.length > 0) {
            relatedProducts = products.map(p => p.id)
          }
        }
        break

      case 'shipping_info':
        content = `We offer several shipping options:\n`
        content += `• Standard Shipping (5-7 business days) - Free on orders over $50\n`
        content += `• Express Shipping (2-3 business days) - $9.99\n`
        content += `• Overnight Shipping (1 business day) - $19.99\n\n`
        content += `All orders are shipped in discreet, unmarked packaging for your privacy.`
        suggestedActions = ['shipping_policy', 'track_order']
        break

      case 'payment_help':
        content = `We accept several payment methods:\n`
        content += `• Credit/Debit Cards (Visa, Mastercard, American Express)\n`
        content += `• PayPal\n`
        content += `• Cryptocurrency (Bitcoin, Ethereum)\n`
        content += `• Gift Cards\n\n`
        content += `All transactions are secure and encrypted. Your privacy is our priority.`
        break

      case 'account_help':
        content = `I can help with account-related questions. `
        if (customerId) {
          content += `You're currently logged in. What would you like help with?`
        } else {
          content += `Would you like to log in, create an account, or recover your password?`
        }
        suggestedActions = ['account_settings', 'reset_password']
        break

      case 'general':
      default:
        content = `Hello! I'm the CALŌR virtual assistant. I can help you with:\n`
        content += `• Order status and tracking\n`
        content += `• Returns and exchanges\n`
        content += `• Product information and recommendations\n`
        content += `• Shipping and payment questions\n`
        content += `• Account assistance\n\n`
        content += `How can I help you today?`
        suggestedActions = ['track_order', 'start_return', 'browse_products']
        break
    }
  }

  // Check for escalation triggers
  const escalationTriggers = ['speak to someone', 'human', 'manager', 'complaint', 'legal', 'lawsuit']
  if (escalationTriggers.some(trigger => lowerMessage.includes(trigger))) {
    needsEscalation = true
    content += `\n\nI understand you'd like to speak with a team member. Let me connect you with our support team.`
    suggestedActions = ['escalate_to_support']
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
