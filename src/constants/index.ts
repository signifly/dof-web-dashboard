/**
 * Application Constants
 * Centralized configuration and constants
 */

// ============================================================================
// TIMING CONSTANTS
// ============================================================================
export const TIMING = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  SIX_HOURS_MS: 6 * 60 * 60 * 1000,
  DEFAULT_TIMEOUT: 5000,
  ANIMATION_DELAY: 1000,
} as const

// ============================================================================
// UI DIMENSIONS
// ============================================================================
export const UI_DIMENSIONS = {
  HEIGHTS: {
    EMPTY_STATE: "h-64",
    ICON_XS: "h-3",
    ICON_SM: "h-4",
    ICON_MD: "h-6",
    ICON_LG: "h-8",
    ICON_XL: "h-12",
    BUTTON_SM: "h-8",
  },
  WIDTHS: {
    ICON_XS: "w-3",
    ICON_SM: "w-4",
    ICON_MD: "w-6",
    ICON_LG: "w-8",
    ICON_XL: "w-12",
    BUTTON_SM: "w-8",
    TABLE_ACTIONS: "w-10",
  },
  BORDERS: {
    LEFT_ACCENT: "border-l-4",
  },
  SPACING: {
    CARD_HEADER: "pb-2",
    ICON_TEXT: "mr-1",
    ACTIONS: "space-x-2",
    ITEMS_CENTER: "space-x-4",
  },
} as const

// ============================================================================
// UI TEXT CONSTANTS
// ============================================================================
export const UI_TEXT = {
  ACTIONS: {
    ACTIONS: "Actions",
    VIEW_DETAILS: "View Details",
    EDIT: "Edit",
    DELETE: "Delete",
    TOGGLE: "Toggle",
  },
} as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
  GENERIC_ERROR: "Something went wrong",
  NETWORK_ERROR: "Network connection failed",
  AUTH_ERROR: "Authentication failed",
  METRICS: {
    FETCH_FAILED: "Failed to fetch performance metrics",
    RECORD_FAILED: "Failed to record metric",
    INVALID_TYPE: "Invalid metric type",
  },
} as const

// ============================================================================
// API CONFIGURATION
// ============================================================================
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 10000,
} as const

// ============================================================================
// METRIC TYPE CONSTANTS
// ============================================================================
export const METRIC_TYPES = {
  CPU_USAGE: "cpu_usage",
  MEMORY_USAGE: "memory_usage",
  PAGE_LOAD_TIME: "page_load_time",
  RESPONSE_TIME: "response_time",
  BUNDLE_SIZE: "bundle_size",
} as const

// ============================================================================
// TYPE EXPORTS FOR INFERENCE
// ============================================================================
export type TimingConstants = typeof TIMING
export type UIDimensions = typeof UI_DIMENSIONS
export type UIText = typeof UI_TEXT
export type ErrorMessages = typeof ERROR_MESSAGES
export type ApiConfig = typeof API_CONFIG
export type MetricTypes = typeof METRIC_TYPES
