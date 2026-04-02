import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const PORT = 3031
const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_ORIGINS?.split(',') || ['http://localhost:3000', 'https://calorco.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

function generateSessionId(): string {
  return `session_${randomBytes(16).toString('hex')}`
}

const adminSockets = new Map<string, string>() // socketId -> adminId

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Admin authentication
  socket.on('admin_auth', (data: { adminId: string }) => {
    adminSockets.set(socket.id, data.adminId)
    socket.join('admin_dashboard')
    socket.emit('admin_authenticated', { success: true })
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
    } catch (error) {
      console.error('Error listing sessions:', error)
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
      }
    } catch (error) {
      console.error('Error joining session:', error)
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
    } catch (error) {
      console.error('Error sending admin message:', error)
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
    } catch (error) {
      console.error('Error closing session:', error)
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

      console.log('Session started:', sessionId)
    } catch (error) {
      console.error('Error starting session:', error)
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
      } else {
        socket.emit('error', { message: 'Session not found' })
      }
    } catch (error) {
      console.error('Error rejoining session:', error)
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
        }, 1500)
      }
    } catch (error) {
      console.error('Error sending message:', error)
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
    } catch (error) {
      console.error('Error ending session:', error)
    }
  })

  // Typing indicator
  socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
    socket.to(data.sessionId).emit('user_typing', { isTyping: data.isTyping })
  })

  socket.on('disconnect', () => {
    adminSockets.delete(socket.id)
    console.log('Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Support chat service running on port ${PORT}`)
})
