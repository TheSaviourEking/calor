'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle, X, Send, Package, RotateCcw,
  ShoppingBag, HelpCircle, Sparkles, ChevronRight, Heart,
  Truck, CreditCard, User, Shield, ArrowRight
} from 'lucide-react'
import { nanoid } from 'nanoid'
import Link from 'next/link'

interface Message {
  id: string
  senderType: 'user' | 'bot'
  content: string
  createdAt: string
  suggestedActions?: string[]
  intent?: string
}

// Safely parse suggestedActions which may come as a JSON string from the DB
function parseSuggestedActions(val: unknown): string[] | undefined {
  if (!val) return undefined
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

// Smart action labels with icons
const ACTION_CONFIG: Record<string, { label: string; icon: typeof Package; href?: string }> = {
  track_order: { label: 'Track My Order', icon: Truck, href: '/track-order' },
  start_return: { label: 'Start a Return', icon: RotateCcw, href: '/returns' },
  browse_products: { label: 'Browse Products', icon: ShoppingBag, href: '/shop' },
  view_orders: { label: 'View My Orders', icon: Package, href: '/account?tab=orders' },
  shipping_policy: { label: 'Shipping Info', icon: Truck },
  return_policy: { label: 'Return Policy', icon: RotateCcw },
  search_products: { label: 'Find Products', icon: ShoppingBag, href: '/shop' },
  get_recommendations: { label: 'Get Recommendations', icon: Sparkles, href: '/quiz' },
  account_settings: { label: 'Account Settings', icon: User, href: '/account' },
  reset_password: { label: 'Reset Password', icon: Shield, href: '/forgot-password' },
  escalate_to_support: { label: 'Talk to a Human', icon: HelpCircle, href: '/support' },
  view_wishlist: { label: 'My Wishlist', icon: Heart, href: '/account?tab=wishlist' },
  payment_help: { label: 'Payment Help', icon: CreditCard },
}

// Quick action buttons shown when chat is empty
const QUICK_ACTIONS = [
  { id: 'track_order', label: 'Track My Order', icon: Truck },
  { id: 'browse_products', label: 'Shop Products', icon: ShoppingBag },
  { id: 'get_recommendations', label: 'Get Recommendations', icon: Sparkles },
  { id: 'start_return', label: 'Returns & Exchanges', icon: RotateCcw },
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedSession = localStorage.getItem('chatbot_session')
    if (storedSession) {
      setSessionId(storedSession)
    } else {
      const newSession = nanoid()
      setSessionId(newSession)
      localStorage.setItem('chatbot_session', newSession)
    }
  }, [])

  // Fetch conversation when opening the widget
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchConversation(sessionId)
      setHasNewMessage(false)
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const fetchConversation = async (sid: string) => {
    try {
      const res = await fetch(`/api/chatbot?sessionId=${sid}`)
      if (res.ok) {
        const json = await res.json()
        if (json.messages && json.messages.length > 0) {
          const parsed = json.messages.map((m: Record<string, unknown>) => ({
            ...m,
            suggestedActions: parseSuggestedActions(m.suggestedActions),
          }))
          setMessages(parsed)
        } else {
          setMessages([{
            id: 'welcome',
            senderType: 'bot',
            content: "Welcome to CALŌR ✨\n\nI'm your personal shopping concierge. I can help you discover the perfect product, track orders, handle returns, or answer any questions.\n\nWhat can I help you with?",
            createdAt: new Date().toISOString(),
            suggestedActions: ['browse_products', 'track_order', 'get_recommendations'],
          }])
        }
      }
    } catch {
      setMessages([{
        id: 'welcome',
        senderType: 'bot',
        content: "Welcome to CALŌR ✨\n\nI'm your personal shopping concierge. How can I help you today?",
        createdAt: new Date().toISOString(),
        suggestedActions: ['browse_products', 'track_order', 'get_recommendations'],
      }])
    }
  }

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const text = overrideMessage || input.trim()
    if (!text || loading || !sessionId) return

    const userMessage: Message = {
      id: nanoid(),
      senderType: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setIsTyping(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage.content }),
      })

      if (res.ok) {
        const json = await res.json()
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600))

        const botMessage: Message = {
          id: json.message.id,
          senderType: 'bot',
          content: json.message.content,
          createdAt: json.message.createdAt,
          suggestedActions: parseSuggestedActions(json.suggestedActions),
          intent: json.message.intent,
        }

        setIsTyping(false)
        setMessages(prev => [...prev, botMessage])

        if (json.needsEscalation) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: nanoid(),
              senderType: 'bot',
              content: '🔗 Connecting you to our support team... You can also reach us directly at support@calor.com or visit our Support Center.',
              createdAt: new Date().toISOString(),
              suggestedActions: ['escalate_to_support'],
            }])
          }, 1200)
        }

        if (!isOpen) setHasNewMessage(true)
      } else {
        throw new Error('Failed')
      }
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: nanoid(),
        senderType: 'bot',
        content: "I'm sorry, I ran into a hiccup. Could you try asking again?",
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sessionId, isOpen])

  const handleActionClick = (actionId: string) => {
    const config = ACTION_CONFIG[actionId]
    if (config?.href) {
      window.location.href = config.href
      return
    }
    const actionMessages: Record<string, string> = {
      track_order: "I'd like to track my order",
      start_return: "I'd like to start a return",
      browse_products: "Show me your products",
      view_orders: "Show my recent orders",
      shipping_policy: "Tell me about your shipping options",
      return_policy: "What's your return policy?",
      search_products: "I'm looking for a specific product",
      get_recommendations: "Can you recommend something for me?",
      account_settings: "I need help with my account",
      reset_password: "I need to reset my password",
      escalate_to_support: "I'd like to speak with a person",
      payment_help: "I need help with payment",
    }
    sendMessage(actionMessages[actionId] || actionId.replace(/_/g, ' '))
  }

  const handleQuickAction = (actionId: string) => {
    const actionMessages: Record<string, string> = {
      track_order: "I'd like to track my order",
      browse_products: "What products do you have?",
      get_recommendations: "Can you recommend something for me?",
      start_return: "I need help with a return or exchange",
    }
    sendMessage(actionMessages[actionId] || actionId)
  }

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Simple inline markdown renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null
    const parts: (string | React.ReactElement)[] = []
    const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyIdx = 0
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
      if (match[1]) {
        parts.push(<strong key={`b${keyIdx++}`} className="font-semibold">{match[1]}</strong>)
      } else if (match[2] && match[3]) {
        parts.push(
          <a key={`l${keyIdx++}`} href={match[3]} className="underline text-terracotta hover:text-terracotta-light transition-colors" target={match[3].startsWith('http') ? '_blank' : undefined} rel={match[3].startsWith('http') ? 'noopener noreferrer' : undefined}>{match[2]}</a>
        )
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex))
    return parts
  }

  const isConversationEmpty = messages.length <= 1

  // Floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-terracotta text-cream flex items-center justify-center shadow-lg hover:bg-terracotta-light transition-all duration-300 z-50 group hover:scale-105 active:scale-95"
        aria-label="Open chat"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-terracotta-light border-2 border-warm-white animate-pulse" />
        )}
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-48px)] bg-warm-white border border-sand shadow-xl z-50 flex flex-col max-h-[80vh]"
      style={{
        animation: 'chatOpen 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
      }}
    >
      <style jsx>{`
        @keyframes chatOpen {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-sand flex items-center justify-between bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-terracotta/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-terracotta" />
          </div>
          <div>
            <h3 className="font-display text-charcoal text-base" style={{ fontWeight: 400 }}>
              CALŌR Concierge
            </h3>
            <div className="flex items-center gap-1.5">
              {/* Brand-aligned indicator — terracotta instead of generic green */}
              <span className="w-1.5 h-1.5 bg-terracotta animate-pulse" />
              <span className="text-[10px] font-body text-warm-gray uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 flex items-center justify-center text-warm-gray hover:text-charcoal transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}
            style={{ animationDuration: '0.3s' }}
          >
            <div className={`max-w-[85%] ${message.senderType === 'user' ? 'order-2' : ''}`}>
              <div
                className={`p-3.5 font-body text-sm leading-relaxed ${
                  message.senderType === 'user'
                    ? 'bg-charcoal text-cream'
                    : 'bg-cream text-charcoal border border-sand'
                }`}
              >
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                    {line ? renderMarkdown(line) : '\u00A0'}
                  </p>
                ))}
              </div>
              <div className={`text-[10px] text-warm-gray/70 mt-1 font-body ${message.senderType === 'user' ? 'text-right' : ''}`}>
                {formatTime(message.createdAt)}
              </div>

              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {message.suggestedActions.map((actionId, i) => {
                    const config = ACTION_CONFIG[actionId]
                    const Icon = config?.icon || ChevronRight
                    return (
                      <button
                        key={i}
                        onClick={() => handleActionClick(actionId)}
                        className="inline-flex items-center gap-1.5 text-xs font-body px-3 py-1.5 border border-sand text-warm-gray hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-all duration-200 group"
                      >
                        <Icon className="w-3 h-3" />
                        {config?.label || actionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        {config?.href && <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-slide-in-up" style={{ animationDuration: '0.2s' }}>
            <div className="bg-cream border border-sand p-3.5 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-warm-gray/50 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
              <span className="w-2 h-2 bg-warm-gray/50 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
              <span className="w-2 h-2 bg-warm-gray/50 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
            </div>
          </div>
        )}

        {/* Quick Actions (shown when conversation is fresh) */}
        {isConversationEmpty && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-body text-warm-gray uppercase tracking-widest">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className="flex items-center gap-2 p-3 bg-cream border border-sand hover:border-terracotta hover:bg-terracotta/5 transition-all duration-200 text-left group"
                >
                  <div className="w-7 h-7 bg-sand/50 flex items-center justify-center flex-shrink-0 group-hover:bg-terracotta/10 transition-colors">
                    <action.icon className="w-3.5 h-3.5 text-warm-gray group-hover:text-terracotta transition-colors" />
                  </div>
                  <span className="text-xs font-body text-charcoal leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-sand bg-cream/50">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2.5 bg-warm-white border border-sand font-body text-sm text-charcoal placeholder:text-warm-gray/60 focus:outline-none focus:border-terracotta/50 transition-colors duration-300"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-terracotta text-cream flex items-center justify-center hover:bg-terracotta-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[9px] font-body text-warm-gray/50 mt-1.5 text-center">
          Powered by CALŌR AI ·{' '}
          <Link href="/legal/privacy" className="hover:text-terracotta transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  )
}
