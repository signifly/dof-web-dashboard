import { createClient } from "@/lib/supabase/server"
import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"
import {
  DeviceProfile,
  DeviceSession,
  DeviceMetricPoint,
  DeviceHealthInput,
  DeviceAnalytics,
  HEALTH_SCORE_WEIGHTS,
  PERFORMANCE_THRESHOLDS,
} from "@/types/device"

/**
 * Get comprehensive device details including health score and trends
 */
export async function getDeviceDetails(
  deviceId: string
): Promise<DeviceProfile | null> {
  const supabase = createClient()

  try {
    // Get all sessions for this device
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("anonymous_user_id", deviceId)
      .order("created_at", { ascending: false })

    if (sessionsError || !sessions?.length) {
      return null
    }

    // Get all metrics for this device
    const sessionIds = sessions.map(s => s.id)
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: true })

    if (metricsError) {
      console.warn(`Device metrics error: ${metricsError.message}`)
    }

    // Calculate device profile data
    const deviceMetrics = metrics || []
    const totalSessions = sessions.length
    const firstSession = sessions[sessions.length - 1]
    const lastSession = sessions[0]

    // Calculate averages
    const fpsMetrics = deviceMetrics.filter(m => m.metric_type === "fps")
    const memoryMetrics = deviceMetrics.filter(
      m => m.metric_type === "memory_usage"
    )
    const loadTimeMetrics = deviceMetrics.filter(
      m =>
        m.metric_type === "navigation_time" || m.metric_type === "screen_load"
    )

    const avgFps =
      fpsMetrics.length > 0
        ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          fpsMetrics.length
        : 0
    const avgMemory =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          memoryMetrics.length
        : 0
    const avgLoadTime =
      loadTimeMetrics.length > 0
        ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          loadTimeMetrics.length
        : 0

    // Calculate risk level
    let riskLevel: "low" | "medium" | "high" = "low"
    if (avgFps < 20 || avgMemory > 800 || totalSessions < 2) {
      riskLevel = "high"
    } else if (avgFps < 45 || avgMemory > 400 || totalSessions < 5) {
      riskLevel = "medium"
    }

    // Calculate health score
    const healthScore = calculateHealthScore({
      recentSessions: sessions.slice(0, 10), // Last 10 sessions
      recentMetrics: deviceMetrics,
      totalSessions,
      daysSinceFirstSeen: Math.floor(
        (new Date().getTime() - new Date(firstSession.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    })

    // Calculate performance trend (simplified - comparing first half vs second half of sessions)
    const performanceTrend = calculatePerformanceTrend(sessions, deviceMetrics)

    // Get session history with health snapshots
    const sessionHistory = await getDeviceSessionsWithHealth(
      deviceId,
      sessions.slice(0, 20)
    )

    // Get metrics over time for trends
    const metricsOverTime = transformMetricsToTimePoints(deviceMetrics)

    // Calculate additional metrics
    const firstSeen = firstSession.created_at
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const sessionsToday = sessions.filter(
      s => new Date(s.created_at).toDateString() === today.toDateString()
    ).length

    const sessionsThisWeek = sessions.filter(
      s => new Date(s.created_at) >= weekAgo
    ).length

    // Calculate active days
    const sessionDays = new Set(
      sessions.map(s => new Date(s.created_at).toDateString())
    )
    const activeDays = sessionDays.size

    const device: DeviceProfile = {
      deviceId,
      platform: lastSession.device_type,
      appVersion: lastSession.app_version,
      osVersion: lastSession.os_version,
      sessions,
      totalSessions,
      avgFps: Math.round(avgFps * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgCpu: 0, // Not available in current schema
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      lastSeen: lastSession.created_at,
      firstSeen,
      riskLevel,
      healthScore,
      performanceTrend,
      sessionHistory,
      metricsOverTime,
      activeDays,
      sessionsToday,
      sessionsThisWeek,
    }

    return device
  } catch (error) {
    console.error("Error fetching device details:", error)
    return null
  }
}

/**
 * Get device sessions with health snapshots
 */
export async function getDeviceSessions(
  deviceId: string,
  limit = 20
): Promise<DeviceSession[]> {
  const supabase = createClient()

  try {
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("anonymous_user_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (sessionsError || !sessions) {
      return []
    }

    return await getDeviceSessionsWithHealth(deviceId, sessions)
  } catch (error) {
    console.error("Error fetching device sessions:", error)
    return []
  }
}

/**
 * Get device-specific performance metrics over time
 */
export async function getDeviceMetrics(
  deviceId: string,
  days = 30
): Promise<DeviceMetricPoint[]> {
  const supabase = createClient()

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // First get sessions in date range
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("id")
      .eq("anonymous_user_id", deviceId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (sessionsError || !sessions?.length) {
      return []
    }

    const sessionIds = sessions.map(s => s.id)

    // Get metrics for these sessions
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: true })

    if (metricsError || !metrics) {
      return []
    }

    return transformMetricsToTimePoints(metrics)
  } catch (error) {
    console.error("Error fetching device metrics:", error)
    return []
  }
}

/**
 * Calculate device health score based on performance metrics
 */
