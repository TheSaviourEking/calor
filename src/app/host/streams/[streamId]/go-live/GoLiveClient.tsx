'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { io, Socket } from 'socket.io-client'
import {
  ArrowLeft, Video, VideoOff, Users, MessageCircle, ShoppingCart,
  Plus, X, Clock, Zap, Eye, Send, Pin, Check, Loader2, Copy
} from 'lucide-react'
import { toast } from 'sonner'
import ClientWrapper from '@/components/layout/ClientWrapper'

interface Product {
  id: string
  name: string
  slug: string
  images: Array<{ url: string }>
  variants: Array<{ id: string; name: string; price: number }>
  category: { name: string }
}

interface StreamProduct {
  id: string
  productId: string
  isPinned: boolean
  hostNotes: string | null
  product: Product
}

interface ChatMessage {
  id: string
  message: string
  customerId: string | null
  guestName: string | null
  isPinned: boolean
  isHighlighted: boolean
  createdAt: string
  customer?: {
    firstName: string
    lastName: string
  }
}

interface Stream {
  id: string
  title: string
  status: string
  streamKey: string
  allowChat: boolean
  host: {
    id: string
    displayName: string
  }
}

export default function GoLiveClient() {
  const params = useParams()
  const router = useRouter()
  const streamId = params.streamId as string

  const [stream, setStream] = useState<Stream | null>(null)
  const [products, setProducts] = useState<StreamProduct[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [ending, setEnding] = useState(false)

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    quantityLimit: 10,
    durationMinutes: 30,
    productId: '',
  })
  const [creatingOffer, setCreatingOffer] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  // Fetch stream data
  useEffect(() => {
    async function fetchStream() {
      try {
        const res = await fetch(`/api/streams/${streamId}`)
        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || 'Failed to load stream')
          return
        }

        setStream(data.stream)
        setProducts(data.stream.products || [])
        setIsLive(data.stream.status === 'live')
      } catch (error) {
        toast.error('Failed to load stream')
      } finally {
        setLoading(false)
      }
    }

    fetchStream()
  }, [streamId])

  // WebSocket connection when live
  useEffect(() => {
    if (!isLive || !stream) return

    const url = process.env.NEXT_PUBLIC_LIVE_STREAM_URL || '/?XTransformPort=3032'
    socketRef.current = io(url, {
      transports: ['websocket'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      socket.emit('join_stream', {
        streamId,
        hostId: stream.host.id,
      })
    })

    socket.on('new_message', (data: { message: ChatMessage }) => {
      setMessages(prev => [...prev, data.message])
    })

    socket.on('viewer_count_update', (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount)
    })

    return () => {
      socket.disconnect()
    }
  }, [isLive, stream?.host.id, streamId])

  // Go live
  const goLive = async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}/start`, { method: 'POST' })

      if (res.ok) {
        setIsLive(true)
        toast.success('You are now live!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to go live')
      }
    } catch (error) {
      toast.error('Failed to go live')
    }
  }

  // End stream
  const endStream = async () => {
    if (!confirm('Are you sure you want to end the stream?')) return

    setEnding(true)
    try {
      const res = await fetch(`/api/streams/${streamId}/end`, { method: 'POST' })

      if (res.ok) {
        setIsLive(false)
        toast.success('Stream ended')
        router.push('/host/dashboard')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to end stream')
      }
    } catch (error) {
      toast.error('Failed to end stream')
    } finally {
      setEnding(false)
    }
  }

  // Feature product
  const featureProduct = (productId: string) => {
    if (!socketRef.current) return
    socketRef.current.emit('feature_product', { streamId, productId })
    toast.success('Product featured')
  }

  // Create offer
  const createOffer = async () => {
    if (!offerForm.title) {
      toast.error('Please enter an offer title')
      return
    }

    setCreatingOffer(true)
    try {
      const now = new Date()
      const endsAt = new Date(now.getTime() + (offerForm.durationMinutes || 30) * 60000)

      const res = await fetch(`/api/streams/${streamId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: offerForm.title,
          description: offerForm.description,
          type: 'flash_sale',
          productId: offerForm.productId || null,
          discountType: offerForm.discountType,
          discountValue: offerForm.discountValue,
          quantityLimit: offerForm.quantityLimit,
          endsAt: endsAt.toISOString(),
          durationMinutes: offerForm.durationMinutes,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        socketRef.current?.emit('activate_offer', { streamId, offerId: data.offer.id })
        toast.success('Offer created and activated!')
        setShowOfferForm(false)
        setOfferForm({
          title: '',
          description: '',
          discountType: 'percentage',
          discountValue: 10,
          quantityLimit: 10,
          durationMinutes: 30,
          productId: '',
        })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create offer')
      }
    } catch (error) {
      toast.error('Failed to create offer')
    } finally {
      setCreatingOffer(false)
    }
  }

  // Pin message
  const pinMessage = (messageId: string) => {
    if (!socketRef.current) return
    socketRef.current.emit('pin_message', { streamId, messageId })
    toast.success('Message pinned')
  }

  // Copy stream key
  const copyStreamKey = () => {
    if (stream?.streamKey) {
      navigator.clipboard.writeText(stream.streamKey)
      toast.success('Stream key copied!')
    }
  }

  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center bg-charcoal">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      </ClientWrapper>
    )
  }

  if (!stream) {
    return (
      <ClientWrapper>
        <div className="min-h-screen pt-20 flex items-center justify-center bg-charcoal">
          <div className="text-center">
            <h1 className="font-display text-cream text-2xl mb-4" style={{ fontWeight: 300 }}>
              Stream not found
            </h1>
            <Link href="/host/dashboard" className="font-body text-terracotta hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ClientWrapper>
    )
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-16 bg-charcoal">
        {/* Header */}
        <div className="bg-black/30 border-b border-warm-gray/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/host/dashboard"
              className="w-10 h-10 flex items-center justify-center text-warm-gray hover:text-cream"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-cream text-lg" style={{ fontWeight: 400 }}>
                {stream.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-body ${isLive ? 'bg-terracotta text-cream' : 'bg-warm-gray/20 text-warm-gray'
                  }`}>
                  {isLive && <span className="w-1.5 h-1.5 bg-cream animate-pulse" />}
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-warm-gray text-xs font-body">
                    <Eye className="w-3 h-3" />
                    {viewerCount} viewers
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isLive ? (
              <button
                onClick={goLive}
                className="px-4 py-2 bg-terracotta text-cream font-body text-sm flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Go Live
              </button>
            ) : (
              <button
                onClick={endStream}
                disabled={ending}
                className="px-4 py-2 bg-red-600 text-cream font-body text-sm flex items-center gap-2"
              >
                <VideoOff className="w-4 h-4" />
                {ending ? 'Ending...' : 'End Stream'}
              </button>
            )}
          </div>
        </div>

        <div className="flex h-[calc(100vh-4rem-60px)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Preview Area */}
            <div className="flex-1 bg-black flex items-center justify-center">
              {isLive ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-terracotta/20 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-12 h-12 text-terracotta" />
                  </div>
                  <p className="font-body text-cream">Stream is live</p>
                  <p className="font-body text-warm-gray text-sm mt-2">
                    Viewing in preview mode
                  </p>
                </div>
              ) : (
                <div className="text-center max-w-md px-4">
                  <Video className="w-16 h-16 text-warm-gray mx-auto mb-4" />
                  <h2 className="font-display text-cream text-xl mb-2" style={{ fontWeight: 300 }}>
                    Ready to Go Live?
                  </h2>
                  <p className="font-body text-warm-gray text-sm mb-6">
                    Click "Go Live" to start streaming. Your stream key is:
                  </p>
                  <div className="flex items-center gap-2 bg-warm-gray/10 p-3">
                    <code className="flex-1 font-body text-cream text-sm truncate">
                      {stream.streamKey}
                    </code>
                    <button
                      onClick={copyStreamKey}
                      className="w-8 h-8 flex items-center justify-center text-warm-gray hover:text-cream"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Products Bar */}
            <div className="bg-black/50 border-t border-warm-gray/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-body text-cream text-sm uppercase tracking-wider">
                  Featured Products
                </h3>
                <button
                  onClick={() => setShowOfferForm(true)}
                  className="px-3 py-1 bg-terracotta text-cream font-body text-xs flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Create Offer
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {products.map((sp) => (
                  <div
                    key={sp.id}
                    className={`flex-shrink-0 w-40 bg-warm-gray/10 p-2 ${sp.isPinned ? 'ring-2 ring-terracotta' : ''
                      }`}
                  >
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
                    <p className="font-body text-warm-gray text-xs mb-2">
                      ${((sp.product.variants[0]?.price || 0) / 100).toFixed(2)}
                    </p>
                    <button
                      onClick={() => featureProduct(sp.productId)}
                      className="w-full py-1 bg-warm-gray/20 text-cream font-body text-xs hover:bg-terracotta"
                    >
                      Feature
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-80 border-l border-warm-gray/20 flex flex-col bg-charcoal">
            <div className="p-4 border-b border-warm-gray/20">
              <h3 className="font-display text-cream" style={{ fontWeight: 400 }}>
                Live Chat
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-warm-gray mx-auto mb-2" />
                  <p className="font-body text-warm-gray text-sm">
                    Chat messages will appear here
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 ${msg.isHighlighted ? 'bg-terracotta/10' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-body text-warm-gray text-xs">
                          {msg.customer
                            ? `${msg.customer.firstName} ${msg.customer.lastName}`
                            : msg.guestName || 'Guest'
                          }
                        </span>
                        <p className="font-body text-cream text-sm">{msg.message}</p>
                      </div>
                      <button
                        onClick={() => pinMessage(msg.id)}
                        className="text-warm-gray hover:text-cream"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Offer Form Modal */}
        {showOfferForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-charcoal border border-warm-gray/20 w-full max-w-md">
              <div className="p-4 border-b border-warm-gray/20 flex items-center justify-between">
                <h3 className="font-display text-cream text-lg" style={{ fontWeight: 400 }}>
                  Create Flash Offer
                </h3>
                <button
                  onClick={() => setShowOfferForm(false)}
                  className="text-warm-gray hover:text-cream"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                    Offer Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20% Off Flash Sale"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional description"
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                      Discount Type
                    </label>
                    <select
                      value={offerForm.discountType}
                      onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
                      className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                      {offerForm.discountType === 'percentage' ? '%' : '$'} Off
                    </label>
                    <input
                      type="number"
                      value={offerForm.discountValue}
                      onChange={(e) => setOfferForm({ ...offerForm, discountValue: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                      Quantity Limit
                    </label>
                    <input
                      type="number"
                      value={offerForm.quantityLimit}
                      onChange={(e) => setOfferForm({ ...offerForm, quantityLimit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="font-body text-warm-gray text-xs uppercase tracking-wider mb-2 block">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      value={offerForm.durationMinutes}
                      onChange={(e) => setOfferForm({ ...offerForm, durationMinutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-warm-gray/10 border border-warm-gray/20 text-cream font-body text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                <button
                  onClick={createOffer}
                  disabled={creatingOffer}
                  className="w-full py-3 bg-terracotta text-cream font-body text-sm hover:bg-terracotta/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingOffer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Create & Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientWrapper>
  )
}
