import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Tables } from "@/types/database"

export type PerformanceMetric = Tables<"performance_metrics">
export type PerformanceSession = Tables<"performance_sessions">

export interface PerformanceSummary {
  totalSessions: number
  totalMetrics: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  deviceCount: number
  platformBreakdown: { platform: string; count: number }[]
  performanceTiers: { tier: string; count: number }[]
  recentActivity: PerformanceSession[]
  memoryPressure: { level: string; count: number }[]
  fpsDistribution: { range: string; count: number }[]
}

export interface MetricsTrend {
  timestamp: string
  fps: number
  memory_usage: number
  cpu_usage: number
  load_time: number
  screen_name: string
}

export interface SessionPerformance {
  session: PerformanceSession
  metrics: PerformanceMetric[]
  trends: MetricsTrend[]
}

/**
 * Get overall performance summary statistics
 */
export async function getPerformanceSummary(): Promise<PerformanceSummary> {
  const supabase = createClient()

  try {
    // Get session summary data
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.warn(`Sessions table error: ${sessionsError.message}`)
      // Return empty state for dashboard
      return {
        totalSessions: 0,
        totalMetrics: 0,
        avgFps: 0,
        avgMemory: 0,
        avgCpu: 0,
        avgLoadTime: 0,
        deviceCount: 0,
        platformBreakdown: [],
        performanceTiers: [],
        recentActivity: [],
        memoryPressure: [],
        fpsDistribution: [],
      }
    }

    // Get all performance metrics for calculations
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")

    if (metricsError) {
      console.warn(`Metrics table error: ${metricsError.message}`)
    }

    const totalSessions = sessions?.length || 0
    const totalMetrics = metrics?.length || 0

    // Calculate averages from normalized metrics
    const fpsMetrics = metrics?.filter(m => m.metric_type === "fps") || []
    const memoryMetrics =
      metrics?.filter(m => m.metric_type === "memory_usage") || []
    const loadTimeMetrics =
      metrics?.filter(
        m =>
          m.metric_type === "navigation_time" || m.metric_type === "screen_load"
      ) || []

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

    // Device count from unique anonymous_user_id
    const uniqueDevices = new Set(sessions?.map(s => s.anonymous_user_id) || [])

    // Platform breakdown based on device_type
    const platformCounts = new Map<string, number>()
    sessions?.forEach(session => {
      const platform = session.device_type || "Unknown"
      const count = platformCounts.get(platform) || 0
      platformCounts.set(platform, count + 1)
    })

    const platformBreakdown = Array.from(platformCounts.entries()).map(
      ([platform, count]) => ({
        platform,
        count,
      })
    )

    // Performance tier analysis from context data
    const performanceTierCounts = new Map<string, number>()
    const memoryPressureCounts = new Map<string, number>()
    const fpsDistributionCounts = new Map<string, number>()

    metrics?.forEach(metric => {
      // Extract performance tier from context
      if (metric.context && typeof metric.context === "object") {
        const context = metric.context as any

        if (context.performanceTier) {
          const tier = context.performanceTier
          performanceTierCounts.set(
            tier,
            (performanceTierCounts.get(tier) || 0) + 1
          )
        }

        if (context.pressureLevel && metric.metric_type === "memory_usage") {
          const level = context.pressureLevel
          memoryPressureCounts.set(
            level,
            (memoryPressureCounts.get(level) || 0) + 1
          )
        }
      }

      // FPS distribution analysis
      if (metric.metric_type === "fps") {
        const fps = metric.metric_value
        let range = "60+ FPS (Excellent)"
        if (fps < 20) range = "<20 FPS (Poor)"
        else if (fps < 30) range = "20-30 FPS (Fair)"
        else if (fps < 45) range = "30-45 FPS (Good)"
        else if (fps < 60) range = "45-60 FPS (Very Good)"

        fpsDistributionCounts.set(
          range,
          (fpsDistributionCounts.get(range) || 0) + 1
        )
      }
    })

    const performanceTiers = Array.from(performanceTierCounts.entries()).map(
      ([tier, count]) => ({
        tier: tier || "Unknown",
        count,
      })
    )

    const memoryPressure = Array.from(memoryPressureCounts.entries()).map(
      ([level, count]) => ({
        level: level || "Unknown",
        count,
      })
    )

    const fpsDistribution = Array.from(fpsDistributionCounts.entries()).map(
      ([range, count]) => ({
        range,
        count,
      })
    )

    // Recent activity (last 10 sessions)
    const recentActivity = sessions?.slice(0, 10) || []

    return {
      totalSessions,
      totalMetrics,
      avgFps: Math.round(avgFps * 100) / 100,
      avgMemory: Math.round(avgMemory * 100) / 100,
      avgCpu: 0, // No CPU metrics in this schema
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      deviceCount: uniqueDevices.size,
      platformBreakdown,
      performanceTiers,
      recentActivity,
      memoryPressure,
      fpsDistribution,
    }
  } catch (error) {
    console.error("Error fetching performance summary:", error)
    // Return empty state on any error
    return {
      totalSessions: 0,
      totalMetrics: 0,
      avgFps: 0,
      avgMemory: 0,
      avgCpu: 0,
      avgLoadTime: 0,
      deviceCount: 0,
      platformBreakdown: [],
      performanceTiers: [],
      recentActivity: [],
      memoryPressure: [],
      fpsDistribution: [],
    }
  }
}

