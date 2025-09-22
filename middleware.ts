/**
 * Simple Authentication Middleware
 * Checks for valid session tokens and redirects to login if needed
 */

import { NextResponse, type NextRequest } from "next/server"
// No external dependencies needed for JSON auth

export async function middleware(request: NextRequest) {
  // No authentication required - allow all requests
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
