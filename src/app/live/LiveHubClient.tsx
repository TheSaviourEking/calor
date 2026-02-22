'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Radio, Calendar, Play, Users, Clock, ChevronRight, 
  Video, Bell, Sparkles, ArrowRight
} from 'lucide-react'
import ClientWrapper from '@/components/layout/ClientWrapper'

interface Stream {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: string
  scheduledStart: string
  category: string | null
  host: {
    id: string
    displayName: string
    avatar: string | null
    isVerified: boolean
    isLive: boolean
  }
  _count?: {
    viewers?: number
    reminders?: number
    products?: number
  }
  currentViewers?: number
  products?: Array<{
    product: {
      id: string
      name: string
      slug: string
      images: Array<{ url: string }>
      variants: Array<{ price: number }>
    }
  }>
}

export default function LiveHubClient() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([])
  const [scheduledStreams, setScheduledStreams] = useState<Stream[]>([])
  const [replays, setReplays] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'live' | 'schedule' | 'replays'>('live')

  useEffect(() => {
    async function fetchData() {
      try {
        const [liveRes, scheduleRes, replaysRes] = await Promise.all([
          fetch('/api/streams/live'),
          fetch('/api/streams/schedule'),
          fetch('/api/streams/replays'),
        ])

        const [liveData, scheduleData, replaysData] = await Promise.all([
          liveRes.json(),
          scheduleRes.json(),
          replaysRes.json(),
        ])

        setLiveStreams(liveData.streams || [])
        setScheduledStreams(scheduleData.streams || [])
        setReplays(replaysData.streams || [])
      } catch (error) {
        console.error('Error fetching streams:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (diff < 0) return 'Starting soon'
    if (diff < 3600000) return `in ${Math.ceil(diff / 60000)} minutes`
    if (diff < 86400000) return `in ${Math.ceil(diff / 3600000)} hours`
    return `in ${Math.ceil(diff / 86400000)} days`
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen pt-20 bg-cream">
        {/* Hero Section */}
        <div className="bg-charcoal text-cream py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-terracotta animate-pulse" />
              <span className="font-body text-sm uppercase tracking-wider text-warm-gray">
                Live Shopping
              </span>
            </div>
            <h1 
              className="font-display text-cream mb-4"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300 }}
            >
              Shop Live with Our Hosts
            </h1>
            <p className="font-body text-warm-gray max-w-2xl text-lg">
              Watch exclusive product reveals, get real-time recommendations, and shop limited-time offers during our live streams.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-sand bg-warm-white sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              {[
                { key: 'live', label: 'Live Now', icon: Radio, count: liveStreams.length },
                { key: 'schedule', label: 'Upcoming', icon: Calendar, count: scheduledStreams.length },
                { key: 'replays', label: 'Replays', icon: Play, count: replays.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-terracotta text-charcoal'
                      : 'border-transparent text-warm-gray hover:text-charcoal'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-body text-sm uppercase tracking-wider">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-body ${
                      tab.key === 'live' ? 'bg-terracotta text-cream' : 'bg-sand text-charcoal'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent mx-auto mb-4" />
              <p className="font-body text-warm-gray">Loading streams...</p>
            </div>
          ) : (
            <>
              {/* Live Streams */}
              {activeTab === 'live' && (
                <div>
                  {liveStreams.length === 0 ? (
                    <div className="text-center py-16">
                      <Video className="w-16 h-16 text-sand mx-auto mb-4" />
                      <h3 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 300 }}>
                        No Live Streams Right Now
                      </h3>
                      <p className="font-body text-warm-gray mb-6">
                        Check our schedule for upcoming streams or watch replays.
                      </p>
                      <button
                        onClick={() => setActiveTab('schedule')}
                        className="font-body text-sm text-terracotta hover:underline"
                      >
                        View Schedule →
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {liveStreams.map((stream) => (
                        <StreamCard key={stream.id} stream={stream} type="live" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Streams */}
              {activeTab === 'schedule' && (
                <div>
                  {scheduledStreams.length === 0 ? (
                    <div className="text-center py-16">
                      <Calendar className="w-16 h-16 text-sand mx-auto mb-4" />
                      <h3 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 300 }}>
                        No Upcoming Streams
                      </h3>
                      <p className="font-body text-warm-gray">
                        Check back soon for new live shopping events.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {scheduledStreams.map((stream) => (
                        <StreamCard key={stream.id} stream={stream} type="scheduled" getTimeUntil={getTimeUntil} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Replays */}
              {activeTab === 'replays' && (
                <div>
                  {replays.length === 0 ? (
                    <div className="text-center py-16">
                      <Play className="w-16 h-16 text-sand mx-auto mb-4" />
                      <h3 className="font-display text-charcoal text-xl mb-2" style={{ fontWeight: 300 }}>
                        No Replays Available
                      </h3>
                      <p className="font-body text-warm-gray">
                        Replays will appear here after live streams end.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {replays.map((stream) => (
                        <StreamCard key={stream.id} stream={stream} type="replay" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-warm-white border-t border-sand py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 
              className="font-display text-charcoal text-center mb-12"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
            >
              What to Expect
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: 'Exclusive Reveals',
                  description: 'Be the first to see new products and limited editions during our live streams.',
                },
                {
                  icon: Clock,
                  title: 'Flash Offers',
                  description: 'Get access to special discounts available only during the stream.',
                },
                {
                  icon: Users,
                  title: 'Real-time Q&A',
                  description: 'Ask questions and get instant answers from our product experts.',
                },
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-cream border border-sand flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-terracotta" />
                  </div>
                  <h3 className="font-display text-charcoal text-lg mb-2" style={{ fontWeight: 400 }}>
                    {feature.title}
                  </h3>
                  <p className="font-body text-warm-gray text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientWrapper>
  )
}

// Stream Card Component
function StreamCard({ 
  stream, 
  type,
  getTimeUntil 
}: { 
  stream: Stream
  type: 'live' | 'scheduled' | 'replay'
  getTimeUntil?: (dateStr: string) => string
}) {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Link 
      href={`/live/${stream.id}`}
      className="group bg-warm-white border border-sand hover:border-terracotta transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-cream to-sand">
        {stream.thumbnailUrl ? (
          <Image
            src={stream.thumbnailUrl}
            alt={stream.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-charcoal/10 text-6xl" style={{ fontWeight: 300 }}>
              {stream.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {type === 'live' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-terracotta text-cream">
            <span className="w-2 h-2 bg-cream animate-pulse" />
            <span className="font-body text-xs uppercase tracking-wider">LIVE</span>
          </div>
        )}
        {type === 'scheduled' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-charcoal text-cream">
            <span className="font-body text-xs uppercase tracking-wider">Upcoming</span>
          </div>
        )}
        {type === 'replay' && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-warm-gray text-cream">
            <span className="font-body text-xs uppercase tracking-wider">Replay</span>
          </div>
        )}

        {/* Viewer Count */}
        {type === 'live' && (stream.currentViewers || stream._count?.viewers) && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-charcoal/80 text-cream">
            <Users className="w-3 h-3" />
            <span className="font-body text-xs">{stream.currentViewers || stream._count?.viewers}</span>
          </div>
        )}

        {/* Play Icon for Replays */}
        {type === 'replay' && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-terracotta flex items-center justify-center">
              <Play className="w-8 h-8 text-cream ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {stream.category && (
          <span className="font-body text-xs text-warm-gray uppercase tracking-wider mb-2 block">
            {stream.category.replace('_', ' ')}
          </span>
        )}

        {/* Title */}
        <h3 className="font-display text-charcoal text-lg mb-2 group-hover:text-terracotta transition-colors" style={{ fontWeight: 400 }}>
          {stream.title}
        </h3>

        {/* Host */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-sand flex items-center justify-center">
            {stream.host.avatar ? (
              <Image src={stream.host.avatar} alt={stream.host.displayName} width={32} height={32} className="object-cover" />
            ) : (
              <span className="font-body text-xs text-charcoal">
                {stream.host.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <span className="font-body text-sm text-charcoal">{stream.host.displayName}</span>
            {stream.host.isVerified && (
              <span className="ml-1 text-gold">✓</span>
            )}
          </div>
        </div>

        {/* Time */}
        {type === 'scheduled' && (
          <div className="flex items-center gap-2 text-warm-gray">
            <Clock className="w-4 h-4" />
            <span className="font-body text-sm">
              {getTimeUntil?.(stream.scheduledStart)}
            </span>
            <span className="text-sand">•</span>
            <span className="font-body text-sm">
              {formatDateTime(stream.scheduledStart)}
            </span>
          </div>
        )}

        {type === 'live' && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-terracotta">Watch Now</span>
            <ChevronRight className="w-4 h-4 text-terracotta" />
          </div>
        )}

        {type === 'replay' && stream._count?.products && (
          <span className="font-body text-sm text-warm-gray">
            {stream._count.products} products featured
          </span>
        )}
      </div>
    </Link>
  )
}
