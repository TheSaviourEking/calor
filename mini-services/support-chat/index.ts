import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3031

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://calorco.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Store active support sessions
const sessions = new Map<string, {
  id: string
  customerId?: string
  messages: Array<{
    id: string
    isFromCustomer: boolean
    message: string
    timestamp: Date
  }>
  createdAt: Date
}>()

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Generate message ID
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Customer initiates a support chat
  socket.on('start_session', (data: { customerId?: string }) => {
    const sessionId = generateSessionId()
    
    const session = {
      id: sessionId,
      customerId: data.customerId,
      messages: [],
      createdAt: new Date(),
    }
    
    sessions.set(sessionId, session)
    socket.join(sessionId)
    socket.emit('session_started', { sessionId })
    
    // Send welcome message
    const welcomeMessage = {
      id: generateMessageId(),
      isFromCustomer: false,
      message: 'Hello! Thanks for reaching out. How can we help you today? Your privacy is important to us - this conversation is anonymous and secure.',
      timestamp: new Date(),
    }
    
    session.messages.push(welcomeMessage)
    socket.emit('message', welcomeMessage)
    
    console.log('Session started:', sessionId)
  })

  // Customer rejoins existing session
  socket.on('rejoin_session', (data: { sessionId: string }) => {
    const session = sessions.get(data.sessionId)
    if (session) {
      socket.join(data.sessionId)
      socket.emit('session_rejoined', { 
        sessionId: data.sessionId,
        messages: session.messages 
      })
    } else {
      socket.emit('error', { message: 'Session not found' })
    }
  })

  // Customer sends message
  socket.on('send_message', (data: { sessionId: string; message: string }) => {
    const session = sessions.get(data.sessionId)
    if (!session) {
      socket.emit('error', { message: 'Session not found' })
      return
    }

    const message = {
      id: generateMessageId(),
      isFromCustomer: true,
      message: data.message,
      timestamp: new Date(),
    }

    session.messages.push(message)
    
    // Broadcast to the session room (customer and any support agents)
    io.to(data.sessionId).emit('message', message)

    // Simulate support response (in production, this would be a real support agent)
    setTimeout(() => {
      const autoResponses = [
        "Thanks for your message. Let me look into that for you.",
        "I understand. Can you tell me a bit more about what you're looking for?",
        "Great question! I'm happy to help with that.",
        "I'll check on that right away. Is there anything else you'd like to know?",
        "Thanks for your patience. I'm looking into this now.",
      ]
      
      const response = {
        id: generateMessageId(),
        isFromCustomer: false,
        message: autoResponses[Math.floor(Math.random() * autoResponses.length)],
        timestamp: new Date(),
      }
      
      session.messages.push(response)
      io.to(data.sessionId).emit('message', response)
    }, 1500)
  })

  // End session
  socket.on('end_session', (data: { sessionId: string }) => {
    socket.leave(data.sessionId)
    socket.emit('session_ended', { sessionId: data.sessionId })
  })

  // Typing indicator
  socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
    socket.to(data.sessionId).emit('user_typing', { isTyping: data.isTyping })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Support chat service running on port ${PORT}`)
})
