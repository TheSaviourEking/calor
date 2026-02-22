'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Video, Plus, Calendar, Users, DollarSign, TrendingUp,
  Clock, Eye, MessageCircle, ShoppingBag, Settings, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

interface HostProfile {
  id: string
  displayName: string
  bio: string | null
  avatar: string | null
  isVerified: boolean
  isLive: boolean
  totalStreams: number
  totalViewers: number
  totalSales: number
  averageRating: number
}

interface Stream {
  id: string
  title: string
  status: string
  scheduledStart: string
  actualStart: string | null
  actualEnd: string | null
  totalUniqueViewers: number
  revenue: number
  totalChatMessages: number
  totalPurchases: number
}

interface HostDashboardClientProps {
  customerId: string
  initialHostProfile?: HostProfile | null
  initialStreams?: Stream[]
}

export default function HostDashboardClient({
  customerId,
  initialHostProfile = null,
  initialStreams = []
}: HostDashboardClientProps) {
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(initialHostProfile)
  const [streams, setStreams] = useState<Stream[]>(initialStreams)
  const [loading, setLoading] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')

  // Removed initial fetch useEffect

  const createHostProfile = async () => {
    if (!newDisplayName.trim()) {
      toast.error('Please enter a display name')
      return
    }

    setCreatingProfile(true)
    try {
      const res = await fetch('/api/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          displayName: newDisplayName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setHostProfile(data.host)
        toast.success('Host profile created!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setCreatingProfile(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent mx-auto mb-4" />
          <p className="font-body text-warm-gray">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // No host profile - show creation form
  if (!hostProfile) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <Video className="w-16 h-16 text-terracotta mx-auto mb-4" />
            <h1
              className="font-display text-charcoal mb-2"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
            >
              Become a Host
            </h1>
            <p className="font-body text-warm-gray">
              Create your host profile to start streaming and connecting with viewers.
            </p>
          </div>

          <div className="bg-warm-white p-6 border border-sand">
            <div className="mb-4">
              <label className="font-body text-charcoal text-sm mb-2 block">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your host name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta"
              />
            </div>

            <button
              onClick={createHostProfile}
              disabled={creatingProfile}
              className="w-full bg-terracotta text-cream py-4 font-body text-sm uppercase tracking-wider hover:bg-terracotta/90 disabled:opacity-50"
            >
              {creatingProfile ? 'Creating...' : 'Create Host Profile'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sand flex items-center justify-center">
              {hostProfile.avatar ? (
                <img src={hostProfile.avatar} alt={hostProfile.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-charcoal text-2xl" style={{ fontWeight: 300 }}>
                  {hostProfile.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1
                className="font-display text-charcoal"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300 }}
              >
                {hostProfile.displayName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {hostProfile.isVerified && (
                  <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-body">Verified</span>
                )}
                {hostProfile.isLive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-terracotta text-cream text-xs font-body">
                    <span className="w-1.5 h-1.5 bg-cream animate-pulse" />
                    Live Now
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/host/profile"
              className="px-4 py-2 border border-sand bg-warm-white font-body text-sm hover:border-terracotta flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <Link
              href="/host/streams/new"
              className="px-4 py-2 bg-terracotta text-cream font-body text-sm hover:bg-terracotta/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Stream
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Streams', value: hostProfile.totalStreams, icon: Video },
            { label: 'Total Viewers', value: hostProfile.totalViewers.toLocaleString(), icon: Users },
            { label: 'Total Sales', value: `$${(hostProfile.totalSales / 100).toFixed(2)}`, icon: DollarSign },
            { label: 'Rating', value: `${hostProfile.averageRating.toFixed(1)} ★`, icon: TrendingUp },
          ].map((stat, index) => (
            <div key={index} className="bg-warm-white p-4 border border-sand">
              <div className="flex items-center gap-2 text-warm-gray mb-2">
                <stat.icon className="w-4 h-4" />
                <span className="font-body text-xs uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Streams List */}
        <div className="bg-warm-white border border-sand">
          <div className="p-4 border-b border-sand flex items-center justify-between">
            <h2 className="font-display text-charcoal text-lg" style={{ fontWeight: 400 }}>
              Your Streams
            </h2>
            <Link
              href="/host/streams"
              className="font-body text-sm text-terracotta hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {streams.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="w-12 h-12 text-sand mx-auto mb-4" />
              <p className="font-body text-warm-gray mb-4">
                You haven't created any streams yet.
              </p>
              <Link
                href="/host/streams/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-cream font-body text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Your First Stream
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-sand">
              {streams.slice(0, 5).map((stream) => (
                <div key={stream.id} className="p-4 flex items-center justify-between hover:bg-sand/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-charcoal" style={{ fontWeight: 400 }}>
                        {stream.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-body ${stream.status === 'live' ? 'bg-terracotta text-cream' :
                        stream.status === 'scheduled' ? 'bg-sand text-charcoal' :
                          stream.status === 'ended' ? 'bg-warm-gray/20 text-warm-gray' :
                            'bg-warm-gray/10 text-warm-gray'
                        }`}>
                        {stream.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-warm-gray">
                      <span className="font-body text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(stream.scheduledStart)}
                      </span>
                      {stream.status === 'ended' && (
                        <>
                          <span className="font-body text-xs flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {stream.totalUniqueViewers} viewers
                          </span>
                          <span className="font-body text-xs flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${(stream.revenue / 100).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {stream.status === 'scheduled' && (
                      <Link
                        href={`/host/streams/${stream.id}/go-live`}
                        className="px-3 py-1 bg-terracotta text-cream font-body text-xs hover:bg-terracotta/90"
                      >
                        Go Live
                      </Link>
                    )}
                    {stream.status === 'live' && (
                      <Link
                        href={`/host/streams/${stream.id}/go-live`}
                        className="px-3 py-1 bg-charcoal text-cream font-body text-xs hover:bg-charcoal/90"
                      >
                        Control Room
                      </Link>
                    )}
                    <Link
                      href={`/host/streams/${stream.id}`}
                      className="px-3 py-1 border border-sand font-body text-xs hover:border-terracotta"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
