'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface HostProfile {
    displayName: string
    bio: string | null
    avatar: string | null
    socialLinks: string | null
}

export default function HostProfileSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hostProfile, setHostProfile] = useState<HostProfile | null>(null)

    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/hosts/me')
                if (!res.ok) {
                    if (res.status === 401) {
                        window.location.href = '/account/login'
                        return
                    }
                    throw new Error('Failed to fetch profile')
                }
                const data = await res.json()
                if (!data.host) {
                    window.location.href = '/host/dashboard'
                    return
                }
                setHostProfile(data.host)
                setDisplayName(data.host.displayName || '')
                setBio(data.host.bio || '')
                setAvatarUrl(data.host.avatar || '')
            } catch {
                toast.error('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/hosts/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    bio,
                    avatarUrl: avatarUrl || undefined,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update profile')
            }

            const data = await res.json()
            setHostProfile(data.host)
            toast.success('Profile updated successfully')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
            </div>
        )
    }

    if (!hostProfile) {
        return null
    }

    return (
        <div className="min-h-screen pt-20 bg-cream">
            <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/host/dashboard"
                        className="w-10 h-10 border border-sand flex items-center justify-center hover:border-terracotta"
                    >
                        <ArrowLeft className="w-5 h-5 text-charcoal" />
                    </Link>
                    <div>
                        <h1 className="font-display text-charcoal text-3xl font-light">
                            Host Settings
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-warm-white p-8 border border-sand space-y-6">
                    <div className="flex items-center justify-center mb-8">
                        <div className="w-24 h-24 bg-sand border border-charcoal/10 rounded-full flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-warm-gray" />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="font-body text-sm text-charcoal mb-2 block">Display Name</label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-sand/20 border border-sand font-body text-charcoal outline-none focus:border-terracotta transition-colors"
                        />
                    </div>

                    <div>
                        <label className="font-body text-sm text-charcoal mb-2 block">Avatar URL</label>
                        <input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full px-4 py-3 bg-sand/20 border border-sand font-body text-charcoal outline-none focus:border-terracotta transition-colors"
                        />
                    </div>

                    <div>
                        <label className="font-body text-sm text-charcoal mb-2 block">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-sand/20 border border-sand font-body text-charcoal outline-none focus:border-terracotta transition-colors resize-none"
                            placeholder="Tell viewers about yourself..."
                        />
                    </div>

                    <div className="pt-4 border-t border-sand">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-charcoal text-cream font-body uppercase text-sm hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
