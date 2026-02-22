'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Lock, X, Minimize2, Maximize2 } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  isFromCustomer: boolean
  message: string
  timestamp: Date
}

export default function SupportChatClient() {
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const initSocket = useCallback((existingSessionId?: string) => {
    const socket = io('/?XTransformPort=3031', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      
      if (existingSessionId) {
        socket.emit('rejoin_session', { sessionId: existingSessionId })
      } else {
        socket.emit('start_session', {})
      }
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('session_started', (data: { sessionId: string }) => {
      setSessionId(data.sessionId)
      localStorage.setItem('calor_support_session', data.sessionId)
    })

    socket.on('session_rejoined', (data: { sessionId: string; messages: Message[] }) => {
      setSessionId(data.sessionId)
      setMessages(data.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
      setShowWelcome(false)
    })

    socket.on('message', (message: Message) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date(message.timestamp) }])
      setIsTyping(false)
    })

    socket.on('user_typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping)
    })

    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message)
    })

    socket.on('session_ended', () => {
      setSessionId(null)
      setMessages([])
      localStorage.removeItem('calor_support_session')
    })
  }, [])

  useEffect(() => {
    // Check for existing session in localStorage
    const existingSession = localStorage.getItem('calor_support_session')
    if (existingSession) {
      initSocket(existingSession)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [initSocket])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleStartChat = () => {
    setShowWelcome(false)
    initSocket()
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !socketRef.current || !sessionId) return

    socketRef.current.emit('send_message', {
      sessionId,
      message: inputMessage.trim(),
    })

    setInputMessage('')
    
    // Emit typing stopped
    socketRef.current.emit('typing', { sessionId, isTyping: false })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    
    // Emit typing indicator
    if (socketRef.current && sessionId) {
      socketRef.current.emit('typing', { 
        sessionId, 
        isTyping: e.target.value.length > 0 
      })
    }
  }

  const handleEndChat = () => {
    if (socketRef.current && sessionId) {
      socketRef.current.emit('end_session', { sessionId })
    }
    setSessionId(null)
    setMessages([])
    setShowWelcome(true)
    localStorage.removeItem('calor_support_session')
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 text-terracotta mx-auto mb-4" />
            <h1 className="font-display text-charcoal text-3xl mb-4" style={{ fontWeight: 300 }}>
              Anonymous Support
            </h1>
            <p className="font-body text-warm-gray max-w-md mx-auto">
              Need help? Our support team is here for you. Your conversation is completely private and anonymous.
            </p>
          </div>

          <div className="p-6 bg-cream border border-sand mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-terracotta" />
              <span className="font-body text-charcoal">Your Privacy Protected</span>
            </div>
            <ul className="space-y-2 font-body text-warm-gray text-sm">
              <li>No account required</li>
              <li>No personal information shared</li>
              <li>Conversation not stored after session ends</li>
              <li>Bank-grade encryption</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartChat}
              className="px-8 py-4 bg-charcoal text-cream font-body text-sm uppercase tracking-wider hover:bg-terracotta transition-colors"
            >
              Start Anonymous Chat
            </button>
            <p className="font-body text-warm-gray/70 text-xs mt-4">
              Available 24/7. Average response time under 2 minutes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Chat Interface (Full Page)
  if (!isMinimized) {
    return (
      <div className="min-h-screen pt-20 flex flex-col">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 w-full flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-sand">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-body text-charcoal">Support Team</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-warm-gray hover:text-terracotta transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleEndChat}
                className="p-2 text-warm-gray hover:text-terracotta transition-colors"
                aria-label="End chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isFromCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 ${
                    msg.isFromCustomer
                      ? 'bg-charcoal text-cream'
                      : 'bg-sand/50 text-charcoal'
                  }`}
                >
                  <p className="font-body text-sm">{msg.message}</p>
                  <p
                    className={`font-body text-xs mt-1 ${
                      msg.isFromCustomer ? 'text-cream/60' : 'text-warm-gray'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-sand/50 p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-warm-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-cream border border-sand font-body text-sm focus:border-terracotta outline-none"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="px-4 py-3 bg-charcoal text-cream font-body text-sm hover:bg-terracotta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Notice */}
          <p className="font-body text-warm-gray/70 text-xs mt-4 text-center">
            <Lock className="w-3 h-3 inline mr-1" />
            This conversation is encrypted and anonymous
          </p>
        </div>
      </div>
    )
  }

  // Minimized Chat (Floating Widget)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsMinimized(false)}
        className="flex items-center gap-3 px-4 py-3 bg-charcoal text-cream shadow-lg hover:bg-terracotta transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-body text-sm">Support</span>
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  )
}
