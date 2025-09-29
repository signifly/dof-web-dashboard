"use server"

import { createClient } from "@/lib/supabase/server"
import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"
import {
  DeviceProfile,
  DeviceSession,
  DeviceMetricPoint,
  PERFORMANCE_THRESHOLDS,
} from "@/types/device"
import {
  calculateHealthScore,
  calculateMetricScore,
} from "@/lib/utils/device-utils"
import {
  getNormalizedRoutePattern,
  getEnhancedRouteInfo,
} from "@/lib/utils/screen-time-parser"

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

  // First, create a map of screen_time data by timestamp for reference
  const screenTimeMap = new Map<string, any>()

  metrics
    .filter(m => m.metric_type === "screen_time")
    .forEach(metric => {
      const routeInfo = getEnhancedRouteInfo(metric.context)
      screenTimeMap.set(metric.timestamp, routeInfo)
    })

  // Sort screen time entries by timestamp to enable temporal lookup
  const screenTimeEntries = Array.from(screenTimeMap.entries()).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  )

  // Function to find the most recent screen_time data for a given timestamp
  const findScreenTimeForTimestamp = (timestamp: string) => {
    const targetTime = new Date(timestamp).getTime()

    // Find the most recent screen_time entry before or at this timestamp
    for (let i = screenTimeEntries.length - 1; i >= 0; i--) {
      const [screenTimestamp, routeInfo] = screenTimeEntries[i]
      const screenTime = new Date(screenTimestamp).getTime()

      // If this screen_time is before or at our target time, use it
      // Allow for a reasonable time window (10 seconds)
      if (screenTime <= targetTime && targetTime - screenTime <= 10000) {
        return routeInfo
      }
    }

    // If no recent screen_time found, try the first one after (within 10 seconds)
    for (const [screenTimestamp, routeInfo] of screenTimeEntries) {
      const screenTime = new Date(screenTimestamp).getTime()
      if (screenTime > targetTime && screenTime - targetTime <= 10000) {
        return routeInfo
      }
    }

    return null
  }

  metrics.forEach(metric => {
    const timestamp = metric.timestamp
    const sessionId = metric.session_id || ""

    if (!timePoints.has(timestamp)) {
      // Try to get route info from screen_time data first
      let routeInfo = findScreenTimeForTimestamp(timestamp)

      // If no screen_time data found, try extracting from the metric itself
      if (!routeInfo || routeInfo.screenName === "Unknown") {
        routeInfo = getEnhancedRouteInfo(metric.context)
      }

      timePoints.set(timestamp, {
        timestamp,
        fps: 0,
        memory: 0,
        loadTime: 0,
        screenName: routeInfo.screenName,
        sessionId,
        routePath: routeInfo.routePath,
        routePattern: routeInfo.routePattern,
        segments: routeInfo.segments,
        isDynamic: routeInfo.isDynamic,
        displayName: routeInfo.displayName,
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
      case "screen_time":
        // Don't include screen_time metrics in the final data points
        // as they're used for context only
        break
    }
  })

  return Array.from(timePoints.values())
    .filter(point => point.fps > 0 || point.memory > 0 || point.loadTime > 0) // Only include points with actual metric data
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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

    // Count screen transitions using enhanced route information
    const screenTransitions = sessionMetrics.filter((m, i, arr) => {
      if (i === 0) return false

      const currentRoute = getNormalizedRoutePattern(m.context)
      const previousRoute = getNormalizedRoutePattern(arr[i - 1].context)

      return currentRoute !== previousRoute
    }).length

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
