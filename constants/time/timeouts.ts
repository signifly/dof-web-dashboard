/**
 * Timeouts - API request and system timeouts
 *
 * These constants define timeout values for API requests, user interactions,
 * and various system operations throughout the application.
 */

// API request timeouts
export const API_TIMEOUTS = {
  DEFAULT_REQUEST: 5000, // 5 seconds for standard API requests
  LONG_REQUEST: 10000, // 10 seconds for complex queries
  SHORT_REQUEST: 3000, // 3 seconds for simple requests
  FILE_UPLOAD: 30000, // 30 seconds for file uploads
  BATCH_OPERATION: 15000, // 15 seconds for batch operations
} as const

// User interaction timeouts
export const USER_INTERACTION_TIMEOUTS = {
  DEBOUNCE_SEARCH: 300, // 300ms debounce for search inputs
  DEBOUNCE_FILTER: 500, // 500ms debounce for filters
  IDLE_DETECTION: 30000, // 30 seconds for idle user detection
  SESSION_WARNING: 300000, // 5 minutes before session expiry warning
  AUTO_LOGOUT: 1800000, // 30 minutes for auto-logout
} as const

// System operation timeouts
export const SYSTEM_TIMEOUTS = {
  RETRY_BACKOFF_BASE: 1000, // 1 second base for exponential backoff
  MAX_RETRY_INTERVAL: 300000, // 5 minutes maximum retry interval
  HEALTH_CHECK: 5000, // 5 seconds for health checks
  CACHE_INVALIDATION: 60000, // 1 minute for cache invalidation
  CLEANUP_INTERVAL: 300000, // 5 minutes for cleanup operations
} as const

// Data fetch timeouts
export const DATA_FETCH_TIMEOUTS = {
  METRICS_FETCH: 8000, // 8 seconds for metrics data
  DEVICE_DATA_FETCH: 6000, // 6 seconds for device data
  ANALYTICS_FETCH: 12000, // 12 seconds for analytics queries
  REAL_TIME_FETCH: 3000, // 3 seconds for real-time data
} as const

export type ApiTimeouts = typeof API_TIMEOUTS
export type UserInteractionTimeouts = typeof USER_INTERACTION_TIMEOUTS
export type SystemTimeouts = typeof SYSTEM_TIMEOUTS
export type DataFetchTimeouts = typeof DATA_FETCH_TIMEOUTS
