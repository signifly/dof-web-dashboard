/**
 * Data Limits - Query limits, pagination, and data constraints
 *
 * These constants define limits for data operations throughout the application.
 */

// Query result limits
export const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 50, // Default number of items per page
  MAX_PAGE_SIZE: 1000, // Maximum items per page
  SEARCH_RESULTS_LIMIT: 100, // Maximum search results
  RECENT_ITEMS_LIMIT: 20, // Number of recent items to show
  EXPORT_BATCH_SIZE: 500, // Batch size for data exports
} as const

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1, // Default starting page
  MAX_PAGES_SHOWN: 10, // Maximum pagination buttons shown
  ITEMS_PER_PAGE_OPTIONS: [25, 50, 100, 250] as const,
} as const

// Cache and storage limits
export const STORAGE_LIMITS = {
  MAX_CACHE_SIZE_MB: 100, // Maximum cache size in MB
  MAX_LOCAL_STORAGE_ITEMS: 1000, // Maximum items in local storage
  MAX_SESSION_STORAGE_ITEMS: 500, // Maximum items in session storage
  MAX_FILE_UPLOAD_SIZE_MB: 10, // Maximum file upload size
} as const

// Data processing limits
export const PROCESSING_LIMITS = {
  MAX_CONCURRENT_REQUESTS: 5, // Maximum concurrent API requests
  BATCH_PROCESSING_SIZE: 100, // Items processed in each batch
  MAX_AGGREGATION_POINTS: 1000, // Maximum data points for aggregation
  REAL_TIME_UPDATE_LIMIT: 50, // Maximum real-time updates per minute
} as const

export type QueryLimits = typeof QUERY_LIMITS
export type Pagination = typeof PAGINATION
export type StorageLimits = typeof STORAGE_LIMITS
export type ProcessingLimits = typeof PROCESSING_LIMITS
