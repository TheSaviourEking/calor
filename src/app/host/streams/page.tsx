import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Calendar, Clock, Edit } from 'lucide-react'

export default async function HostStreamsPage() {
    const session = await getSession()
    if (!session?.customerId) {
        redirect('/account/login')
    }

    const hostProfile = await db.streamHost.findUnique({
        where: { customerId: session.customerId },
    })

    if (!hostProfile) {
        redirect('/host/dashboard')
    }

    const streams = await db.liveStream.findMany({
        where: { hostId: hostProfile.id },
        orderBy: { scheduledStart: 'desc' },
    })

    return (
        <div className="min-h-screen pt-20 bg-cream">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/host/dashboard"
                        className="w-10 h-10 border border-sand flex items-center justify-center hover:border-terracotta"
                    >
                        <ArrowLeft className="w-5 h-5 text-charcoal" />
                    </Link>
                    <div>
                        <h1 className="font-display text-charcoal text-3xl font-light">
                            All Streams
                        </h1>
                    </div>
                </div>

                {streams.length === 0 ? (
                    <div className="bg-warm-white p-8 border border-sand text-center">
                        <p className="font-body text-warm-gray mb-4">You have no streams yet.</p>
                        <Link href="/host/streams/new" className="px-6 py-3 bg-terracotta text-cream font-body uppercase text-sm">
                            Create a Stream
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {streams.map((stream) => (
                            <div key={stream.id} className="bg-warm-white p-6 border border-sand flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-display text-charcoal text-xl mb-2">{stream.title}</h3>
                                    <div className="flex items-center gap-4 text-warm-gray text-sm font-body">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(stream.scheduledStart).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(stream.scheduledStart).toLocaleTimeString()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${stream.status === 'live' ? 'bg-terracotta text-cream' : 'bg-sand text-charcoal'
                                            }`}>
                                            {stream.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/host/streams/${stream.id}`} className="px-4 py-2 border border-sand hover:border-terracotta text-sm font-body">
                                        Manage
                                    </Link>
                                    {stream.status !== 'ended' && (
                                        <Link href={`/host/streams/${stream.id}/go-live`} className="px-4 py-2 bg-charcoal text-cream hover:bg-charcoal/90 text-sm font-body">
                                            {stream.status === 'live' ? 'Control Room' : 'Go Live'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
