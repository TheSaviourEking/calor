import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import { createServiceLogger } from '../logger'

const log = createServiceLogger('support-chat')
const PORT = Number(process.env.PORT) || 3031
const db = new PrismaClient()

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

    pubClient.on('error', (err) => log.error({ err }, '[Support Chat] Redis Pub Error'))
    subClient.on('error', (err) => log.error({ err }, '[Support Chat] Redis Sub Error'))

    await Promise.all([pubClient.connect(), subClient.connect()])
    const key = process.env.REDIS_KEY_PREFIX || `calor:${process.env.NODE_ENV || 'prod'}:support-chat`
    io.adapter(createAdapter(pubClient, subClient, { key }))
    log.act('redis_adapter_connected', { keyPrefix: key })
  } catch (err) {
    log.error({ err }, '[Support Chat] Failed to initialize Redis adapter')
  }
}

function generateSessionId(): string {
  return `session_${randomBytes(16).toString('hex')}`
}

const adminSockets = new Map<string, string>() // socketId -> adminId

io.on('connection', (socket) => {
  log.act('client_connected', { socketId: socket.id })

  // Admin authentication
  socket.on('admin_auth', (data: { adminId: string; token?: string }) => {
    adminSockets.set(socket.id, data.adminId)
    socket.join('admin_dashboard')
    socket.emit('admin_authenticated', { success: true })
    log.act('admin_auth', { socketId: socket.id, adminId: data.adminId, token: data.token })
  })

  // Admin lists all sessions
  socket.on('admin_list_sessions', async () => {
    try {
      const sessions = await db.supportChatSession.findMany({
        where: { status: { in: ['active', 'closed'] } },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
      socket.emit('sessions_list', { sessions })
      log.act('admin_list_sessions', { socketId: socket.id, count: sessions.length })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error listing sessions')
      socket.emit('error', { message: 'Failed to list sessions' })
    }
  })

  // Admin joins a specific session
  socket.on('admin_join_session', async (data: { sessionId: string }) => {
    try {
      const session = await db.supportChatSession.findUnique({
        where: { sessionId: data.sessionId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      })
      if (session) {
        socket.join(data.sessionId)
        socket.emit('session_messages', {
          sessionId: data.sessionId,
          messages: session.messages.map(m => ({
            id: m.id,
            isFromCustomer: m.isFromCustomer,
            message: m.message,
            timestamp: m.createdAt,
          })),
          customer: session.customer,
        })
        log.act('admin_join_session', { socketId: socket.id, sessionId: data.sessionId })
      }
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error joining session')
    }
  })

  // Admin sends a message to a session
  socket.on('admin_send_message', async (data: { sessionId: string; message: string }) => {
    try {
      const session = await db.supportChatSession.findUnique({
        where: { sessionId: data.sessionId },
      })
      if (!session) return

      const message = await db.supportMessage.create({
        data: {
          sessionId: session.id,
          isFromCustomer: false,
          message: data.message,
        },
      })

      io.to(data.sessionId).emit('message', {
        id: message.id,
        isFromCustomer: false,
        message: message.message,
        timestamp: message.createdAt,
      })
      log.act('admin_send_message', {
        socketId: socket.id,
        sessionId: data.sessionId,
        messageId: message.id,
        message: data.message, // Auto-redacted by Pino
      })
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error sending admin message')
    }
  })

  // Admin closes a session
  socket.on('admin_close_session', async (data: { sessionId: string }) => {
    try {
      await db.supportChatSession.updateMany({
        where: { sessionId: data.sessionId },
        data: { status: 'resolved', closedAt: new Date() },
      })
      io.to(data.sessionId).emit('session_ended', { sessionId: data.sessionId })
      socket.leave(data.sessionId)
      log.act('admin_close_session', { socketId: socket.id, sessionId: data.sessionId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error closing session')
    }
  })

  // Customer initiates a support chat
  socket.on('start_session', async (data: { customerId?: string }) => {
    try {
      const sessionId = generateSessionId()

      const session = await db.supportChatSession.create({
        data: {
          sessionId,
          customerId: data.customerId || null,
        },
      })

      socket.join(sessionId)
      socket.emit('session_started', { sessionId })

      // Notify admin dashboard of new session
      io.to('admin_dashboard').emit('new_session', {
        sessionId,
        customerId: data.customerId,
        createdAt: new Date(),
      })

      // Send welcome message and persist it
      const welcomeMessage = await db.supportMessage.create({
        data: {
          sessionId: session.id,
          isFromCustomer: false,
          message: 'Hello! Thanks for reaching out. How can we help you today? Your privacy is important to us - this conversation is anonymous and secure.',
        },
      })

      socket.emit('message', {
        id: welcomeMessage.id,
        isFromCustomer: false,
        message: welcomeMessage.message,
        timestamp: welcomeMessage.createdAt,
      })

      log.act('start_session', { socketId: socket.id, sessionId, customerId: data.customerId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id }, 'Error starting session')
      socket.emit('error', { message: 'Failed to start session' })
    }
  })

  // Customer rejoins existing session
  socket.on('rejoin_session', async (data: { sessionId: string }) => {
    try {
      const session = await db.supportChatSession.findUnique({
        where: { sessionId: data.sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (session) {
        socket.join(data.sessionId)
        socket.emit('session_rejoined', {
          sessionId: data.sessionId,
          messages: session.messages.map((m) => ({
            id: m.id,
            isFromCustomer: m.isFromCustomer,
            message: m.message,
            timestamp: m.createdAt,
          })),
        })
        log.act('rejoin_session', { socketId: socket.id, sessionId: data.sessionId })
      } else {
        socket.emit('error', { message: 'Session not found' })
      }
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error rejoining session')
      socket.emit('error', { message: 'Failed to rejoin session' })
    }
  })

  // Customer sends message
  socket.on('send_message', async (data: { sessionId: string; message: string }) => {
    try {
      const session = await db.supportChatSession.findUnique({
        where: { sessionId: data.sessionId },
      })

      if (!session) {
        socket.emit('error', { message: 'Session not found' })
        return
      }

      const message = await db.supportMessage.create({
        data: {
          sessionId: session.id,
          isFromCustomer: true,
          message: data.message,
        },
      })

      // Broadcast to the session room
      io.to(data.sessionId).emit('message', {
        id: message.id,
        isFromCustomer: true,
        message: message.message,
        timestamp: message.createdAt,
      })

      // Notify admin dashboard of new message
      io.to('admin_dashboard').emit('new_session_message', {
        sessionId: data.sessionId,
        message: message.message,
        timestamp: message.createdAt,
      })

      log.act('send_message', {
        socketId: socket.id,
        sessionId: data.sessionId,
        messageId: message.id,
        message: data.message, // Auto-redacted by Pino
      })

      // Check if an admin is in this session room
      const room = io.sockets.adapter.rooms.get(data.sessionId)
      const adminInRoom = room ? [...room].some(sid => adminSockets.has(sid)) : false

      if (!adminInRoom) {
        // Auto-response (in production, route to real support agents)
        setTimeout(async () => {
          const autoResponses = [
            "Thanks for your message. Let me look into that for you.",
            "I understand. Can you tell me a bit more about what you're looking for?",
            "Great question! I'm happy to help with that.",
            "I'll check on that right away. Is there anything else you'd like to know?",
            "Thanks for your patience. I'm looking into this now.",
          ]

          const response = await db.supportMessage.create({
            data: {
              sessionId: session.id,
              isFromCustomer: false,
              message: autoResponses[Math.floor(Math.random() * autoResponses.length)],
            },
          })

          io.to(data.sessionId).emit('message', {
            id: response.id,
            isFromCustomer: false,
            message: response.message,
            timestamp: response.createdAt,
          })
          log.act('auto_response', { sessionId: data.sessionId, responseId: response.id })
        }, 1500)
      }
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error sending message')
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // End session
  socket.on('end_session', async (data: { sessionId: string }) => {
    try {
      await db.supportChatSession.updateMany({
        where: { sessionId: data.sessionId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      })

      socket.leave(data.sessionId)
      socket.emit('session_ended', { sessionId: data.sessionId })
      log.act('end_session', { socketId: socket.id, sessionId: data.sessionId })
    } catch (error) {
      log.error({ err: error, socketId: socket.id, sessionId: data.sessionId }, 'Error ending session')
    }
  })

  // Typing indicator
  socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
    socket.to(data.sessionId).emit('user_typing', { isTyping: data.isTyping })
  })

  socket.on('disconnect', () => {
    adminSockets.delete(socket.id)
    log.act('client_disconnected', { socketId: socket.id })
  })
})

httpServer.listen(PORT, () => {
  log.info({ port: PORT }, `Support chat service running on port ${PORT}`)
})
