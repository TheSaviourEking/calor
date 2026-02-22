import { Suspense } from 'react'
import AgeGateClient from './AgeGateClient'

export default function AgeGatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-charcoal" />}>
            <AgeGateClient />
        </Suspense>
    )
}
