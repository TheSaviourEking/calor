import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import { createServiceLogger } from '../logger'
import { verifyRealtimeToken, type RealtimeUser } from '../realtime-token'
import { canControlStream, cleanMessage } from '../authz'

const log = createServiceLogger('live-stream')
const db = new PrismaClient()

const PORT = Number(process.env.PORT) || 3032
const REALTIME_TOKEN_SECRET = process.env.REALTIME_TOKEN_SECRET
const MAX_CHAT_LENGTH = 500

if (!REALTIME_TOKEN_SECRET) {
  log.warn('REALTIME_TOKEN_SECRET is not set — every connection is anonymous and host controls are disabled')
}

// Last-resort safety net: log a stray rejection instead of letting it end the process
process.on('unhandledRejection', (err) => log.error({ err }, '[Live Stream] Unhandled rejection'))

// Reaction types the viewer UI sends
const ALLOWED_REACTIONS = new Set(['heart'])

// offerId -> customerIds that have claimed it. Per-instance memory: it holds one
// claim per customer per offer, which also satisfies any perCustomerLimit.
const claimedBy = new Map<string, Set<string>>()
// offerId -> customerIds with a claim in flight, reserved before any await so a
// burst of claim events from one customer cannot all pass the check
const claimPending = new Map<string, Set<string>>()

// An id from a payload, or null unless it is a non-empty string.
// Prisma drops an undefined where-value, so a bad id must never reach a query.
const idOf = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

// In-memory state for active streams
const streamViewers = new Map<string, Set<string>>() // streamId -> Set of socketIds
const viewerSessions = new Map<string, { streamId: string; customerId?: string; guestId?: string }>()

function parseAllowedOrigins(raw?: string): string[] {
  if (!raw) return ['http://localhost:3000', 'https://calo.one', 'https://www.calo.one', 'https://staging.calo.one', 'https://calor-rose.vercel.app']
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
}

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: parseAllowedOrigins(process.env.SOCKET_IO_ORIGINS),
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Redis Adapter for multi-instance synchronization (both staging and prod)
if (process.env.REDIS_URL) {
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()

    pubClient.on('error', (err) => log.error({ err }, '[Live Stream] Redis Pub Error'))
    subClient.on('error', (err) => log.error({ err }, '[Live Stream] Redis Sub Error'))

    await Promise.all([pubClient.connect(), subClient.connect()])
    const key = process.env.REDIS_KEY_PREFIX || `calor:${process.env.NODE_ENV || 'prod'}:live-stream`
    io.adapter(createAdapter(pubClient, subClient, { key }))
    log.act('redis_adapter_connected', { keyPrefix: key })
  } catch (err) {
    log.error({ err }, '[Live Stream] Failed to initialize Redis adapter')
  }
}

async function getRoomViewerCount(streamId: string): Promise<number> {
  try {
    const sockets = await io.in(`stream:${streamId}`).fetchSockets()
    return sockets.length
  } catch {
    return streamViewers.get(streamId)?.size || 0
  }
}

// Identify the connection from the handshake token. Viewers may be anonymous.
io.use(async (socket, next) => {
  socket.data.user = await verifyRealtimeToken(socket.handshake.auth?.token, REALTIME_TOKEN_SECRET)
  next()
})

