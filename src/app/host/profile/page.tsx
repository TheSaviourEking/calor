import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Link as LinkIcon } from 'lucide-react'

export default async function HostProfileSettingsPage() {
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

                <div className="bg-warm-white p-8 border border-sand space-y-6">
                    <div className="flex items-center justify-center mb-8">
                        <div className="w-24 h-24 bg-sand border border-charcoal/10 rounded-full flex items-center justify-center overflow-hidden">
                            {hostProfile.avatar ? (
                                <img src={hostProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-warm-gray" />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="font-body text-sm text-charcoal mb-2 block">Display Name</label>
                        <input
                            readOnly
                            value={hostProfile.displayName}
                            className="w-full px-4 py-3 bg-sand/20 border border-sand font-body text-charcoal outline-none opacity-70"
                        />
                    </div>

                    <div>
                        <label className="font-body text-sm text-charcoal mb-2 block">Bio</label>
                        <textarea
                            readOnly
                            value={hostProfile.bio || ''}
                            rows={4}
                            className="w-full px-4 py-3 bg-sand/20 border border-sand font-body text-charcoal outline-none opacity-70 resize-none"
                            placeholder="No biography written yet."
                        />
                    </div>

                    <div className="pt-4 border-t border-sand">
                        <p className="font-body text-sm text-warm-gray mb-4">Settings modification form goes here. In this version, settings are read-only.</p>
                        <button disabled className="w-full py-4 bg-charcoal text-cream font-body uppercase text-sm opacity-50 cursor-not-allowed">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