/**
 * Get performance metrics trends over time
 */
export async function getPerformanceTrends(
  limit = 100
): Promise<MetricsTrend[]> {
  const supabase = createClient()

  try {
    // Get all performance metrics with normalized schema
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .order("timestamp", { ascending: true })
      .limit(limit)

    if (error) {
      console.warn(`Performance trends error: ${error.message}`)
      return []
    }

    // Group metrics by timestamp to create trend data points
    const metricsGrouped = new Map<string, any>()

    data?.forEach(metric => {
      const timestamp = metric.timestamp
      if (!metricsGrouped.has(timestamp)) {
        metricsGrouped.set(timestamp, {
          timestamp,
          fps: 0,
          memory_usage: 0,
          cpu_usage: 0,
          load_time: 0,
          screen_name: (metric.context as any)?.screen_name || "Unknown",
        })
      }

      const point = metricsGrouped.get(timestamp)!

      // Map metric types to trend properties
      switch (metric.metric_type) {
        case "fps":
          point.fps = metric.metric_value
          break
        case "memory_usage":
        case "memory":
          point.memory_usage = metric.metric_value
          break
        case "cpu_usage":
        case "cpu":
          point.cpu_usage = metric.metric_value
          break
        case "navigation_time":
        case "screen_load":
        case "load_time":
          point.load_time = metric.metric_value
          break
      }
    })

    return Array.from(metricsGrouped.values())
  } catch (error) {
    console.error("Error fetching performance trends:", error)
    return []
  }
}

/**
 * Get detailed session performance data
 */
export async function getSessionPerformance(
  sessionId: string
): Promise<SessionPerformance | null> {
  const supabase = createClient()

  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from("performance_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) {
    return null
  }

  // Get all metrics for this session
  const { data: metrics, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true })

  if (metricsError) {
    throw new Error(`Failed to fetch session metrics: ${metricsError.message}`)
  }

  // Transform metrics for trending with normalized schema
  const metricsGrouped = new Map<string, any>()

  metrics?.forEach(metric => {
    const timestamp = metric.timestamp
    if (!metricsGrouped.has(timestamp)) {
      metricsGrouped.set(timestamp, {
        timestamp,
        fps: 0,
        memory_usage: 0,
        cpu_usage: 0,
        load_time: 0,
        screen_name: (metric.context as any)?.screen_name || "Unknown",
      })
    }

    const point = metricsGrouped.get(timestamp)!

    switch (metric.metric_type) {
      case "fps":
        point.fps = metric.metric_value
        break
      case "memory_usage":
      case "memory":
        point.memory_usage = metric.metric_value
        break
      case "cpu_usage":
      case "cpu":
        point.cpu_usage = metric.metric_value
        break
      case "navigation_time":
      case "screen_load":
      case "load_time":
        point.load_time = metric.metric_value
        break
    }
  })

  const trends: MetricsTrend[] = Array.from(metricsGrouped.values())

  return {
    session,
    metrics: metrics || [],
    trends,
  }
}

/**
 * Get recent performance sessions with pagination
 */
export async function getRecentSessions(
  limit = 20,
  offset = 0
): Promise<PerformanceSession[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("performance_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch recent sessions: ${error.message}`)
  }

  return data || []
}

/**
 * Get performance metrics by screen name
 */
export async function getMetricsByScreen(
  screenName?: string
): Promise<PerformanceMetric[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("performance_metrics")
      .select("*")
      .order("timestamp", { ascending: false })

    if (screenName) {
      // Filter by screen name in context JSON
      query = query.contains("context", { screen_name: screenName })
    }

    const { data, error } = await query.limit(1000)

    if (error) {
      console.warn(`Metrics by screen error: ${error.message}`)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching metrics by screen:", error)
    return []
  }
}