io.on('connection', (socket) => {
  log.act('client_connected', { socketId: socket.id })

  const user = socket.data.user as RealtimeUser | null

  const inStream = (streamId: unknown): streamId is string =>
    typeof streamId === 'string' && socket.rooms.has(`stream:${streamId}`)

  // Host controls: the stream's own host or an admin
  const mayControl = async (streamId: unknown): Promise<boolean> => {
    if (typeof streamId === 'string' && user) {
      const stream = await db.liveStream.findUnique({ where: { id: streamId }, select: { hostId: true } })
      if (canControlStream(user, stream)) return true
    }
    socket.emit('error', { message: 'Not allowed' })
    return false
  }

  // ============ STREAM JOIN/LEAVE ============
  socket.on('join_stream', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      if (!streamId) {
        socket.emit('error', { message: 'Stream not found' })
        return
      }
      // A customer id is only recorded when the handshake token proves it
      const customerId = user?.customerId
      const guestId = customerId ? undefined : typeof data?.guestId === 'string' ? data.guestId.slice(0, 64) : undefined

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

      // Update viewer count (clustered across instances via Redis)
      const viewerCount = await getRoomViewerCount(streamId)

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

      log.act('join_stream', { socketId: socket.id, streamId, customerId, guestId, viewerCount })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error joining stream')
      socket.emit('error', { message: 'Failed to join stream' })
    }
  })

  socket.on('leave_stream', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      if (!streamId) return
      await handleLeaveStream(socket, streamId)
      log.act('leave_stream', { socketId: socket.id, streamId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error leaving stream')
    }
  })

  // ============ CHAT ============
  socket.on('send_message', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const message = cleanMessage(data?.message, MAX_CHAT_LENGTH)
      if (!inStream(streamId) || !message) {
        socket.emit('error', { message: 'Join the stream before chatting' })
        return
      }
      const type = data?.type === 'question' ? 'question' : 'chat'
      const customerId = user?.customerId
      const guestId = customerId ? undefined : viewerSessions.get(socket.id)?.guestId
      const guestName = customerId ? undefined : cleanMessage(data?.guestName, 40) ?? 'Guest'

      // Rate limit check (basic - in production use proper rate limiting)
      const recentMessages = await db.streamChatMessage.count({
        where: {
          streamId,
          createdAt: { gte: new Date(Date.now() - 1000) }, // Last second
          ...(customerId ? { customerId } : { guestId: guestId ?? '__none__' }),
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
          type,
          customerId: customerId || null,
          guestName: guestName || null,
          guestId: guestId || null,
          isModerated: stream.moderatedChat,
        },
        include: {
          customer: {
            select: { firstName: true },
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

      log.act('send_message', {
        socketId: socket.id,
        streamId,
        messageId: chatMessage.id,
        message, // Auto-redacted by Pino
        customerId,
        guestName,
      })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error sending message')
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Reactions
  socket.on('add_reaction', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const messageId = idOf(data?.messageId)
      const reactionType = cleanMessage(data?.reactionType, 20)
      if (!inStream(streamId) || !messageId || !reactionType || !ALLOWED_REACTIONS.has(reactionType)) return

      const message = await db.streamChatMessage.findFirst({
        where: { id: messageId, streamId },
      })

      if (!message) return

      // No prototype, so a stored key like __proto__ can never be read back
      const reactions: Record<string, number> = Object.create(null)
      if (message.reactionCounts) {
        const parsed = JSON.parse(message.reactionCounts)
        for (const key of Object.keys(parsed ?? {})) {
          if (typeof parsed[key] === 'number') reactions[key] = parsed[key]
        }
      }
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
      log.act('add_reaction', { socketId: socket.id, streamId, messageId, reactionType })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error adding reaction')
    }
  })

  // ============ PRODUCTS ============
  socket.on('feature_product', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const productId = idOf(data?.productId)
      const hostNotes = typeof data?.hostNotes === 'string' ? data.hostNotes : undefined
      if (!streamId || !productId) return
      if (!(await mayControl(streamId))) return

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
      log.act('feature_product', { socketId: socket.id, streamId, productId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error featuring product')
    }
  })

  // ============ OFFERS ============
  socket.on('activate_offer', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const offerId = idOf(data?.offerId)
      if (!streamId || !offerId) return
      if (!(await mayControl(streamId))) return

      // The offer must belong to this stream
      const activated = await db.streamOffer.updateMany({
        where: { id: offerId, streamId },
        data: { isActive: true },
      })
      if (activated.count !== 1) return

      const offer = await db.streamOffer.findUnique({ where: { id: offerId } })

      io.to(`stream:${streamId}`).emit('offer_activated', {
        streamId,
        offer,
      })
      log.act('activate_offer', { socketId: socket.id, streamId, offerId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error activating offer')
    }
  })

  socket.on('claim_offer', async (data) => {
    const streamId = idOf(data?.streamId)
    const offerId = idOf(data?.offerId)
    if (!inStream(streamId) || !offerId) return
    const claimantId = user?.customerId
    if (!claimantId) {
      socket.emit('error', { message: 'Sign in to claim offers' })
      return
    }

    // Check and reserve synchronously, before any await
    if (claimPending.get(offerId)?.has(claimantId)) return // a claim is already in flight
    const repeat = !!claimedBy.get(offerId)?.has(claimantId)
    if (!repeat) {
      if (!claimPending.has(offerId)) claimPending.set(offerId, new Set())
      claimPending.get(offerId)!.add(claimantId)
    }

    try {
      const offer = await db.streamOffer.findFirst({
        where: { id: offerId, streamId, isActive: true },
      })

      if (!offer) {
        socket.emit('error', { message: 'Offer not found' })
        return
      }

      // One claim per customer per offer: repeat the answer, do not increment
      if (repeat) {
        socket.emit('offer_claimed', { streamId, offerId, promoCode: offer.promoCode })
        return
      }

      // Claim in one conditional update so a limited offer cannot be over-claimed
      const claimed = await db.streamOffer.updateMany({
        where: {
          id: offerId,
          streamId,
          isActive: true,
          ...(offer.quantityLimit !== null && { claimedCount: { lt: offer.quantityLimit } }),
        },
        data: {
          claimedCount: { increment: 1 },
          claimCount: { increment: 1 },
        },
      })

      if (claimed.count !== 1) {
        socket.emit('offer_exhausted', { streamId, offerId })
        return
      }

      if (!claimedBy.has(offerId)) claimedBy.set(offerId, new Set())
      claimedBy.get(offerId)!.add(claimantId)

      const updatedOffer = await db.streamOffer.findUniqueOrThrow({ where: { id: offerId } })

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
      log.act('claim_offer', { socketId: socket.id, streamId, offerId, customerId: user?.customerId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error claiming offer')
      socket.emit('error', { message: 'Failed to claim offer' })
    } finally {
      if (!repeat) {
        claimPending.get(offerId)?.delete(claimantId)
        if (claimPending.get(offerId)?.size === 0) claimPending.delete(offerId)
      }
    }
  })

  // ============ ANALYTICS ============
  socket.on('product_click', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const productId = idOf(data?.productId)
      if (!inStream(streamId) || !productId) return

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
      log.act('product_click', { socketId: socket.id, streamId, productId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error tracking product click')
    }
  })

  socket.on('cart_add', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const productId = idOf(data?.productId)
      if (!inStream(streamId) || !productId) return

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
      log.act('cart_add', { socketId: socket.id, streamId, productId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error tracking cart add')
    }
  })

  // ============ HOST CONTROLS ============
  socket.on('pin_message', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const messageId = idOf(data?.messageId)
      if (!streamId || !messageId) return
      if (!(await mayControl(streamId))) return

      // Unpin all other messages
      await db.streamChatMessage.updateMany({
        where: { streamId, isPinned: true },
        data: { isPinned: false },
      })

      const pinned = await db.streamChatMessage.updateMany({
        where: { id: messageId, streamId },
        data: { isPinned: true },
      })
      if (pinned.count !== 1) return

      io.to(`stream:${streamId}`).emit('message_pinned', {
        streamId,
        messageId,
      })
      log.act('pin_message', { socketId: socket.id, streamId, messageId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error pinning message')
    }
  })

  socket.on('highlight_message', async (data) => {
    try {
      const streamId = idOf(data?.streamId)
      const messageId = idOf(data?.messageId)
      if (!streamId || !messageId) return
      if (!(await mayControl(streamId))) return

      const highlighted = await db.streamChatMessage.updateMany({
        where: { id: messageId, streamId },
        data: { isHighlighted: true },
      })
      if (highlighted.count !== 1) return

      io.to(`stream:${streamId}`).emit('message_highlighted', {
        streamId,
        messageId,
      })
      log.act('highlight_message', { socketId: socket.id, streamId, messageId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error highlighting message')
    }
  })

  // ============ DISCONNECT ============
  socket.on('disconnect', async () => {
    log.act('client_disconnected', { socketId: socket.id })

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

    // Update viewer count (clustered across instances via Redis)
    const viewerCount = await getRoomViewerCount(streamId)
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
  log.info({ port: PORT }, `[Live Stream] WebSocket server running on port ${PORT}`)
})
