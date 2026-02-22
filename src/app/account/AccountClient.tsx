'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export default function AccountClient() {
    const router = useRouter()
    const { setCustomer } = useAuthStore()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [oauthLoading, setOauthLoading] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            // Sync client state
            if (data.customer) {
                setCustomer(data.customer)
            }

            router.refresh()
            router.push('/account/orders')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        setOauthLoading('google')
        window.location.href = '/api/auth/google'
    }

    const handleAppleLogin = () => {
        setOauthLoading('apple')
        window.location.href = '/api/auth/apple'
    }

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="font-display text-4xl text-charcoal mb-2 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                </div>

                <div className="bg-warm-white/30 backdrop-blur-sm border border-charcoal/5 p-8 rounded-sm">
                    <div className="space-y-4 mb-8">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={!!oauthLoading}
                            className="w-full flex items-center justify-center gap-3 bg-warm-white border border-charcoal/10 py-3 text-sm font-body hover:bg-cream transition-colors disabled:opacity-50"
                        >
                            {oauthLoading === 'google' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            disabled={!!oauthLoading}
                            className="w-full flex items-center justify-center gap-3 bg-[#1C1C1C] text-cream py-3 text-sm font-body hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {oauthLoading === 'apple' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05 1.72-3.23 1.72-1.15 0-1.52-.71-2.92-.71-1.41 0-1.83.69-2.92.71-1.12.02-2.31-.83-3.32-1.77C2.59 18.33 1 15.34 1 12.16c0-4.91 3.19-7.51 6.13-7.51 1.55 0 2.62.9 3.51.9.87 0 2.14-.95 3.86-.95 1.44 0 3.23.76 4.38 2.21-3.07 1.7-2.58 5.76.54 7.14-1.22 2.68-2.66 5.16-4.37 6.33zM12.03 4.65c-.03-2.67 2.23-4.8 4.75-4.65.25 2.48-2.39 4.87-4.75 4.65z" />
                                </svg>
                            )}
                            Continue with Apple
                        </button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-charcoal/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#fcfaf7] px-2 text-warm-gray font-body tracking-widest">or</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    required
                                    className="w-full bg-warm-white border-b border-charcoal/10 px-0 py-3 text-sm font-body focus:outline-none focus:border-terracotta transition-colors placeholder:text-warm-gray/50"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    required
                                    className="w-full bg-warm-white border-b border-charcoal/10 px-0 py-3 text-sm font-body focus:outline-none focus:border-terracotta transition-colors placeholder:text-warm-gray/50"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        )}
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            className="w-full bg-warm-white border-b border-charcoal/10 px-0 py-3 text-sm font-body focus:outline-none focus:border-terracotta transition-colors placeholder:text-warm-gray/50"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full bg-warm-white border-b border-charcoal/10 px-0 py-3 text-sm font-body focus:outline-none focus:border-terracotta transition-colors placeholder:text-warm-gray/50"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-terracotta text-cream py-4 text-sm font-body hover:bg-terracotta/90 transition-all uppercase tracking-widest mt-4 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-2">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs font-body text-warm-gray hover:text-charcoal transition-colors underline underline-offset-4 decoration-charcoal/10"
                        >
                            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                        {isLogin && (
                            <div>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-body text-warm-gray hover:text-charcoal transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[10px] text-center text-warm-gray font-body max-w-xs mx-auto leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <Link href="/legal/terms" className="underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    )
}
