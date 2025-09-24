/**
 * Business Analytics - Analytics thresholds and configurations
 *
 * These constants define business logic parameters for analytics
 * calculations, scoring algorithms, and performance analysis.
 */

// Analytics calculation thresholds
export const ANALYTICS_THRESHOLDS = {
  MIN_SESSIONS_FOR_ANALYSIS: 10, // Minimum sessions needed for reliable analysis
  MIN_DATA_POINTS: 5, // Minimum data points for trend analysis
  CORRELATION_THRESHOLD: 0.7, // Correlation coefficient threshold
  STATISTICAL_SIGNIFICANCE: 0.05, // P-value threshold for significance
} as const

// Scoring algorithm parameters
export const SCORING_PARAMETERS = {
  WEIGHT_RECENT_DATA: 0.7, // Weight for recent data vs historical
  OUTLIER_DETECTION_THRESHOLD: 2.0, // Standard deviations for outlier detection
  SMOOTHING_FACTOR: 0.3, // Exponential smoothing factor
  TREND_WINDOW_SIZE: 7, // Number of data points for trend calculation
} as const

// Business rule thresholds
export const BUSINESS_RULES = {
  HIGH_USAGE_THRESHOLD: 1000, // Sessions per day threshold
  LOW_PERFORMANCE_ALERT: 30, // Performance score threshold
  CRITICAL_MEMORY_USAGE: 800, // MB threshold for critical memory usage
  SESSION_TIMEOUT_THRESHOLD: 1800, // Seconds for session timeout
} as const

export type AnalyticsThresholds = typeof ANALYTICS_THRESHOLDS
export type ScoringParameters = typeof SCORING_PARAMETERS
export type BusinessRules = typeof BUSINESS_RULES
