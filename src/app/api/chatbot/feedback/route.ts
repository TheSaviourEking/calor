import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/chatbot/feedback - Submit feedback for a bot message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messageId, helpful } = body

        if (!messageId || typeof helpful !== 'boolean') {
            return NextResponse.json(
                { error: 'messageId and helpful (boolean) are required' },
                { status: 400 }
            )
        }

        // Find the message
        const message = await db.chatbotMessage.findUnique({
            where: { id: messageId },
        })

        if (!message || message.senderType !== 'bot') {
            return NextResponse.json(
                { error: 'Bot message not found' },
                { status: 404 }
            )
        }

        // If this message was generated from a knowledge base entry,
        // update the KB stats. We match via intent + content similarity
        if (message.intent) {
            try {
                // Find the most recently used KB entry matching this intent
                const kbEntry = await db.chatbotKnowledge.findFirst({
                    where: {
                        intent: message.intent,
                        isActive: true,
                    },
                    orderBy: { updatedAt: 'desc' },
                })

                if (kbEntry) {
                    await db.chatbotKnowledge.update({
                        where: { id: kbEntry.id },
                        data: helpful
                            ? { helpfulCount: { increment: 1 } }
                            : { notHelpfulCount: { increment: 1 } },
                    })
                }
            } catch {
                // Non-critical — feedback still counts
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error processing chatbot feedback:', error)
        return NextResponse.json(
            { error: 'Failed to process feedback' },
            { status: 500 }
        )
    }
}
