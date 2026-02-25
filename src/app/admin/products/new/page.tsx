import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import AdminProductForm from './AdminProductForm'

export default async function NewProductPage() {
    const session = await getSession()

    // In production, check for admin flag in user record.
    // For now, allow access for demo purposes.
    if (!session?.customerId) {
        redirect('/account')
    }

    return (
        <div className="min-h-screen pt-20 bg-cream">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="font-display text-charcoal text-3xl font-light mb-8">
                    Create New Product
                </h1>
                <AdminProductForm />
            </div>
        </div>
    )
}
