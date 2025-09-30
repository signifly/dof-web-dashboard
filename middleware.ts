import { NextResponse, type NextRequest } from "next/server"

// Simple cache for middleware session validation (Edge Runtime compatible)
const middlewareSessionCache = new Map<
  string,
  { validated: boolean; expiresAt: number }
>()
const MIDDLEWARE_CACHE_TTL = 2 * 60 * 1000 // 2 minutes for middleware cache

/**
 * Check if path is a static asset that should bypass auth
 */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ttf|eot)$/.test(
      pathname
    )
  )
}

/**
 * Create cache key from token (simple hash for Edge Runtime)
 */
function createCacheKey(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Optimized middleware with cache-first auth validation
 * Fast path for static assets, minimal JWT validation, deferred full verification
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast path: Skip auth entirely for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Allow access to auth-related paths
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = request.cookies.get("auth-session")

  if (!sessionToken?.value) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "session_expired")
    return NextResponse.redirect(loginUrl)
  }

  // Cache-first validation: Check if token was recently validated
  const cacheKey = createCacheKey(sessionToken.value)
  const cached = middlewareSessionCache.get(cacheKey)

  if (cached && Date.now() < cached.expiresAt) {
    // Cache hit - token was recently validated
    return NextResponse.next()
  }

  // Cache miss - perform minimal JWT structure validation
  try {
    const parts = sessionToken.value.split(".")

    // Basic JWT structure check only (defer full verification to pages)
    if (parts.length !== 3) {
      throw new Error("Invalid JWT structure")
    }

    // Quick expiration check without full payload parsing
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error("Token expired")
    }

    // Cache the validation result
    middlewareSessionCache.set(cacheKey, {
      validated: true,
      expiresAt: Date.now() + MIDDLEWARE_CACHE_TTL,
    })

    // Cleanup expired cache entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      const now = Date.now()
      // Use Array.from to ensure compatibility with all TypeScript targets
      for (const [key, value] of Array.from(middlewareSessionCache.entries())) {
        if (now > value.expiresAt) {
          middlewareSessionCache.delete(key)
        }
      }
    }
  } catch (error) {
    // Remove from cache and redirect to login
    middlewareSessionCache.delete(cacheKey)

    console.error("Middleware JWT validation failed:", {
      timestamp: new Date().toISOString(),
      pathname,
      reason: error instanceof Error ? error.message : "unknown_error",
    })

    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "session_expired")
    return NextResponse.redirect(loginUrl)
  }

  // Token passes basic validation - full verification at page level
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes that need to handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
