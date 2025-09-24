/**
 * Performance Alerts - Alert severity levels and configurations
 *
 * These constants define alert severity thresholds, confidence levels,
 * and alert categorization criteria for the performance monitoring system.
 */

// Alert severity thresholds
export const ALERT_SEVERITY_THRESHOLDS = {
  CRITICAL_PERFORMANCE_SCORE: 30, // Performance score below 30 = critical
  HIGH_PERFORMANCE_SCORE: 50, // Performance score below 50 = high
  MEDIUM_PERFORMANCE_SCORE: 60, // Performance score below 60 = medium
  CONFIDENCE_HIGH_THRESHOLD: 0.8, // Confidence above 80% = high priority
  CONFIDENCE_MEDIUM_THRESHOLD: 0.6, // Confidence above 60% = medium priority
} as const

// Alert confidence levels for predictions
export const ALERT_CONFIDENCE_LEVELS = {
  HIGH_CONFIDENCE: 0.8, // 80% confidence threshold
  MEDIUM_CONFIDENCE: 0.6, // 60% confidence threshold
  LOW_CONFIDENCE: 0.4, // 40% confidence threshold
} as const

// Performance degradation detection
export const DEGRADATION_DETECTION = {
  FPS_DROP_THRESHOLD: 0.8, // 20% FPS drop triggers alert
  MEMORY_SPIKE_MULTIPLIER: 1.5, // 50% memory increase triggers alert
  CPU_SPIKE_THRESHOLD: 80, // 80% CPU usage triggers alert
  LOAD_TIME_SPIKE_MULTIPLIER: 2.0, // 100% load time increase triggers alert
} as const

// Time horizons for predictive alerts
export const ALERT_TIME_HORIZONS = {
  SHORT_TERM_HOURS: 24, // 24 hours for short-term predictions
  MEDIUM_TERM_HOURS: 48, // 48 hours for medium-term predictions
  LONG_TERM_HOURS: 168, // 7 days for long-term predictions
} as const

export type AlertSeverityThresholds = typeof ALERT_SEVERITY_THRESHOLDS
export type AlertConfidenceLevels = typeof ALERT_CONFIDENCE_LEVELS
export type DegradationDetection = typeof DEGRADATION_DETECTION
export type AlertTimeHorizons = typeof ALERT_TIME_HORIZONS