import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for local-only dashboard (no authentication required)
 * This dashboard is designed to run locally and display read-only performance data
 */
export async function middleware(request: NextRequest) {
  // For a local-only dashboard, we don't need authentication
  // Just pass through all requests without any auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
