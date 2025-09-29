import {
  DeviceHealthInput,
  HEALTH_SCORE_WEIGHTS,
  PERFORMANCE_THRESHOLDS,
} from "@/types/device"

/**
 * Calculate device health score based on performance metrics
 */
export function calculateHealthScore(input: DeviceHealthInput): number {
  const { recentMetrics, totalSessions, daysSinceFirstSeen } = input

  if (!recentMetrics.length) return 0

  // Calculate component scores
  const fpsMetrics = recentMetrics.filter(m => m.metric_type === "fps")
  const memoryMetrics = recentMetrics.filter(
    m => m.metric_type === "memory_usage"
  )
  const loadTimeMetrics = recentMetrics.filter(
    m => m.metric_type === "navigation_time" || m.metric_type === "screen_load"
  )

  // FPS Score (0-100)
  const avgFps =
    fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        fpsMetrics.length
      : 0
  const fpsScore = calculateMetricScore(
    avgFps,
    PERFORMANCE_THRESHOLDS.fps,
    false
  )

  // Memory Score (0-100) - lower is better
  const avgMemory =
    memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        memoryMetrics.length
      : 0
  const memoryScore = calculateMetricScore(
    avgMemory,
    PERFORMANCE_THRESHOLDS.memory,
    true
  )

  // Load Time Score (0-100) - lower is better
  const avgLoadTime =
    loadTimeMetrics.length > 0
      ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        loadTimeMetrics.length
      : 0
  const loadTimeScore = calculateMetricScore(
    avgLoadTime,
    PERFORMANCE_THRESHOLDS.loadTime,
    true
  )

  // Stability Score (sessions frequency and consistency)
  const stabilityScore = Math.min(
    100,
    (totalSessions / Math.max(daysSinceFirstSeen, 1)) * 10
  )

  // Weighted final score
  const healthScore =
    fpsScore * HEALTH_SCORE_WEIGHTS.fps +
    memoryScore * HEALTH_SCORE_WEIGHTS.memory +
    loadTimeScore * HEALTH_SCORE_WEIGHTS.loadTime +
    stabilityScore * HEALTH_SCORE_WEIGHTS.stability

  return Math.round(Math.max(0, Math.min(100, healthScore)))
}

/**
 * Calculate score for a specific metric based on thresholds
 */
export function calculateMetricScore(
  value: number,
  thresholds: { excellent: number; good: number; fair: number; poor: number },
  lowerIsBetter: boolean
): number {
  if (value === 0) return 0

  const { excellent, good, fair, poor } = thresholds

  if (lowerIsBetter) {
    // For metrics where lower values are better (like memory usage, load time)
    if (value <= excellent) return 100
    if (value <= good) return 80
    if (value <= fair) return 60
    if (value <= poor) return 40
    return 20
  } else {
    // For metrics where higher values are better (like FPS)
    if (value >= excellent) return 100
    if (value >= good) return 80
    if (value >= fair) return 60
    if (value >= poor) return 40
    return 20
  }
}
