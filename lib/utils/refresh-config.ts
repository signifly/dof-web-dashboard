/**
 * Refresh configuration utilities for smart auto-refresh system
 */

export interface RefreshConfig {
  /** Interval for active/real-time data (milliseconds) */
  active: number
  /** Interval for summary/aggregated data (milliseconds) */
  summary: number
  /** Interval when tab is not active/visible (milliseconds) */
  background: number
  /** Interval when user is actively interacting (milliseconds) */
  interactive: number
}

export interface RefreshOptions {
  /** Refresh interval in milliseconds */
  interval?: number
  /** Pause refresh when user is actively interacting */
  pauseOnInteraction?: boolean
  /** Enable/disable refresh */
  enabled?: boolean
  /** Unique key for this refresh instance */
  key?: string
  /** Retry on error */
  retryOnError?: boolean
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Exponential backoff multiplier for retries */
  backoffMultiplier?: number
  /** Maximum interval for exponential backoff */
  maxBackoffInterval?: number
  /** Refresh type for default interval selection */
  type?: "active" | "summary" | "background" | "interactive"
}

export interface RefreshState {
  isRefreshing: boolean
  lastRefresh: Date | null
  nextRefresh: Date | null
  error: Error | null
  retryCount: number
  isEnabled: boolean
  isPaused: boolean
}

/**
 * Default refresh configuration
 * Based on issue requirements: 30s for active data, 5min for summaries
 */
export const DEFAULT_REFRESH_CONFIG: RefreshConfig = {
  active: 30 * 1000, // 30 seconds for real-time data
  summary: 5 * 60 * 1000, // 5 minutes for summary data
  background: 10 * 60 * 1000, // 10 minutes when tab not active
  interactive: 60 * 1000, // 1 minute when user is actively interacting
}

/**
 * Default refresh options
 */
export const DEFAULT_REFRESH_OPTIONS: Required<RefreshOptions> = {
  interval: DEFAULT_REFRESH_CONFIG.active,
  pauseOnInteraction: true,
  enabled: true,
  key: "default",
  retryOnError: true,
  maxRetries: 3,
  backoffMultiplier: 2,
  maxBackoffInterval: 5 * 60 * 1000, // 5 minutes max backoff
  type: "active",
}

/**
 * Get refresh interval based on type and current state
 */
export function getRefreshInterval(
  type: RefreshOptions["type"] = "active",
  config: RefreshConfig = DEFAULT_REFRESH_CONFIG,
  isUserActive: boolean = true,
  isPageVisible: boolean = true
): number {
  // If page is not visible, use background interval
  if (!isPageVisible) {
    return config.background
  }

  // If user is actively interacting and pauseOnInteraction is enabled
  if (isUserActive && type !== "background") {
    return config.interactive
  }

  // Return interval based on type
  switch (type) {
    case "active":
      return config.active
    case "summary":
      return config.summary
    case "background":
      return config.background
    case "interactive":
      return config.interactive
    default:
      return config.active
  }
}

/**
 * Calculate next refresh time
 */
export function getNextRefreshTime(
  interval: number,
  lastRefresh: Date | null = null
): Date {
  const baseTime = lastRefresh || new Date()
  return new Date(baseTime.getTime() + interval)
}

/**
 * Calculate retry interval with exponential backoff
 */
export function getRetryInterval(
  baseInterval: number,
  retryCount: number,
  backoffMultiplier: number = 2,
  maxInterval: number = 5 * 60 * 1000
): number {
  const backoffInterval = baseInterval * Math.pow(backoffMultiplier, retryCount)
  return Math.min(backoffInterval, maxInterval)
}

/**
 * Check if refresh should be paused based on user interaction
 */
export function shouldPauseRefresh(
  pauseOnInteraction: boolean,
  isUserActive: boolean,
  timeSinceLastActivity: number,
  gracePeriod: number = 2000 // 2 seconds grace period
): boolean {
  if (!pauseOnInteraction) return false

  // Only pause if user is actively interacting and it's been less than grace period
  return isUserActive && timeSinceLastActivity < gracePeriod
}

/**
 * Validate refresh options and apply defaults
 */
export function normalizeRefreshOptions(
  options: RefreshOptions = {}
): Required<RefreshOptions> {
  const normalized = { ...DEFAULT_REFRESH_OPTIONS, ...options }

  // Apply interval based on type if not explicitly set
  if (!options.interval && options.type) {
    normalized.interval = getRefreshInterval(options.type)
  }

  // Validate intervals
  if (normalized.interval < 1000) {
    console.warn("Refresh interval less than 1 second, setting to 1 second")
    normalized.interval = 1000
  }

  if (normalized.maxRetries < 0) {
    normalized.maxRetries = 0
  }

  if (normalized.backoffMultiplier < 1) {
    normalized.backoffMultiplier = 1
  }

  return normalized
}

/**
 * Create a refresh state object
 */
export function createRefreshState(enabled: boolean = true): RefreshState {
  return {
    isRefreshing: false,
    lastRefresh: null,
    nextRefresh: null,
    error: null,
    retryCount: 0,
    isEnabled: enabled,
    isPaused: false,
  }
}

/**
 * Storage key helpers for persisting user refresh preferences
 */
export const REFRESH_STORAGE_KEYS = {
  CONFIG: "dof-refresh-config",
  USER_PREFERENCES: "dof-refresh-preferences",
} as const

/**
 * Load refresh config from localStorage
 */
export function loadRefreshConfig(): RefreshConfig {
  if (typeof window === "undefined") return DEFAULT_REFRESH_CONFIG

  try {
    const stored = localStorage.getItem(REFRESH_STORAGE_KEYS.CONFIG)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_REFRESH_CONFIG, ...parsed }
    }
  } catch (error) {
    console.warn("Failed to load refresh config from localStorage:", error)
  }

  return DEFAULT_REFRESH_CONFIG
}

/**
 * Save refresh config to localStorage
 */
export function saveRefreshConfig(config: Partial<RefreshConfig>): void {
  if (typeof window === "undefined") return

  try {
    const current = loadRefreshConfig()
    const updated = { ...current, ...config }
    localStorage.setItem(REFRESH_STORAGE_KEYS.CONFIG, JSON.stringify(updated))
  } catch (error) {
    console.warn("Failed to save refresh config to localStorage:", error)
  }
}