function calculateHealthScore(input: DeviceHealthInput): number {
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
function calculateMetricScore(
  value: number,
  thresholds: { excellent: number; good: number; fair: number; poor: number },
  lowerIsBetter: boolean
): number {
  if (value === 0) return 0

  if (lowerIsBetter) {
    if (value <= thresholds.excellent) return 100
    if (value <= thresholds.good) return 80
    if (value <= thresholds.fair) return 60
    if (value <= thresholds.poor) return 40
    return 20
  } else {
    if (value >= thresholds.excellent) return 100
    if (value >= thresholds.good) return 80
    if (value >= thresholds.fair) return 60
    if (value >= thresholds.poor) return 40
    return 20
  }
}

/**
 * Calculate performance trend by comparing recent vs older sessions
 */
function calculatePerformanceTrend(
  sessions: PerformanceSession[],
  metrics: PerformanceMetric[]
): "improving" | "stable" | "declining" {
  if (sessions.length < 4) return "stable"

  const midpoint = Math.floor(sessions.length / 2)
  const recentSessions = sessions.slice(0, midpoint)
  const olderSessions = sessions.slice(midpoint)

  const recentSessionIds = new Set(recentSessions.map(s => s.id))
  const olderSessionIds = new Set(olderSessions.map(s => s.id))

  const recentMetrics = metrics.filter(
    m => m.session_id && recentSessionIds.has(m.session_id)
  )
  const olderMetrics = metrics.filter(
    m => m.session_id && olderSessionIds.has(m.session_id)
  )

  // Calculate average performance scores for both periods
  const recentScore = calculatePeriodScore(recentMetrics)
  const olderScore = calculatePeriodScore(olderMetrics)

  const diff = recentScore - olderScore

  if (diff > 5) return "improving"
  if (diff < -5) return "declining"
  return "stable"
}

/**
 * Calculate average performance score for a period
 */
function calculatePeriodScore(metrics: PerformanceMetric[]): number {
  if (!metrics.length) return 0

  const fpsMetrics = metrics.filter(m => m.metric_type === "fps")
  const memoryMetrics = metrics.filter(m => m.metric_type === "memory_usage")

  const avgFps =
    fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        fpsMetrics.length
      : 0
  const avgMemory =
    memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        memoryMetrics.length
      : 0

  const fpsScore = calculateMetricScore(
    avgFps,
    PERFORMANCE_THRESHOLDS.fps,
    false
  )
  const memoryScore = calculateMetricScore(
    avgMemory,
    PERFORMANCE_THRESHOLDS.memory,
    true
  )

  return (fpsScore + memoryScore) / 2
}

/**
 * Transform metrics array to time-series data points
 */
function transformMetricsToTimePoints(
  metrics: PerformanceMetric[]
): DeviceMetricPoint[] {
  const timePoints = new Map<string, DeviceMetricPoint>()

  metrics.forEach(metric => {
    const timestamp = metric.timestamp
    const sessionId = metric.session_id || ""

    if (!timePoints.has(timestamp)) {
      timePoints.set(timestamp, {
        timestamp,
        fps: 0,
        memory: 0,
        loadTime: 0,
        screenName: (metric.context as any)?.screen_name || "Unknown",
        sessionId,
      })
    }

    const point = timePoints.get(timestamp)!

    switch (metric.metric_type) {
      case "fps":
        point.fps = metric.metric_value
        break
      case "memory_usage":
      case "memory":
        point.memory = metric.metric_value
        break
      case "navigation_time":
      case "screen_load":
      case "load_time":
        point.loadTime = metric.metric_value
        break
    }
  })

  return Array.from(timePoints.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

/**
 * Helper function to get sessions with health snapshots
 */
async function getDeviceSessionsWithHealth(
  deviceId: string,
  sessions: PerformanceSession[]
): Promise<DeviceSession[]> {
  const supabase = createClient()

  const deviceSessions: DeviceSession[] = []

  for (const session of sessions) {
    // Get metrics for this session
    const { data: metrics, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("session_id", session.id)
      .order("timestamp", { ascending: true })

    if (error) {
      console.warn(`Session metrics error: ${error.message}`)
      continue
    }

    const sessionMetrics = metrics || []

    // Calculate health snapshot for this session
    const fpsMetrics = sessionMetrics.filter(m => m.metric_type === "fps")
    const memoryMetrics = sessionMetrics.filter(
      m => m.metric_type === "memory_usage"
    )
    const loadTimeMetrics = sessionMetrics.filter(
      m =>
        m.metric_type === "navigation_time" || m.metric_type === "screen_load"
    )

    const fps =
      fpsMetrics.length > 0
        ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          fpsMetrics.length
        : 0
    const memory =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          memoryMetrics.length
        : 0
    const loadTime =
      loadTimeMetrics.length > 0
        ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          loadTimeMetrics.length
        : 0

    // Calculate session health score
    const fpsScore = calculateMetricScore(
      fps,
      PERFORMANCE_THRESHOLDS.fps,
      false
    )
    const memoryScore = calculateMetricScore(
      memory,
      PERFORMANCE_THRESHOLDS.memory,
      true
    )
    const loadTimeScore = calculateMetricScore(
      loadTime,
      PERFORMANCE_THRESHOLDS.loadTime,
      true
    )
    const score = (fpsScore + memoryScore + loadTimeScore) / 3

    // Calculate session duration (if session_end exists)
    const duration = session.session_end
      ? Math.round(
          (new Date(session.session_end).getTime() -
            new Date(session.session_start).getTime()) /
            (1000 * 60)
        )
      : undefined

    // Count screen transitions (rough estimate from context changes)
    const screenTransitions = sessionMetrics.filter(
      (m, i, arr) =>
        i > 0 &&
        (m.context as any)?.screen_name !==
          (arr[i - 1].context as any)?.screen_name
    ).length

    deviceSessions.push({
      session,
      sessionMetrics,
      healthSnapshot: {
        fps: Math.round(fps * 100) / 100,
        memory: Math.round(memory * 100) / 100,
        loadTime: Math.round(loadTime * 100) / 100,
        score: Math.round(score),
      },
      duration,
      screenTransitions,
      crashCount: 0, // Not available in current schema
    })
  }

  return deviceSessions
}
