import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for environment-based authentication
 * Protects all routes except login and public assets
 * Note: JWT verification is done server-side to avoid Edge Runtime issues
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and auth-related paths
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('auth-session')

  if (!sessionToken?.value) {
    // No session, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // For Edge Runtime compatibility, we just check if cookie exists
  // Full JWT verification happens server-side in each protected page
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
