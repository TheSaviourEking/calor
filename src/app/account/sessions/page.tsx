import { db } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { Smartphone, MapPin, Clock, Shield } from 'lucide-react'
import RevokeSessionButton from './RevokeSessionButton'

export default async function SessionsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/account')
  }

  const sessions = await db.session.findMany({
    where: { customerId: session.customerId },
    orderBy: { createdAt: 'desc' },
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <>
      <h1 
        className="font-display text-charcoal mb-2"
        style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300 }}
      >
        Active Sessions
      </h1>
      <p className="font-body text-warm-gray text-sm mb-8">
        Manage devices where you are signed in. Revoke access for any suspicious activity.
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-warm-white border border-sand">
          <p className="font-body text-warm-gray">No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div 
              key={s.id} 
              className="bg-warm-white p-6 border border-sand"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <p className="font-body text-charcoal text-sm">
                      {s.deviceInfo || 'Unknown device'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-body text-warm-gray">
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {s.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                    {s.ipAddress && (
                      <p className="font-body text-warm-gray text-xs mt-1">IP: {s.ipAddress}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {new Date() < s.expiresAt ? (
                    <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-xs font-body">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-sand text-warm-gray text-xs font-body">
                      Expired
                    </span>
                  )}
                  {s.token !== session.customerId && (
                    <div className="mt-2">
                      <RevokeSessionButton sessionId={s.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-warm-white border border-sand">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-terracotta" />
          <h3 className="font-body text-charcoal text-sm uppercase tracking-wider">
            Security Tips
          </h3>
        </div>
        <ul className="font-body text-warm-gray text-sm space-y-2">
          <li>Sign out of sessions you do not recognize</li>
          <li>Use a strong, unique password for your account</li>
          <li>Enable two-factor authentication when available</li>
          <li>Contact support if you see suspicious activity</li>
        </ul>
      </div>
    </>
  )
}
