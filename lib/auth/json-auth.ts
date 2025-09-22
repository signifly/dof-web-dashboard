/**
 * Simple JSON-based Authentication Service
 * No database required - reads from JSON file
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Result, tryCatch } from "@/lib/utils/result"
import { ERROR_MESSAGES } from "@/src/constants"
import usersData from "./users.json"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  is_active: boolean
  created_at: string
  last_login_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: User
  token: string
}

// Session configuration
const SESSION_COOKIE_NAME = "dof-session"
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Simple in-memory session storage for development
const activeSessions = new Map<string, { userId: string; expiresAt: Date }>()

/**
 * Simple JSON-based Authentication Service
 */
export class JsonAuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<Result<AuthResult>> {
    return tryCatch(async (): Promise<AuthResult> => {
      const { email, password } = credentials

      // Find user by email
      const user = usersData.users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.is_active
      )

      if (!user) {
        throw new Error("Invalid email or password")
      }

      // Verify password (plain text comparison for simplicity)
      if (password !== user.password) {
        throw new Error("Invalid email or password")
      }

      // Create session token
      const token = this.generateSessionToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION)

      // Save session in memory
      activeSessions.set(token, {
        userId: user.id,
        expiresAt,
      })

      // Set session cookie
      const cookieStore = cookies()
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })

      const { password: _, ...userWithoutPassword } = user
      const authResult = {
        user: {
          ...userWithoutPassword,
          last_login_at: new Date().toISOString(),
        } as User,
        token,
      }
      console.log("Auth service returning:", authResult)
      return authResult
    })
  }

  /**
   * Logout current user
   */
  async logout(): Promise<Result<void>> {
    return tryCatch(async () => {
      const cookieStore = cookies()
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

      if (token) {
        // Remove session from memory
        activeSessions.delete(token)

        // Clear session cookie
        cookieStore.set(SESSION_COOKIE_NAME, "", {
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        })
      }
    })
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<Result<User | null>> {
    return tryCatch(async () => {
      const cookieStore = cookies()
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

      if (!token) {
        return null
      }

      // Check if session exists and is valid
      const session = activeSessions.get(token)
      if (!session || session.expiresAt < new Date()) {
        // Invalid or expired session
        activeSessions.delete(token)
        cookieStore.set(SESSION_COOKIE_NAME, "", {
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        })
        return null
      }

      // Find user by ID
      const user = usersData.users.find(u => u.id === session.userId)
      if (!user || !user.is_active) {
        activeSessions.delete(token)
        return null
      }

      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword as User
    })
  }

  /**
   * Require authentication (for use in Server Components)
   */
  async requireAuth(): Promise<User> {
    const result = await this.getCurrentUser()

    if (!result.data) {
      redirect("/auth/login")
    }

    return result.data
  }

  /**
   * Check if user has specific role
   */
  async requireRole(role: "admin" | "user"): Promise<User> {
    const user = await this.requireAuth()

    if (user.role !== role && user.role !== "admin") {
      redirect("/dashboard") // Redirect to dashboard if insufficient permissions
    }

    return user
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    return Array.from(randomBytes, byte =>
      byte.toString(16).padStart(2, "0")
    ).join("")
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<Result<void>> {
    return tryCatch(async () => {
      const now = new Date()
      for (const [token, session] of activeSessions.entries()) {
        if (session.expiresAt < now) {
          activeSessions.delete(token)
        }
      }
    })
  }
}

// Create singleton instance
export const authService = new JsonAuthService()

// Helper functions for Server Components
export async function getUser(): Promise<User | null> {
  const result = await authService.getCurrentUser()

  if (!result.data) {
    return null
  }

  // Ensure we return only serializable data
  const user = result.data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  }
}

export async function requireAuth(): Promise<User> {
  const result = await authService.getCurrentUser()

  if (!result.data) {
    redirect("/auth/login")
  }

  // Ensure we return only serializable data
  const user = result.data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  }
}

export async function requireAdmin(): Promise<User> {
  return authService.requireRole("admin")
}