import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Match all routes except auth routes, static files, and api routes.
// For api routes, if we want to age gate, we'd need to handle that inside the route logic.
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ]
}

export function middleware(request: NextRequest) {
    const isVerified = request.cookies.has('calor_age_verified')
    const isAgeGatePage = request.nextUrl.pathname === '/age-gate'

    // If not verified and trying to access a restricted page, redirect to age-gate
    if (!isVerified && !isAgeGatePage) {
        // Add the original destination to redirect back after verification
        const searchParams = new URLSearchParams()
        searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)

        return NextResponse.redirect(new URL(`/age-gate?${searchParams.toString()}`, request.url))
    }

    // If verified and trying to access age-gate, redirect to home
    if (isVerified && isAgeGatePage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}
