import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/account", "/admin", "/host", "/checkout"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security headers (skip for API routes and static assets)
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
  }

  // CORS for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      "https://calorco.com",
    ];
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    return response;
  }

  // Age gate verification
  const isVerified = request.cookies.has("calor_age_verified");
  const isAgeGatePage = pathname === "/age-gate";

  if (!isVerified && !isAgeGatePage) {
    const searchParams = new URLSearchParams();
    searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/age-gate?${searchParams.toString()}`, request.url)
    );
  }

  if (isVerified && isAgeGatePage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Auth redirect for protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get("calor_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/age-gate", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
