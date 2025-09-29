import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for environment-based authentication with enhanced JWT validation
 * Protects all routes except login and public assets
 * Performs lightweight JWT structure validation for Edge Runtime compatibility
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and auth-related paths
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = request.cookies.get("auth-session")

  if (!sessionToken?.value) {
    // No session, redirect to login with session_expired error
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "session_expired")
    return NextResponse.redirect(loginUrl)
  }

  // Enhanced JWT structure validation (Edge Runtime compatible)
  try {
    const parts = sessionToken.value.split(".")

    // Validate JWT structure (header.payload.signature)
    if (parts.length !== 3) {
      throw new Error("Invalid JWT structure")
    }

    // Decode payload to check expiration (without signature verification for Edge Runtime)
    const payload = JSON.parse(atob(parts[1]))

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error("Token expired")
    }

    // Check if token has required fields
    if (!payload.email) {
      throw new Error("Invalid token payload")
    }
  } catch (error) {
    // Invalid or expired token, redirect to login
    console.error("Middleware JWT validation failed:", {
      timestamp: new Date().toISOString(),
      pathname,
      reason: error instanceof Error ? error.message : "unknown_error",
    })

    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "session_expired")
    return NextResponse.redirect(loginUrl)
  }

  // Token structure is valid, proceed to route
  // Full JWT signature verification happens server-side in each protected page
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
