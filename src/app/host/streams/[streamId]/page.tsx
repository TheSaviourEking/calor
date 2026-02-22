import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Settings, Users, DollarSign } from 'lucide-react'

export default async function StreamDetailsPage({ params }: { params: Promise<{ streamId: string }> }) {
    const session = await getSession()
    if (!session?.customerId) {
        redirect('/account/login')
    }

    const { streamId } = await params

    const stream = await db.liveStream.findUnique({
        where: { id: streamId },
        include: {
            host: true,
            products: {
                include: {
                    product: {
                        include: {
                            images: true,
                        }
                    }
                }
            }
        }
    })

    if (!stream) {
        redirect('/host/streams')
    }

    return (
        <div className="min-h-screen pt-20 bg-cream">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/host/dashboard"
                            className="w-10 h-10 border border-sand flex items-center justify-center hover:border-terracotta"
                        >
                            <ArrowLeft className="w-5 h-5 text-charcoal" />
                        </Link>
                        <div>
                            <h1 className="font-display text-charcoal text-3xl font-light">
                                {stream.title}
                            </h1>
                            <p className="font-body text-warm-gray">
                                Stream Details & Management
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/host/streams/${stream.id}/go-live`}
                        className="px-6 py-3 bg-terracotta text-cream font-body uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-terracotta/90"
                    >
                        <Play className="w-4 h-4" />
                        Enter Studio
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-warm-white p-6 border border-sand">
                            <h2 className="font-display text-xl mb-4 text-charcoal font-light">Stream Info</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-body text-warm-gray mb-1">Description</p>
                                    <p className="font-body text-charcoal">{stream.description || 'No description provided.'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-body text-warm-gray mb-1">Scheduled Time</p>
                                    <p className="font-body text-charcoal">{new Date(stream.scheduledStart).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-body text-warm-gray mb-1">Status</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-body rounded ${stream.status === 'live' ? 'bg-terracotta text-cream' :
                                        stream.status === 'ended' ? 'bg-warm-gray/20 text-charcoal' : 'bg-sand text-charcoal'
                                        }`}>
                                        {stream.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-warm-white p-6 border border-sand">
                            <h2 className="font-display text-xl mb-4 text-charcoal font-light">Featured Products</h2>
                            {stream.products.length === 0 ? (
                                <p className="font-body text-warm-gray">No products attached to this stream.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {stream.products.map(sp => (
                                        <div key={sp.id} className="flex gap-4 border border-sand p-3">
                                            <div className="w-16 h-16 bg-sand flex-shrink-0">
                                                {sp.product.images[0] && (
                                                    <img src={sp.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-body text-sm font-medium">{sp.product.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-warm-white p-6 border border-sand">
                            <h2 className="font-display text-xl mb-4 text-charcoal font-light">Analytics</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-sand flex items-center justify-center">
                                        <Users className="w-5 h-5 text-charcoal" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-body text-warm-gray uppercase">Unique Viewers</p>
                                        <p className="font-display text-xl">{stream.totalUniqueViewers}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-sand flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-charcoal" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-body text-warm-gray uppercase">Revenue</p>
                                        <p className="font-display text-xl">${(stream.revenue / 100).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button disabled className="w-full py-3 border border-sand bg-warm-white font-body text-warm-gray flex justify-center items-center gap-2 cursor-not-allowed">
                            <Settings className="w-4 h-4" /> Edit Details (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
