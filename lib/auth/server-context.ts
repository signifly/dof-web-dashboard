import { cache } from "react"
import { getUser, type AuthUser } from "@/lib/auth"

/**
 * Server-side auth context using React's cache()
 * This ensures auth is checked only once per request across all server components
 */

/**
 * Cached user getter - uses React's cache to share result across server components
 * This eliminates duplicate requireAuth() calls and JWT verification
 */
export const getCachedUser = cache(async (): Promise<AuthUser | null> => {
  return await getUser()
})

/**
 * Cached auth requirement - throws if not authenticated, caches user if authenticated
 * Use this instead of requireAuth() in server components for better performance
 */
export const getCachedAuthUser = cache(async (): Promise<AuthUser> => {
  const user = await getCachedUser()

  if (!user) {
    // This will trigger a redirect in the middleware or cause an error
    // that should be handled by the calling component
    throw new Error("Authentication required")
  }

  return user
})

/**
 * Auth context for server components
 * Provides cached user data and auth status
 */
export interface ServerAuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
}

/**
 * Get complete server auth context with caching
 * Use this in layout components to share auth state across child components
 */
export const getServerAuthContext = cache(async (): Promise<ServerAuthContext> => {
  const user = await getCachedUser()

  return {
    user,
    isAuthenticated: user !== null
  }
})

/**
 * Check if user is authenticated without throwing
 * Useful for conditional rendering in server components
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const user = await getCachedUser()
  return user !== null
})

/**
 * Get user email if authenticated, null otherwise
 * Useful for personalization in server components
 */
export const getUserEmail = cache(async (): Promise<string | null> => {
  const user = await getCachedUser()
  return user?.email || null
})

/**
 * Preload auth context for server components
 * Call this early in layout components to warm the cache
 */
export async function preloadAuthContext(): Promise<void> {
  // This triggers the cache population without returning data
  void getCachedUser()
}

export default {
  getCachedUser,
  getCachedAuthUser,
  getServerAuthContext,
  isAuthenticated,
  getUserEmail,
  preloadAuthContext
}