'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

interface RevokeSessionButtonProps {
  sessionId: string
}

export default function RevokeSessionButton({ sessionId }: RevokeSessionButtonProps) {
  const router = useRouter()

  const handleRevoke = async () => {
    try {
      const res = await fetch('/api/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (res.ok) {
        toast.success('Session revoked')
        router.refresh()
      } else {
        toast.error('Failed to revoke session')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <button 
      onClick={handleRevoke}
      className="flex items-center gap-2 px-3 py-1 border border-sand text-warm-gray text-xs font-body hover:border-ember hover:text-ember transition-colors"
    >
      <LogOut className="w-3 h-3" />
      Revoke
    </button>
  )
}
