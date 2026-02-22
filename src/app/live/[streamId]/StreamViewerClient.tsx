'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { io, Socket } from 'socket.io-client'
import { 
  Users, Heart, Send, ChevronLeft, Share2, Bell, 
  ShoppingCart, Plus, Minus, Check, X, Play, Clock,
  MessageCircle, Sparkles, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'
import { useCartStore, useLocaleStore } from '@/stores'

interface Product {
  id: string
  name: string
  slug: string
  images: Array<{ url: string; altText: string }>
  variants: Array<{ id: string; name: string; price: number; stock: number }>
  category: { name: string; slug: string }
}

interface StreamProduct {
  id: string
  productId: string
  isPinned: boolean
  hostNotes: string | null
  product: Product
}

interface Offer {
  id: string
  title: string
  description: string | null
  type: string
  discountType: string
  discountValue: number
  originalPrice: number | null
  offerPrice: number | null
  quantityLimit: number | null
  claimedCount: number
  endsAt: string
  promoCode: string | null
  product?: Product
}

interface ChatMessage {
  id: string
  message: string
  type: string
  customerId: string | null
  guestName: string | null
  isPinned: boolean
  isHighlighted: boolean
  reactionCounts: string | null
  createdAt: string
  customer?: {
    firstName: string
    lastName: string
  }
}

interface Stream {
  id: string
  title: string
  description: string | null
  status: string
  streamKey: string
  allowChat: boolean
  allowQuestions: boolean
  host: {
    id: string
    displayName: string
    bio: string | null
    avatar: string | null
    isVerified: boolean
    totalStreams: number
    averageRating: number
  }
}

export default function StreamViewerClient() {
  const params = useParams()
  const streamId = params.streamId as string
  
  const [stream, setStream] = useState<Stream | null>(null)
  const [products, setProducts] = useState<StreamProduct[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [guestName, setGuestName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  
  // UI state
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null)
  const [showProducts, setShowProducts] = useState(true)
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const { addItem, openCart } = useCartStore()
  const { formatPrice } = useLocaleStore()

  // Generate guest ID
  const guestId = typeof window !== 'undefined' 
    ? localStorage.getItem('stream_guest_id') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    : ''

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stream_guest_id', guestId)
    }
  }, [guestId])

  // Fetch stream data
  useEffect(() => {
    async function fetchStream() {
      try {
        const res = await fetch(`/api/streams/${streamId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load stream')
          return
        }

        setStream(data.stream)
        setProducts(data.stream.products || [])
        setOffers(data.stream.offers || [])
        setViewerCount(data.viewerCount || 0)
      } catch (err) {
        setError('Failed to load stream')
      } finally {
        setLoading(false)
      }
    }

    fetchStream()
  }, [streamId])

  // WebSocket connection
  useEffect(() => {
    if (!stream || stream.status !== 'live') return

    // Connect to WebSocket
    socketRef.current = io('/?XTransformPort=3032', {
      transports: ['websocket'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      // Join stream
      socket.emit('join_stream', {
        streamId,
        guestId,
        guestName: guestName || 'Guest',
      })
    })

    // Chat messages
    socket.on('new_message', (data: { message: ChatMessage }) => {
      setMessages(prev => [...prev, data.message])
    })

    // Viewer count
    socket.on('viewer_count_update', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount)
    })

    // Product featured
    socket.on('product_featured', (data: { product: StreamProduct }) => {
      setProducts(prev => 
        prev.map(p => ({ ...p, isPinned: p.productId === data.product.productId }))
      )
      toast.info(`Featured: ${data.product.product.name}`)
    })

    // Offers
    socket.on('offer_activated', (data: { offer: Offer }) => {
      setActiveOffer(data.offer)
      toast.success(`Flash Offer: ${data.offer.title}`)
    })

    socket.on('offer_claimed', (data: { promoCode: string }) => {
      toast.success(`Offer claimed! Code: ${data.promoCode}`)
    })

    // Message pinned
    socket.on('message_pinned', (data: { messageId: string }) => {
      setMessages(prev => 
        prev.map(m => ({ ...m, isPinned: m.id === data.messageId }))
      )
      const pinned = messages.find(m => m.id === data.messageId)
      if (pinned) setPinnedMessage(pinned)
    })

    // Reactions
    socket.on('reaction_added', (data: { messageId: string; reactionType: string; count: number }) => {
      setMessages(prev => 
        prev.map(m => {
          if (m.id === data.messageId) {
            const reactions = m.reactionCounts ? JSON.parse(m.reactionCounts) : {}
            reactions[data.reactionType] = data.count
            return { ...m, reactionCounts: JSON.stringify(reactions) }
          }
          return m
        })
      )
    })

    // Stream ended
    socket.on('stream_ended', () => {
      toast.info('Stream has ended')
      setStream(prev => prev ? { ...prev, status: 'ended' } : null)
    })

    return () => {
      socket.emit('leave_stream', { streamId })
      socket.disconnect()
    }
  }, [stream?.id, stream?.status, guestId, guestName])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return

    socketRef.current.emit('send_message', {
      streamId,
      message: chatInput.trim(),
      guestName: guestName || 'Guest',
      guestId,
    })

    setChatInput('')
  }

  // Add reaction
  const addReaction = (messageId: string, reactionType: string) => {
    if (!socketRef.current) return
    socketRef.current.emit('add_reaction', { streamId, messageId, reactionType })
  }

  // Add to cart
  const handleAddToCart = (product: Product) => {
    const variant = product.variants[0]
    if (!variant) return

    addItem({
      id: `${product.id}-${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      category: product.category.name,
      price: variant.price,
      quantity: 1,
      image: product.images[0]?.url,
    })

    // Track analytics
    socketRef.current?.emit('cart_add', { streamId, productId: product.id })

    toast.success('Added to bag')
    openCart()
  }

  // Claim offer
  const claimOffer = (offer: Offer) => {
    if (!socketRef.current) return
    socketRef.current.emit('claim_offer', { streamId, offerId: offer.id })
  }

  // Format time remaining
  const formatTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent mx-auto mb-4" />
            <p className="font-body text-warm-gray">Loading stream...</p>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  if (error || !stream) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center bg-cream">
          <div className="text-center">
            <h1 className="font-display text-charcoal text-2xl mb-4" style={{ fontWeight: 300 }}>
              {error || 'Stream not found'}
            </h1>
            <Link href="/live" className="font-body text-terracotta hover:underline">
              ← Back to Live
            </Link>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-16 bg-charcoal">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
          {/* Main Video Area */}
          <div className="flex-1 flex flex-col">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              {/* Placeholder for video stream */}
              <div className="absolute inset-0 flex items-center justify-center">
                {stream.status === 'live' ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-terracotta/20 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-terracotta" />
                    </div>
                    <p className="font-body text-warm-gray">Stream is live</p>
                  </div>
                ) : stream.status === 'scheduled' ? (
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-warm-gray mx-auto mb-4" />
                    <p className="font-display text-cream text-xl mb-2" style={{ fontWeight: 300 }}>
                      Stream Starting Soon
                    </p>
                    <p className="font-body text-warm-gray">
                      {new Date(stream.scheduledStart).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-body text-warm-gray">Stream has ended</p>
                  </div>
                )}
              </div>

              {/* Live indicator */}
              {stream.status === 'live' && (
                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-terracotta text-cream">
                    <span className="w-2 h-2 bg-cream animate-pulse" />
                    <span className="font-body text-xs uppercase tracking-wider">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-charcoal/80 text-cream">
                    <Users className="w-4 h-4" />
                    <span className="font-body text-sm">{viewerCount}</span>
                  </div>
                </div>
              )}

              {/* Stream info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h1 className="font-display text-cream text-xl mb-2" style={{ fontWeight: 400 }}>
                  {stream.title}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warm-gray/30 flex items-center justify-center">
                    {stream.host.avatar ? (
                      <Image src={stream.host.avatar} alt={stream.host.displayName} width={40} height={40} className="object-cover" />
                    ) : (
                      <span className="font-body text-cream text-sm">
                        {stream.host.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-cream text-sm">{stream.host.displayName}</p>
                    <p className="font-body text-warm-gray text-xs">
                      {stream.host.totalStreams} streams • {stream.host.averageRating.toFixed(1)} ★
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Panel (Desktop) */}
            <div className="hidden lg:block flex-1 overflow-hidden bg-charcoal">
              <div className="h-full flex flex-col">
                {/* Toggle */}
                <div className="flex border-b border-warm-gray/20">
                  <button
                    onClick={() => setShowProducts(true)}
                    className={`flex-1 py-3 font-body text-sm uppercase tracking-wider ${
                      showProducts ? 'text-terracotta border-b-2 border-terracotta' : 'text-warm-gray'
                    }`}
                  >
                    Products ({products.length})
                  </button>
                  <button
                    onClick={() => setShowProducts(false)}
                    className={`flex-1 py-3 font-body text-sm uppercase tracking-wider ${
                      !showProducts ? 'text-terracotta border-b-2 border-terracotta' : 'text-warm-gray'
                    }`}
                  >
                    Offers ({offers.length})
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {showProducts ? (
                    <div className="grid grid-cols-2 gap-4">
                      {products.map((sp) => (
                        <div 
                          key={sp.id} 
                          className={`bg-warm-gray/10 p-3 ${sp.isPinned ? 'ring-2 ring-terracotta' : ''}`}
                        >
                          <Link href={`/product/${sp.product.slug}`} className="block mb-2">
                            <div className="aspect-square bg-sand/20 mb-2 relative">
                              {sp.product.images[0] && (
                                <Image
                                  src={sp.product.images[0].url}
                                  alt={sp.product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                              {sp.isPinned && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-terracotta text-cream text-xs font-body">
                                  Featured
                                </div>
                              )}
                            </div>
                            <h4 className="font-display text-cream text-sm" style={{ fontWeight: 400 }}>
                              {sp.product.name}
                            </h4>
                            <p className="font-body text-warm-gray text-sm">
                              {formatPrice(sp.product.variants[0]?.price || 0)}
                            </p>
                          </Link>
                          {sp.hostNotes && (
                            <p className="font-body text-warm-gray text-xs mb-2 italic">
                              "{sp.hostNotes}"
                            </p>
                          )}
                          <button
                            onClick={() => handleAddToCart(sp.product)}
                            className="w-full py-2 bg-terracotta text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta/90"
                          >
                            Add to Bag
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer) => (
                        <div 
                          key={offer.id}
                          className="bg-warm-gray/10 p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="px-2 py-0.5 bg-terracotta/20 text-terracotta text-xs font-body uppercase">
                                {offer.type.replace('_', ' ')}
                              </span>
                              <h4 className="font-display text-cream text-lg mt-2" style={{ fontWeight: 400 }}>
                                {offer.title}
                              </h4>
                              {offer.description && (
                                <p className="font-body text-warm-gray text-sm mt-1">{offer.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-body text-warm-gray text-sm line-through">
                                {offer.originalPrice && formatPrice(offer.originalPrice)}
                              </p>
                              <p className="font-body text-terracotta text-lg">
                                {offer.offerPrice ? formatPrice(offer.offerPrice) : `${offer.discountValue}% off`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2 text-warm-gray">
                              <Clock className="w-4 h-4" />
                              <span className="font-body text-sm">
                                {formatTimeRemaining(offer.endsAt)}
                              </span>
                              {offer.quantityLimit && (
                                <>
                                  <span className="text-sand">•</span>
                                  <span className="font-body text-sm">
                                    {offer.quantityLimit - offer.claimedCount} left
                                  </span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => claimOffer(offer)}
                              className="px-4 py-2 bg-terracotta text-cream font-body text-xs uppercase tracking-wider hover:bg-terracotta/90"
                            >
                              Claim Offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-full lg:w-96 flex flex-col bg-charcoal border-t lg:border-t-0 lg:border-l border-warm-gray/20">
            {/* Chat Header */}
            <div className="p-4 border-b border-warm-gray/20">
              <h3 className="font-display text-cream" style={{ fontWeight: 400 }}>
                Live Chat
              </h3>
            </div>

            {/* Pinned Message */}
            {pinnedMessage && (
              <div className="p-3 bg-terracotta/10 border-b border-warm-gray/20">
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 bg-terracotta text-cream text-xs font-body">PINNED</span>
                  <p className="font-body text-cream text-sm">{pinnedMessage.message}</p>
                </div>
              </div>
            )}

            {/* Active Offer Banner */}
            {activeOffer && (
              <div className="p-3 bg-terracotta/20 border-b border-warm-gray/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-terracotta" />
                  <span className="font-body text-terracotta text-xs uppercase tracking-wider">Flash Offer</span>
                </div>
                <p className="font-body text-cream text-sm">{activeOffer.title}</p>
                <button
                  onClick={() => claimOffer(activeOffer)}
                  className="mt-2 w-full py-2 bg-terracotta text-cream font-body text-xs uppercase tracking-wider"
                >
                  Claim Now
                </button>
              </div>
            )}

            {/* Guest Name Input */}
            {showNameInput && stream.allowChat && (
              <div className="p-4 border-b border-warm-gray/20">
                <p className="font-body text-warm-gray text-sm mb-2">Join the conversation</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                  <button
                    onClick={() => setShowNameInput(false)}
                    className="px-4 py-2 bg-terracotta text-cream font-body text-sm"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`${msg.isHighlighted ? 'bg-terracotta/10 p-2 -mx-2' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <span className="font-body text-warm-gray text-xs">
                        {msg.customer 
                          ? `${msg.customer.firstName} ${msg.customer.lastName}`
                          : msg.guestName || 'Guest'
                        }
                      </span>
                      <p className="font-body text-cream text-sm">{msg.message}</p>
                    </div>
                  </div>

                  {/* Reactions */}
                  {msg.reactionCounts && Object.keys(JSON.parse(msg.reactionCounts)).length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {Object.entries(JSON.parse(msg.reactionCounts)).map(([type, count]) => (
                        <button
                          key={type}
                          onClick={() => addReaction(msg.id, type)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-warm-gray/10 text-warm-gray text-xs font-body"
                        >
                          <span>{type === 'heart' ? '❤️' : type}</span>
                          <span>{count as number}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {stream.allowChat && !showNameInput && (
              <div className="p-4 border-t border-warm-gray/20">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Say something..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={stream.status !== 'live'}
                    className="flex-1 px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || stream.status !== 'live'}
                    className="w-10 h-10 bg-terracotta text-cream flex items-center justify-center disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Products/Offers Bar */}
        <div className="lg:hidden bg-charcoal border-t border-warm-gray/20">
          <div className="flex overflow-x-auto p-4 gap-4">
            {products.slice(0, 5).map((sp) => (
              <div key={sp.id} className="flex-shrink-0 w-32">
                <div className="aspect-square bg-sand/20 mb-2 relative">
                  {sp.product.images[0] && (
                    <Image
                      src={sp.product.images[0].url}
                      alt={sp.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="font-body text-cream text-xs truncate">{sp.product.name}</p>
                <p className="font-body text-warm-gray text-xs">
                  {formatPrice(sp.product.variants[0]?.price || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}