/**
 * Get build performance data grouped by app version
 */
export async function getBuildPerformanceData(): Promise<any[]> {
  const supabase = createClient()

  try {
    // Get all sessions with their app versions
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (sessionsError || !sessions?.length) {
      return []
    }

    // Get all metrics for calculating averages
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")

    if (metricsError || !metrics) {
      return []
    }

    // Group sessions by app version
    const versionGroups = new Map<string, any>()

    sessions.forEach(session => {
      const version = session.app_version
      if (!versionGroups.has(version)) {
        versionGroups.set(version, {
          version,
          sessions: [],
          totalSessions: 0,
          firstSeen: session.created_at,
          lastSeen: session.created_at,
          platforms: new Set(),
        })
      }

      const group = versionGroups.get(version)!
      group.sessions.push(session)
      group.totalSessions++
      group.platforms.add(session.device_type)

      // Update date ranges
      if (new Date(session.created_at) < new Date(group.firstSeen)) {
        group.firstSeen = session.created_at
      }
      if (new Date(session.created_at) > new Date(group.lastSeen)) {
        group.lastSeen = session.created_at
      }
    })

    // Calculate performance metrics for each version
    const buildPerformance = Array.from(versionGroups.values()).map(group => {
      const sessionIds = new Set(group.sessions.map((s: any) => s.id))
      const versionMetrics = metrics.filter(
        m => m.session_id && sessionIds.has(m.session_id)
      )

      // Calculate averages
      const fpsMetrics = versionMetrics.filter(m => m.metric_type === "fps")
      const memoryMetrics = versionMetrics.filter(
        m => m.metric_type === "memory_usage"
      )
      const loadTimeMetrics = versionMetrics.filter(
        m =>
          m.metric_type === "navigation_time" || m.metric_type === "screen_load"
      )
      const cpuMetrics = versionMetrics.filter(
        m => m.metric_type === "cpu_usage"
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
      const avgCpu =
        cpuMetrics.length > 0
          ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            cpuMetrics.length
          : 0

      // Calculate regression score (performance composite)
      const fpsScore =
        avgFps >= 50 ? 90 : avgFps >= 30 ? 70 : avgFps >= 20 ? 50 : 30
      const memoryScore =
        avgMemory <= 200
          ? 90
          : avgMemory <= 400
            ? 70
            : avgMemory <= 600
              ? 50
              : 30
      const loadTimeScore =
        avgLoadTime <= 500
          ? 90
          : avgLoadTime <= 1000
            ? 70
            : avgLoadTime <= 2000
              ? 50
              : 30
      const regressionScore = Math.round(
        (fpsScore + memoryScore + loadTimeScore) / 3
      )

      // Determine status based on regression score
      let status = "passed"
      if (regressionScore < 50) status = "failed"
      else if (regressionScore < 70) status = "warning"

      return {
        version: group.version,
        commit: "N/A", // Not available in current schema
        branch: "main", // Default - not tracked
        timestamp: group.lastSeen,
        avgFps: Math.round(avgFps * 10) / 10,
        avgMemory: Math.round(avgMemory),
        avgLoadTime: Math.round(avgLoadTime),
        avgCpu: Math.round(avgCpu),
        regressionScore,
        status,
        totalSessions: group.totalSessions,
        platforms: Array.from(group.platforms),
        dateRange: {
          first: group.firstSeen,
          last: group.lastSeen,
        },
      }
    })

    // Sort by timestamp (newest first) and limit to last 10 versions
    return buildPerformance
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10)
  } catch (error) {
    console.error("Error fetching build performance data:", error)
    return []
  }
}

/**
 * Get unique screen names for filtering
 */
export async function getScreenNames(): Promise<string[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("context")

    if (error) {
      console.warn(`Screen names error: ${error.message}`)
      return []
    }

    // Extract screen names from context JSON
    const screenNames = new Set<string>()
    data?.forEach(metric => {
      if (
        metric.context &&
        typeof metric.context === "object" &&
        "screen_name" in metric.context
      ) {
        const screenName = (metric.context as any).screen_name
        if (screenName && typeof screenName === "string") {
          screenNames.add(screenName)
        }
      }
    })

    return Array.from(screenNames).sort()
  } catch (error) {
    console.error("Error fetching screen names:", error)
    return []
  }
}
