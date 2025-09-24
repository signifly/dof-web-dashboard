/**
 * Durations - Animation and timing durations
 *
 * These constants define duration values for animations, transitions,
 * and time-based calculations throughout the application.
 */

// Animation durations
export const ANIMATION_DURATIONS = {
  CHART_ANIMATION: 750, // 750ms for chart animations
  FAST_TRANSITION: 150, // 150ms for fast UI transitions
  MEDIUM_TRANSITION: 300, // 300ms for medium UI transitions
  SLOW_TRANSITION: 500, // 500ms for slow UI transitions
  PAGE_TRANSITION: 200, // 200ms for page transitions
} as const

// Session and journey durations
export const SESSION_DURATIONS = {
  SHORT_SESSION: 30000, // 30 seconds - short session threshold
  MEDIUM_SESSION: 300000, // 5 minutes - medium session threshold
  LONG_SESSION: 1800000, // 30 minutes - long session threshold
  EXTENDED_SESSION: 3600000, // 1 hour - extended session threshold
} as const

// Time calculation durations
export const TIME_CALCULATIONS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30, // Approximate
} as const

// Performance measurement durations
export const PERFORMANCE_DURATIONS = {
  METRIC_COLLECTION_WINDOW: 60000, // 1 minute collection window
  ROLLING_AVERAGE_WINDOW: 300000, // 5 minutes rolling average
  TREND_ANALYSIS_WINDOW: 3600000, // 1 hour trend analysis
  DAILY_SUMMARY_WINDOW: 86400000, // 24 hours daily summary
} as const

// Cache and storage durations
export const CACHE_DURATIONS = {
  SHORT_CACHE: 300000, // 5 minutes short-term cache
  MEDIUM_CACHE: 1800000, // 30 minutes medium-term cache
  LONG_CACHE: 3600000, // 1 hour long-term cache
  PERSISTENT_CACHE: 86400000, // 24 hours persistent cache
} as const

export type AnimationDurations = typeof ANIMATION_DURATIONS
export type SessionDurations = typeof SESSION_DURATIONS
export type TimeCalculations = typeof TIME_CALCULATIONS
export type PerformanceDurations = typeof PERFORMANCE_DURATIONS
export type CacheDurations = typeof CACHE_DURATIONS
