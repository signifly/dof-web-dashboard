import type { AuthUser, AuthSession } from "@/lib/auth"

interface CachedSession {
  user: AuthUser
  session: AuthSession
  cachedAt: number
  expiresAt: number
}

/**
 * In-memory session cache to reduce JWT parsing overhead
 * Cache TTL is shorter than JWT expiration for security
 */
class SessionCache {
  private cache = new Map<string, CachedSession>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute cleanup

  constructor() {
    // Start periodic cleanup of expired entries
    if (typeof globalThis !== "undefined") {
      setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
    }
  }

  /**
   * Get cached session by token hash
   */
  get(tokenHash: string): { user: AuthUser; session: AuthSession } | null {
    const cached = this.cache.get(tokenHash)

    if (!cached) {
      return null
    }

    // Check if cache entry has expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(tokenHash)
      return null
    }

    return {
      user: cached.user,
      session: cached.session
    }
  }

  /**
   * Set cached session with TTL
   */
  set(
    tokenHash: string,
    user: AuthUser,
    session: AuthSession,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const now = Date.now()

    this.cache.set(tokenHash, {
      user,
      session,
      cachedAt: now,
      expiresAt: now + ttl
    })
  }

  /**
   * Invalidate cached session
   */
  invalidate(tokenHash: string): void {
    this.cache.delete(tokenHash)
  }

  /**
   * Clear all cached sessions
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    const entries = Array.from(this.cache.values())
    const expired = entries.filter(entry => now > entry.expiresAt)

    return {
      totalEntries: this.cache.size,
      expiredEntries: expired.length,
      activeEntries: this.cache.size - expired.length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.cachedAt)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.cachedAt)) : null
    }
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.debug(`Session cache cleaned up ${cleanedCount} expired entries`)
    }
  }
}

// Create singleton instance
const sessionCache = new SessionCache()

/**
 * Create a cache key from token (hash for security)
 */
export function createTokenHash(token: string): string {
  // Simple hash for cache key (not cryptographic, just for collision avoidance)
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Get cached session for a token
 */
export function getCachedSession(token: string): { user: AuthUser; session: AuthSession } | null {
  const tokenHash = createTokenHash(token)
  return sessionCache.get(tokenHash)
}

/**
 * Cache a session for a token
 */
export function setCachedSession(
  token: string,
  user: AuthUser,
  session: AuthSession,
  ttl?: number
): void {
  const tokenHash = createTokenHash(token)
  sessionCache.set(tokenHash, user, session, ttl)
}

/**
 * Invalidate cached session for a token
 */
export function invalidateCachedSession(token: string): void {
  const tokenHash = createTokenHash(token)
  sessionCache.invalidate(tokenHash)
}

/**
 * Clear all cached sessions (useful for logout, security incidents)
 */
export function clearSessionCache(): void {
  sessionCache.clear()
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getSessionCacheStats() {
  return sessionCache.getStats()
}

export default sessionCache