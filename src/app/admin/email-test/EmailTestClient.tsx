'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'

interface EmailStatus {
  configured: boolean
  message: string
  timestamp: string
  resendApiKeySet: boolean
  siteUrl: string
}

interface TestResult {
  success: boolean
  type: string
  email: string
  error?: string
  timestamp: string
}

const EMAIL_TYPES = [
  { value: 'order_confirmation', label: 'Order Confirmation', description: 'Sent after successful order' },
  { value: 'welcome', label: 'Welcome Email', description: 'Sent to new customers' },
  { value: 'password_reset', label: 'Password Reset', description: 'Reset password link' },
  { value: 'verification', label: 'Email Verification', description: 'Verify email address' },
  { value: 'shipping', label: 'Shipping Notification', description: 'Order shipped notification' },
  { value: 'gift_card', label: 'Gift Card', description: 'Gift card delivery' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', description: 'Cart recovery email' },
  { value: 'price_drop', label: 'Price Drop Alert', description: 'Price drop notification' },
  { value: 'back_in_stock', label: 'Back in Stock', description: 'Restock notification' },
  { value: 'security_alert', label: 'Security Alert', description: 'Account security notification' },
]

export default function EmailTestClient() {
  const [status, setStatus] = useState<EmailStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [emailType, setEmailType] = useState('order_confirmation')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/email/test')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch email status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendTestEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          email: testEmail,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        type: emailType,
        email: testEmail,
        error: 'Failed to send test email',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setSending(false)
    }
  }

  function copyEnvTemplate() {
    const template = `# Email Service (Resend)
# Get your API key at https://resend.com/api-keys
RESEND_API_KEY=re_your_actual_api_key_here

# Site URL for email links
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Job Authorization
CRON_SECRET_KEY=your-secure-random-key-here`
    
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-charcoal font-body">Loading email configuration...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl text-charcoal mb-2" style={{ fontWeight: 300 }}>
            Email Service Test
          </h1>
          <p className="font-body text-warm-gray">
            Verify your email configuration and send test emails
          </p>
        </div>

        {/* Status Card */}
        <div className={`p-6 mb-8 border ${
          status?.configured 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            {status?.configured ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div className="flex-1">
              <h2 className="font-display text-xl text-charcoal" style={{ fontWeight: 300 }}>
                {status?.configured ? 'Email Service Configured' : 'Email Service Not Configured'}
              </h2>
              <p className="font-body text-sm text-warm-gray">{status?.message}</p>
            </div>
            <button
              onClick={fetchStatus}
              className="p-2 text-warm-gray hover:text-charcoal"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Details */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm font-body">
            <div>
              <span className="text-warm-gray">RESEND_API_KEY:</span>
              <span className={`ml-2 ${status?.resendApiKeySet ? 'text-green-600' : 'text-red-600'}`}>
                {status?.resendApiKeySet ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div>
              <span className="text-warm-gray">Site URL:</span>
              <span className="ml-2 text-charcoal">{status?.siteUrl}</span>
            </div>
          </div>
        </div>

        {/* Configuration Instructions */}
        {!status?.configured && (
          <div className="bg-white border border-sand p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-terracotta flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-display text-lg text-charcoal mb-2" style={{ fontWeight: 300 }}>
                  Setup Instructions
                </h3>
                <ol className="font-body text-sm text-warm-gray space-y-2 mb-4">
                  <li>1. Create a free account at <a href="https://resend.com" target="_blank" className="text-terracotta hover:underline">resend.com</a></li>
                  <li>2. Get your API key from the dashboard</li>
                  <li>3. Add the API key to your <code className="bg-sand px-1">.env</code> file</li>
                  <li>4. Restart your development server</li>
                </ol>
                
                <div className="bg-sand p-4 relative">
                  <code className="text-xs text-charcoal whitespace-pre-line block pr-10">{`# Email Service (Resend)
# Get your API key at https://resend.com/api-keys
RESEND_API_KEY=re_your_actual_api_key_here

# Site URL for email links
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Job Authorization
CRON_SECRET_KEY=your-secure-random-key-here`}</code>
                  <button
                    onClick={copyEnvTemplate}
                    className="absolute top-2 right-2 p-2 text-warm-gray hover:text-charcoal"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Email Form */}
        <div className="bg-white border border-sand p-6">
          <h3 className="font-display text-xl text-charcoal mb-4" style={{ fontWeight: 300 }}>
            Send Test Email
          </h3>

          <form onSubmit={sendTestEmail} className="space-y-4">
            <div>
              <label className="block font-body text-sm text-warm-gray mb-2">
                Email Type
              </label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="w-full p-3 border border-sand font-body text-charcoal bg-white"
              >
                {EMAIL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="font-body text-xs text-warm-gray mt-1">
                {EMAIL_TYPES.find(t => t.value === emailType)?.description}
              </p>
            </div>

            <div>
              <label className="block font-body text-sm text-warm-gray mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full p-3 border border-sand font-body text-charcoal"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!status?.configured || sending}
              className={`w-full py-3 font-body flex items-center justify-center gap-2 ${
                status?.configured
                  ? 'bg-charcoal text-cream hover:bg-charcoal/90'
                  : 'bg-warm-gray/30 text-warm-gray cursor-not-allowed'
              }`}
            >
              <Mail className="w-5 h-5" />
              {sending ? 'Sending...' : 'Send Test Email'}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-body text-sm text-charcoal">
                    {result.success 
                      ? `Test email sent successfully to ${result.email}` 
                      : `Failed to send email: ${result.error}`
                    }
                  </p>
                  <p className="font-body text-xs text-warm-gray mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Email Flows Documentation */}
        <div className="mt-8 bg-white border border-sand p-6">
          <h3 className="font-display text-xl text-charcoal mb-4" style={{ fontWeight: 300 }}>
            Email Flows
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body text-sm">
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Order Confirmation</strong>
              <p className="text-warm-gray text-xs mt-1">Sent after successful order creation</p>
            </div>
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Password Reset</strong>
              <p className="text-warm-gray text-xs mt-1">Sent when user requests password reset</p>
            </div>
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Email Verification</strong>
              <p className="text-warm-gray text-xs mt-1">Sent on registration</p>
            </div>
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Shipping Notification</strong>
              <p className="text-warm-gray text-xs mt-1">Sent when order is shipped (admin action)</p>
            </div>
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Gift Card Delivery</strong>
              <p className="text-warm-gray text-xs mt-1">Sent immediately or scheduled</p>
            </div>
            <div className="p-3 bg-sand">
              <strong className="text-charcoal">Abandoned Cart</strong>
              <p className="text-warm-gray text-xs mt-1">Sent via cron job (1hr after abandonment)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
