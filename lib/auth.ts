import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { env, type AuthUser } from '@/lib/env'

const SESSION_COOKIE_NAME = 'auth-session'

export interface AuthSession {
  email: string
  iat: number
  exp: number
}

/**
 * Authenticate user with environment-based credentials
 */
export function authenticateUser(email: string, password: string): AuthUser | null {
  const normalizedEmail = email.toLowerCase().trim()

  return env.ALLOWED_USERS.find(
    user => user.email === normalizedEmail && user.password === password
  ) || null
}

/**
 * Create a JWT session token for authenticated user
 */
export function createSession(user: AuthUser): string {
  return jwt.sign(
    { email: user.email },
    env.AUTH_SECRET,
    { expiresIn: '7d' } // 7 day session
  )
}

/**
 * Verify and decode a session token
 */
export function verifySession(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, env.AUTH_SECRET) as AuthSession
    return decoded
  } catch (error) {
    console.error('Invalid session token:', error)
    return null
  }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionToken?.value) {
    return null
  }

  return verifySession(sessionToken.value)
}

/**
 * Get the current authenticated user
 */
export async function getUser(): Promise<AuthUser | null> {
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
    redirect('/auth/login')
  }

  return user
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  })
}

/**
 * Clear session cookie (sign out)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Check if a user is authorized (exists in allowed users)
 */
export function isUserAuthorized(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  return env.ALLOWED_USERS.some(user => user.email === normalizedEmail)
}