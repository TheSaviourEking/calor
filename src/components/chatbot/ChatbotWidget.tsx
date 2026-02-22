'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, ExternalLink } from 'lucide-react'
import { nanoid } from 'nanoid'

interface Message {
  id: string
  senderType: 'user' | 'bot'
  content: string
  createdAt: string
  suggestedActions?: string[]
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create or retrieve session
    const storedSession = localStorage.getItem('chatbot_session')
    if (storedSession) {
      setSessionId(storedSession)
      fetchConversation(storedSession)
    } else {
      const newSession = nanoid()
      setSessionId(newSession)
      localStorage.setItem('chatbot_session', newSession)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversation = async (sid: string) => {
    try {
      const res = await fetch(`/api/chatbot?sessionId=${sid}`)
      if (res.ok) {
        const json = await res.json()
        if (json.messages && json.messages.length > 0) {
          setMessages(json.messages)
        } else {
          // Add welcome message
          setMessages([{
            id: 'welcome',
            senderType: 'bot',
            content: "Hello! I'm the CALŌR virtual assistant. How can I help you today?",
            createdAt: new Date().toISOString(),
            suggestedActions: ['track_order', 'start_return', 'browse_products'],
          }])
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return

    const userMessage: Message = {
      id: nanoid(),
      senderType: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        
        const botMessage: Message = {
          id: json.message.id,
          senderType: 'bot',
          content: json.message.content,
          createdAt: json.message.createdAt,
          suggestedActions: json.suggestedActions,
        }

        setMessages(prev => [...prev, botMessage])

        // Handle escalation
        if (json.needsEscalation) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: 'escalation',
              senderType: 'bot',
              content: 'Connecting you to our support team... You can also reach us at support@calor.com',
              createdAt: new Date().toISOString(),
            }])
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: 'error',
        senderType: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: string) => {
    const actionMessages: Record<string, string> = {
      track_order: "I'd like to track my order",
      start_return: "I'd like to start a return",
      browse_products: "Show me your products",
      view_orders: "Show my orders",
      shipping_policy: "Tell me about your shipping policy",
      return_policy: "Tell me about your return policy",
      search_products: "I'm looking for a specific product",
      get_recommendations: "Can you recommend something for me?",
      account_settings: "I need help with my account settings",
      reset_password: "I need to reset my password",
      escalate_to_support: "I'd like to speak with a human",
    }

    setInput(actionMessages[action] || action)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-terracotta text-cream flex items-center justify-center shadow-lg hover:bg-terracotta/90 transition-colors z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-48px)] bg-white border border-sand shadow-lg z-50 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between bg-cream">
        <div>
          <h3 className="font-display text-lg text-charcoal" style={{ fontWeight: 300 }}>
            CALŌR Assistant
          </h3>
          <p className="text-xs font-body text-warm-gray">Online</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 flex items-center justify-center text-warm-gray hover:text-charcoal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.senderType === 'user' ? 'order-2' : ''}`}>
              <div
                className={`p-3 font-body text-sm ${
                  message.senderType === 'user'
                    ? 'bg-charcoal text-cream'
                    : 'bg-sand text-charcoal'
                }`}
              >
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              <div className={`text-xs text-warm-gray mt-1 font-body ${message.senderType === 'user' ? 'text-right' : ''}`}>
                {formatTime(message.createdAt)}
              </div>
              
              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(action)}
                      className="text-xs font-body px-3 py-1 border border-charcoal/20 text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
                    >
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-sand p-3">
              <Loader2 className="w-5 h-5 animate-spin text-warm-gray" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-sand">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-sand font-body text-charcoal placeholder:text-warm-gray focus:outline-none focus:border-terracotta"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-charcoal text-cream flex items-center justify-center hover:bg-charcoal/90 disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
