/**
 * Status Types - String literal enums and type definitions
 *
 * These enums define all string literal types used throughout the application
 * for consistent status management and type safety.
 */

// Completion status for sessions and operations
export enum CompletionStatus {
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  IN_PROGRESS = "in_progress",
}

// Performance event types
export enum PerformanceEventType {
  FPS_DROP = "fps_drop",
  MEMORY_SPIKE = "memory_spike",
  SLOW_LOAD = "slow_load",
  CPU_HIGH = "cpu_high",
  NETWORK_SLOW = "network_slow",
  CRASH = "crash",
  ANR = "anr", // Application Not Responding
}

// Alert severity levels
export enum AlertSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Device performance categories
export enum PerformanceCategory {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
}

// User journey status
export enum JourneyStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  TIMEOUT = "timeout",
}

// Data refresh types
export enum RefreshType {
  ACTIVE = "active",
  SUMMARY = "summary",
  BACKGROUND = "background",
  INTERACTIVE = "interactive",
}

// Recommendation priority levels
export enum RecommendationPriority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

// Analysis confidence levels
export enum ConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Time period types
export enum TimePeriod {
  REAL_TIME = "real_time",
  LAST_HOUR = "last_hour",
  LAST_DAY = "last_day",
  LAST_WEEK = "last_week",
  LAST_MONTH = "last_month",
}

export type CompletionStatusType = `${CompletionStatus}`
export type PerformanceEventTypeType = `${PerformanceEventType}`
export type AlertSeverityType = `${AlertSeverity}`
export type PerformanceCategoryType = `${PerformanceCategory}`
export type JourneyStatusType = `${JourneyStatus}`
export type RefreshTypeType = `${RefreshType}`
export type RecommendationPriorityType = `${RecommendationPriority}`
export type ConfidenceLevelType = `${ConfidenceLevel}`
export type TimePeriodType = `${TimePeriod}`