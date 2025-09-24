/**
 * Performance Scoring - Health score calculation weights and metrics
 *
 * These constants define how device health scores are calculated,
 * including the weights for different performance metrics.
 */

// Health score calculation weights
export const HEALTH_SCORE_WEIGHTS = {
  fps: 0.4, // 40% - Frame rate performance
  memory: 0.25, // 25% - Memory efficiency
  loadTime: 0.25, // 25% - Load time performance
  stability: 0.1, // 10% - Crash rate and session stability
} as const

// Performance score boundaries for categorization
export const SCORE_BOUNDARIES = {
  EXCELLENT_MIN: 85, // 85-100 = Excellent
  GOOD_MIN: 70, // 70-84 = Good
  FAIR_MIN: 50, // 50-69 = Fair
  POOR_MIN: 0, // 0-49 = Poor
} as const

// Performance improvement estimations (used in recommendations)
export const IMPROVEMENT_ESTIMATES = {
  MEMORY_REDUCTION_RANGE: "20-40%", // Memory optimization improvement range
  CPU_REDUCTION_RANGE: "15-30%", // CPU optimization improvement range
  LOAD_TIME_IMPROVEMENT_RANGE: "25-50%", // Load time improvement range
} as const

export type HealthScoreWeights = typeof HEALTH_SCORE_WEIGHTS
export type ScoreBoundaries = typeof SCORE_BOUNDARIES
export type ImprovementEstimates = typeof IMPROVEMENT_ESTIMATES
