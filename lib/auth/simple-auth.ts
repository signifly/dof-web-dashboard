/**
 * Simple Authentication Service
 * Table-based authentication with sessions
 */

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { Result, tryCatch } from "@/lib/utils/result"
import { ERROR_MESSAGES } from "@/src/constants"

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

/**
 * Simple Authentication Service
 */
export class SimpleAuthService {
  private supabase = createClient()

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<Result<AuthResult>> {
    return tryCatch(async () => {
      const { email, password } = credentials

      // Find user by email
      const { data: user, error: userError } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("is_active", true)
        .single()

      if (userError || !user) {
        throw new Error("Invalid email or password")
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        throw new Error("Invalid email or password")
      }

      // Create session token
      const token = this.generateSessionToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION)

      // Save session to database
      const { error: sessionError } = await this.supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        })

      if (sessionError) {
        throw new Error(`${ERROR_MESSAGES.AUTH_ERROR}: ${sessionError.message}`)
      }

      // Update last login time
      await this.supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id)

      // Set session cookie
      const cookieStore = cookies()
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })

      const { password_hash, ...userWithoutPassword } = user
      return {
        user: userWithoutPassword as User,
        token,
      }
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
        // Remove session from database
        await this.supabase.from("user_sessions").delete().eq("token", token)

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

      // Find valid session
      const { data: session, error: sessionError } = await this.supabase
        .from("user_sessions")
        .select(
          `
          *,
          user:users(*)
        `
        )
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (sessionError || !session || !session.user) {
        // Invalid or expired session
        cookieStore.set(SESSION_COOKIE_NAME, "", {
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        })
        return null
      }

      const { password_hash, ...userWithoutPassword } = session.user
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
      await this.supabase
        .from("user_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString())
    })
  }
}

// Create singleton instance
export const authService = new SimpleAuthService()

// Helper functions for Server Components
export async function getUser(): Promise<User | null> {
  const result = await authService.getCurrentUser()
  return result.data || null
}

export async function requireAuth(): Promise<User> {
  return authService.requireAuth()
}

export async function requireAdmin(): Promise<User> {
  return authService.requireRole("admin")
}
