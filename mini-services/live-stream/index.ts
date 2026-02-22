import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PORT = 3032

// In-memory state for active streams
const streamViewers = new Map<string, Set<string>>() // streamId -> Set of socketIds
const viewerSessions = new Map<string, { streamId: string; customerId?: string; guestId?: string }>()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://calorco.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

io.on('connection', (socket) => {
  console.log(`[Live Stream] Client connected: ${socket.id}`)

  // ============ STREAM JOIN/LEAVE ============
  socket.on('join_stream', async (data) => {
    try {
      const { streamId, customerId, guestId } = data

      // Verify stream exists and is accessible
      const stream = await db.liveStream.findUnique({
        where: { id: streamId },
        include: { host: true },
      })

      if (!stream) {
        socket.emit('error', { message: 'Stream not found' })
        return
      }

      // Join the stream room
      socket.join(`stream:${streamId}`)

      // Track viewer
      if (!streamViewers.has(streamId)) {
        streamViewers.set(streamId, new Set())
      }
      streamViewers.get(streamId)!.add(socket.id)
      viewerSessions.set(socket.id, { streamId, customerId, guestId })

      // Create viewer record if not exists
      if (customerId) {
        await db.streamViewer.upsert({
          where: {
            streamId_customerId: { streamId, customerId },
          },
          create: {
            streamId,
            customerId,
            joinedAt: new Date(),
          },
          update: {
            leftAt: null,
            joinedAt: new Date(),
          },
        })
      } else if (guestId) {
        await db.streamViewer.upsert({
          where: {
            streamId_guestId: { streamId, guestId },
          },
          create: {
            streamId,
            guestId,
            joinedAt: new Date(),
          },
          update: {
            leftAt: null,
            joinedAt: new Date(),
          },
        })
      }

      // Update viewer count
      const viewerCount = streamViewers.get(streamId)?.size || 0

      // Update peak viewers if needed
      if (viewerCount > stream.peakViewers) {
        await db.liveStream.update({
          where: { id: streamId },
          data: { peakViewers: viewerCount },
        })
      }

      // Send current state to joiner
      socket.emit('stream_joined', {
        streamId,
        viewerCount,
        stream: {
          id: stream.id,
          title: stream.title,
          status: stream.status,
          host: {
            id: stream.host.id,
            displayName: stream.host.displayName,
            avatar: stream.host.avatar,
          },
        },
      })

      // Broadcast viewer count update
      io.to(`stream:${streamId}`).emit('viewer_count_update', {
        streamId,
        viewerCount,
      })

      console.log(`[Live Stream] Client ${socket.id} joined stream ${streamId}`)
    } catch (error) {
      console.error('Error joining stream:', error)
      socket.emit('error', { message: 'Failed to join stream' })
    }
  })

  socket.on('leave_stream', async (data) => {
    try {
      const { streamId } = data
      await handleLeaveStream(socket, streamId)
    } catch (error) {
      console.error('Error leaving stream:', error)
    }
  })

  // ============ CHAT ============
  socket.on('send_message', async (data) => {
    try {
      const { streamId, message, type, customerId, guestName, guestId } = data

      // Rate limit check (basic - in production use proper rate limiting)
      const recentMessages = await db.streamChatMessage.count({
        where: {
          streamId,
          createdAt: { gte: new Date(Date.now() - 1000) }, // Last second
          OR: [
            { customerId },
            { guestId },
          ],
        },
      })

      if (recentMessages >= 3) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      // Check if chat is allowed
      const stream = await db.liveStream.findUnique({
        where: { id: streamId },
        select: { allowChat: true, moderatedChat: true },
      })

      if (!stream?.allowChat) {
        socket.emit('error', { message: 'Chat is disabled' })
        return
      }

      // Create message
      const chatMessage = await db.streamChatMessage.create({
        data: {
          streamId,
          message,
          type: type || 'chat',
          customerId: customerId || null,
          guestName: guestName || null,
          guestId: guestId || null,
          isModerated: stream.moderatedChat,
        },
        include: {
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      })

      // If moderated, only send to host
      if (stream.moderatedChat) {
        socket.emit('message_pending', { message: chatMessage })
        // TODO: Send to host for moderation
      } else {
        // Broadcast to all viewers
        io.to(`stream:${streamId}`).emit('new_message', {
          streamId,
          message: chatMessage,
        })
      }

      // Update message count
      await db.liveStream.update({
        where: { id: streamId },
        data: { totalChatMessages: { increment: 1 } },
      })
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { streamId, messageId, reactionType } = data

      const message = await db.streamChatMessage.findUnique({
        where: { id: messageId },
      })

      if (!message) return

      const reactions = message.reactionCounts ? JSON.parse(message.reactionCounts) : {}
      reactions[reactionType] = (reactions[reactionType] || 0) + 1

      await db.streamChatMessage.update({
        where: { id: messageId },
        data: { reactionCounts: JSON.stringify(reactions) },
      })

      io.to(`stream:${streamId}`).emit('reaction_added', {
        streamId,
        messageId,
        reactionType,
        count: reactions[reactionType],
      })
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  })

  // ============ PRODUCTS ============
  socket.on('feature_product', async (data) => {
    try {
      const { streamId, productId, hostNotes } = data

      await db.streamProduct.updateMany({
        where: { streamId },
        data: { isPinned: false },
      })

      const streamProduct = await db.streamProduct.update({
        where: { streamId_productId: { streamId, productId } },
        data: {
          isPinned: true,
          featuredAt: new Date(),
          hostNotes,
        },
        include: {
          product: {
            include: {
              images: { take: 1 },
              variants: { take: 1 },
            },
          },
        },
      })

      io.to(`stream:${streamId}`).emit('product_featured', {
        streamId,
        product: streamProduct,
      })
    } catch (error) {
      console.error('Error featuring product:', error)
    }
  })

  // ============ OFFERS ============
  socket.on('activate_offer', async (data) => {
    try {
      const { streamId, offerId } = data

      const offer = await db.streamOffer.update({
        where: { id: offerId },
        data: { isActive: true },
      })

      io.to(`stream:${streamId}`).emit('offer_activated', {
        streamId,
        offer,
      })
    } catch (error) {
      console.error('Error activating offer:', error)
    }
  })

  socket.on('claim_offer', async (data) => {
    try {
      const { streamId, offerId, customerId } = data

      const offer = await db.streamOffer.findUnique({
        where: { id: offerId },
      })

      if (!offer) {
        socket.emit('error', { message: 'Offer not found' })
        return
      }

      // Check quantity
      if (offer.quantityLimit !== null && offer.claimedCount >= offer.quantityLimit) {
        socket.emit('offer_exhausted', { streamId, offerId })
        return
      }

      // Increment claim count atomically
      const updatedOffer = await db.streamOffer.update({
        where: { id: offerId },
        data: {
          claimedCount: { increment: 1 },
          claimCount: { increment: 1 },
        },
      })

      socket.emit('offer_claimed', {
        streamId,
        offerId,
        promoCode: offer.promoCode,
      })

      // Broadcast remaining quantity
      io.to(`stream:${streamId}`).emit('offer_update', {
        streamId,
        offerId,
        claimedCount: updatedOffer.claimedCount,
        remaining: offer.quantityLimit ? offer.quantityLimit - updatedOffer.claimedCount : null,
      })
    } catch (error) {
      console.error('Error claiming offer:', error)
      socket.emit('error', { message: 'Failed to claim offer' })
    }
  })

  // ============ ANALYTICS ============
  socket.on('product_click', async (data) => {
    try {
      const { streamId, productId } = data

      await Promise.all([
        db.streamProduct.update({
          where: { streamId_productId: { streamId, productId } },
          data: { clickCount: { increment: 1 } },
        }),
        db.liveStream.update({
          where: { id: streamId },
          data: { totalProductsClicked: { increment: 1 } },
        }),
      ])
    } catch (error) {
      console.error('Error tracking product click:', error)
    }
  })

  socket.on('cart_add', async (data) => {
    try {
      const { streamId, productId } = data

      await Promise.all([
        db.streamProduct.update({
          where: { streamId_productId: { streamId, productId } },
          data: { cartAddCount: { increment: 1 } },
        }),
        db.liveStream.update({
          where: { id: streamId },
          data: { totalCartAdds: { increment: 1 } },
        }),
      ])
    } catch (error) {
      console.error('Error tracking cart add:', error)
    }
  })

  // ============ HOST CONTROLS ============
  socket.on('pin_message', async (data) => {
    try {
      const { streamId, messageId } = data

      // Unpin all other messages
      await db.streamChatMessage.updateMany({
        where: { streamId, isPinned: true },
        data: { isPinned: false },
      })

      await db.streamChatMessage.update({
        where: { id: messageId },
        data: { isPinned: true },
      })

      io.to(`stream:${streamId}`).emit('message_pinned', {
        streamId,
        messageId,
      })
    } catch (error) {
      console.error('Error pinning message:', error)
    }
  })

  socket.on('highlight_message', async (data) => {
    try {
      const { streamId, messageId } = data

      await db.streamChatMessage.update({
        where: { id: messageId },
        data: { isHighlighted: true },
      })

      io.to(`stream:${streamId}`).emit('message_highlighted', {
        streamId,
        messageId,
      })
    } catch (error) {
      console.error('Error highlighting message:', error)
    }
  })

  // ============ DISCONNECT ============
  socket.on('disconnect', async () => {
    console.log(`[Live Stream] Client disconnected: ${socket.id}`)

    const session = viewerSessions.get(socket.id)
    if (session) {
      await handleLeaveStream(socket, session.streamId)
      viewerSessions.delete(socket.id)
    }
  })
})

async function handleLeaveStream(socket: any, streamId: string) {
  const viewers = streamViewers.get(streamId)
  if (viewers) {
    viewers.delete(socket.id)

    // Update viewer count
    const viewerCount = viewers.size
    io.to(`stream:${streamId}`).emit('viewer_count_update', {
      streamId,
      viewerCount,
    })

    // Update viewer record
    const session = viewerSessions.get(socket.id)
    if (session) {
      if (session.customerId) {
        await db.streamViewer.updateMany({
          where: {
            streamId,
            customerId: session.customerId,
            leftAt: null,
          },
          data: { leftAt: new Date() },
        })
      } else if (session.guestId) {
        await db.streamViewer.updateMany({
          where: {
            streamId,
            guestId: session.guestId,
            leftAt: null,
          },
          data: { leftAt: new Date() },
        })
      }
    }
  }

  socket.leave(`stream:${streamId}`)
}

httpServer.listen(PORT, () => {
  console.log(`[Live Stream] WebSocket server running on port ${PORT}`)
})
