'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { MessageCircle, Send, X, Users, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores'

interface ChatSession {
  id: string
  sessionId: string
  status: string
  createdAt: string
  customer: { id: string; firstName: string; lastName: string; email: string } | null
  messages: Array<{ id: string; message: string; createdAt: string }>
  _count: { messages: number }
}

interface ChatMessage {
  id: string
  isFromCustomer: boolean
  message: string
  timestamp: string
}

export default function AdminChatClient() {
  const { customer } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPPORT_CHAT_URL || '/?XTransformPort=3031'
    const socket = io(url, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('admin_auth', { adminId: customer?.id || 'admin' })
    })

    socket.on('admin_authenticated', () => {
      socket.emit('admin_list_sessions')
    })

    socket.on('sessions_list', (data: { sessions: ChatSession[] }) => {
      setSessions(data.sessions)
      setLoading(false)
    })

    socket.on('session_messages', (data: { sessionId: string; messages: ChatMessage[]; customer: any }) => {
      setMessages(data.messages)
    })

    socket.on('message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('new_session', () => {
      socket.emit('admin_list_sessions')
    })

    socket.on('new_session_message', () => {
      socket.emit('admin_list_sessions')
    })

    return () => { socket.disconnect() }
  }, [customer?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function selectSession(sessionId: string) {
    setSelectedSession(sessionId)
    setMessages([])
    socketRef.current?.emit('admin_join_session', { sessionId })
  }

  function sendReply() {
    if (!replyText.trim() || !selectedSession) return
    setSending(true)
    socketRef.current?.emit('admin_send_message', {
      sessionId: selectedSession,
      message: replyText.trim(),
    })
    setReplyText('')
    setSending(false)
  }

  function closeSession() {
    if (!selectedSession) return
    socketRef.current?.emit('admin_close_session', { sessionId: selectedSession })
    setSelectedSession(null)
    setMessages([])
    toast.success('Session closed')
    socketRef.current?.emit('admin_list_sessions')
  }

  const activeSessions = sessions.filter(s => s.status === 'active')

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-charcoal text-3xl font-light">Live Chat Support</h1>
            <p className="font-body text-warm-gray text-sm mt-1">{activeSessions.length} active sessions</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
          {/* Sessions list */}
          <div className="col-span-4 bg-warm-white border border-sand overflow-y-auto">
            <div className="p-4 border-b border-sand">
              <h2 className="font-body text-sm uppercase tracking-wider text-charcoal font-medium">Sessions</h2>
            </div>
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-8 h-8 text-warm-gray mx-auto mb-3" />
                <p className="font-body text-warm-gray text-sm">No chat sessions</p>
              </div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.sessionId)}
                  className={`w-full text-left p-4 border-b border-sand hover:bg-sand/30 transition-colors ${
                    selectedSession === session.sessionId ? 'bg-sand/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-sm text-charcoal font-medium">
                      {session.customer ? `${session.customer.firstName} ${session.customer.lastName}` : 'Anonymous'}
                    </span>
                    <span className={`text-[0.6rem] font-body uppercase tracking-wider px-2 py-0.5 ${
                      session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-sand text-warm-gray'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="font-body text-xs text-warm-gray truncate">
                    {session.messages[0]?.message || 'No messages'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-warm-gray" />
                    <span className="font-body text-[0.65rem] text-warm-gray">
                      {format(new Date(session.createdAt), 'MMM d, h:mm a')}
                    </span>
                    <span className="font-body text-[0.65rem] text-warm-gray ml-auto">
                      {session._count.messages} msgs
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="col-span-8 bg-warm-white border border-sand flex flex-col">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-sand flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-charcoal" />
                    <span className="font-body text-sm text-charcoal font-medium">
                      Session: {selectedSession.slice(0, 20)}...
                    </span>
                  </div>
                  <button
                    onClick={closeSession}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-body uppercase tracking-wider border border-sand hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    <X className="w-3 h-3" /> Close Session
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isFromCustomer ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 ${
                        msg.isFromCustomer
                          ? 'bg-sand/50 border border-sand'
                          : 'bg-charcoal text-cream'
                      }`}>
                        <p className="font-body text-sm">{msg.message}</p>
                        <p className={`font-body text-[0.6rem] mt-1 ${
                          msg.isFromCustomer ? 'text-warm-gray' : 'text-cream/50'
                        }`}>
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-sand">
                  <div className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-3 bg-sand/20 border border-sand font-body text-sm outline-none focus:border-terracotta"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className="px-4 py-3 bg-charcoal text-cream hover:bg-charcoal/90 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-warm-gray/30 mx-auto mb-3" />
                  <p className="font-body text-warm-gray text-sm">Select a session to start responding</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
