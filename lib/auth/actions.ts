"use server"

import { redirect } from "next/navigation"
import {
  authenticateUser,
  createSession,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth"

// Result pattern for better error handling
type Success<T> = { data: T; error: null }
type Failure<E> = { data: null; error: E }
type Result<T, E = string> = Success<T> | Failure<E>

// Legacy interface for compatibility
export interface LoginResult {
  success: boolean
  error?: string
}

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<
  string,
  { count: number; lastAttempt: number; blockedUntil?: number }
>()

/**
 * Check if user is rate limited
 */
function checkRateLimit(email: string): Result<true, string> {
  const now = Date.now()
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 }

  // Check if user is currently blocked
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    const remainingMinutes = Math.ceil(
      (attempts.blockedUntil - now) / (60 * 1000)
    )
    return {
      data: null,
      error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
    }
  }

  // Reset attempts if more than 15 minutes passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0
    attempts.blockedUntil = undefined
  }

  // Block if too many attempts
  if (attempts.count >= 5) {
    attempts.blockedUntil = now + 15 * 60 * 1000 // Block for 15 minutes
    loginAttempts.set(email, attempts)
    return {
      data: null,
      error: "Too many failed attempts. Account temporarily locked.",
    }
  }

  return { data: true, error: null }
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const now = Date.now()
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 }

  attempts.count++
  attempts.lastAttempt = now
  loginAttempts.set(email, attempts)
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}

/**
 * Server action to handle user login with rate limiting and secure error handling
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  const trimmedEmail = email?.toLowerCase().trim()

  try {
    // Validate input
    if (!trimmedEmail || !password) {
      return {
        success: false,
        error: "Email and password are required",
      }
    }

    // Check rate limiting
    const rateLimitResult = checkRateLimit(trimmedEmail)
    if (rateLimitResult.error) {
      return {
        success: false,
        error: rateLimitResult.error,
      }
    }

    // Authenticate user against environment variables
    const user = authenticateUser(trimmedEmail, password)

    if (!user) {
      // Record failed attempt
      recordFailedAttempt(trimmedEmail)

      // Log security event without exposing sensitive data
      console.warn("Failed login attempt:", {
        timestamp: new Date().toISOString(),
        email: trimmedEmail,
        ip: "unknown", // Would get from headers in production
        userAgent: "unknown", // Would get from headers in production
      })

      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // Clear any previous failed attempts
    clearLoginAttempts(trimmedEmail)

    // Create session token
    const sessionToken = createSession(user)

    // Set session cookie
    await setSessionCookie(sessionToken)

    // Log successful login
    console.info("Successful login:", {
      timestamp: new Date().toISOString(),
      email: trimmedEmail,
      sessionDuration: "24h",
    })

    return { success: true }
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error("Login system error:", {
      timestamp: new Date().toISOString(),
      email: trimmedEmail,
      errorType: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    })

    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    }
  }
}

/**
 * Server action to handle user logout with secure logging
 */
export async function logoutAction(): Promise<void> {
  try {
    await clearSessionCookie()

    // Log successful logout
    console.info("User logout:", {
      timestamp: new Date().toISOString(),
      action: "session_cleared",
    })
  } catch (error) {
    // Log error securely
    console.error("Logout system error:", {
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.name : "Unknown",
      message: "Failed to clear session cookie",
    })
  }

  redirect("/auth/login")
}

/**
 * Enhanced login action using Result pattern (for future use)
 */
export async function loginActionV2(
  email: string,
  password: string
): Promise<Result<{ user: { email: string }; sessionToken: string }, string>> {
  const trimmedEmail = email?.toLowerCase().trim()

  if (!trimmedEmail || !password) {
    return { data: null, error: "Email and password are required" }
  }

  const rateLimitResult = checkRateLimit(trimmedEmail)
  if (rateLimitResult.error) {
    return { data: null, error: rateLimitResult.error }
  }

  const user = authenticateUser(trimmedEmail, password)
  if (!user) {
    recordFailedAttempt(trimmedEmail)
    return { data: null, error: "Invalid email or password" }
  }

  try {
    clearLoginAttempts(trimmedEmail)
    const sessionToken = createSession(user)
    await setSessionCookie(sessionToken)

    return {
      data: {
        user: { email: user.email },
        sessionToken,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: "Failed to create session" }
  }
}
