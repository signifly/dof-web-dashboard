/**
 * Performance Thresholds - Core performance benchmarks and limits
 *
 * These constants define the performance thresholds used throughout the application
 * for categorizing device performance, triggering alerts, and calculating health scores.
 */

// Core performance thresholds for device health calculation
export const PERFORMANCE_THRESHOLDS = {
  fps: {
    excellent: 55,
    good: 45,
    fair: 30,
    poor: 20,
  },
  memory: {
    excellent: 200, // MB - lower is better
    good: 400,
    fair: 600,
    poor: 800,
  },
  loadTime: {
    excellent: 500, // ms - lower is better
    good: 1000,
    fair: 2000,
    poor: 3000,
  },
} as const

// Early warning system thresholds
export const EARLY_WARNING_THRESHOLDS = {
  FPS_DEGRADATION_THRESHOLD: 45, // Alert if FPS predicted to drop below 45
  MEMORY_SPIKE_THRESHOLD: 500, // Alert if memory predicted to exceed 500MB
  CPU_SPIKE_THRESHOLD: 80, // Alert if CPU predicted to exceed 80%
  CONFIDENCE_THRESHOLD: 0.6, // Only alert if confidence > 60%
  TIME_HORIZON_DAYS: 2, // Look ahead 2 days for early warning
} as const

// Performance scoring thresholds
export const PERFORMANCE_SCORING = {
  CRITICAL_THRESHOLD: 30, // Below 30 = critical
  HIGH_ALERT_THRESHOLD: 45, // Below 45 = high alert
  PERFORMANCE_DROP_THRESHOLD: 0.8, // 20% drop triggers alert
} as const

// CPU and system thresholds
export const SYSTEM_THRESHOLDS = {
  CPU_HIGH_THRESHOLD: 80, // 80% CPU usage threshold
  MEMORY_SPIKE_DETECTION: 500, // MB for memory spike detection
  PERFORMANCE_PREDICTION_HORIZON: 48, // Hours for prediction horizon
} as const

export type PerformanceThresholds = typeof PERFORMANCE_THRESHOLDS
export type EarlyWarningThresholds = typeof EARLY_WARNING_THRESHOLDS
export type PerformanceScoring = typeof PERFORMANCE_SCORING
export type SystemThresholds = typeof SYSTEM_THRESHOLDS
