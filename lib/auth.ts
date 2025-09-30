import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { env, type AuthUser } from "@/lib/env"
import {
  getCachedSession,
  setCachedSession,
  invalidateCachedSession,
} from "@/lib/auth/session-cache"

const SESSION_COOKIE_NAME = "auth-session"

export interface AuthSession {
  email: string
  iat: number
  exp: number
}

/**
 * Authenticate user with environment-based credentials using bcrypt
 */
export function authenticateUser(
  email: string,
  password: string
): AuthUser | null {
  const normalizedEmail = email.toLowerCase().trim()

  // Find user by email first
  const user = env.ALLOWED_USERS.find(u => u.email === normalizedEmail)

  // If user not found or password doesn't match, return null
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return null
  }

  return user
}

/**
 * Create a JWT session token for authenticated user with shorter expiration
 */
export function createSession(user: AuthUser): string {
  return jwt.sign(
    { email: user.email },
    env.AUTH_SECRET,
    { expiresIn: "24h" } // 24 hour session for better security
  )
}

/**
 * Verify and decode a session token with secure error handling
 */
export function verifySession(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, env.AUTH_SECRET) as AuthSession
    return decoded
  } catch (error) {
    // Log securely without exposing sensitive data
    console.error("Session verification failed:", {
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.name : "Unknown",
      reason:
        error instanceof jwt.JsonWebTokenError
          ? "invalid_token"
          : "verification_error",
    })
    return null
  }
}

/**
 * Get the current session from cookies with caching
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionToken?.value) {
    return null
  }

  // Check cache first
  const cached = getCachedSession(sessionToken.value)
  if (cached) {
    return cached.session
  }

  // Cache miss - verify JWT and cache result
  const session = verifySession(sessionToken.value)
  if (session) {
    // Find user to cache with session
    const user = env.ALLOWED_USERS.find(u => u.email === session.email)
    if (user) {
      setCachedSession(sessionToken.value, user, session)
    }
  }

  return session
}

/**
 * Get the current authenticated user with caching
 */
export async function getUser(): Promise<AuthUser | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionToken?.value) {
    return null
  }

  // Check cache first for complete user data
  const cached = getCachedSession(sessionToken.value)
  if (cached) {
    return cached.user
  }

  // Cache miss - fall back to session verification
  const session = await getSession()
  if (!session) {
    return null
  }

  // Find user in allowed users list
  return env.ALLOWED_USERS.find(user => user.email === session.email) || null
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

/**
 * Set session cookie with enhanced security
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Enhanced CSRF protection
    maxAge: 24 * 60 * 60, // 24 hours in seconds (matches JWT expiration)
    path: "/",
  })
}

/**
 * Clear session cookie and cache (sign out)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

  // Invalidate cache entry if token exists
  if (sessionToken?.value) {
    invalidateCachedSession(sessionToken.value)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Check if a user is authorized (exists in allowed users)
 */
export function isUserAuthorized(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  return env.ALLOWED_USERS.some(user => user.email === normalizedEmail)
}
