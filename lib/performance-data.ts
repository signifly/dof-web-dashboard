import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/types/database"
import {
  calculateInferredCPU,
  extractMetricsByType,
} from "@/lib/utils/cpu-inference-helper"
import {
  inferCPUUsage,
  PerformanceMetricsForInference,
} from "@/lib/utils/cpu-inference"
import {
  extractScreenName,
  getEnhancedRouteInfo,
} from "@/lib/utils/screen-time-parser"

export type PerformanceMetric = Tables<"performance_metrics">
export type PerformanceSession = Tables<"performance_sessions">

export interface PerformanceSummary {
  totalSessions: number
  totalMetrics: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  avgCacheSize: number
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
  cache_size: number
  screen_name: string
  route_path?: string
  route_pattern?: string
  is_dynamic?: boolean
  display_name?: string
}

export interface SessionPerformance {
  session: PerformanceSession
  metrics: PerformanceMetric[]
  trends: MetricsTrend[]
}

export interface DeviceProfile {
  deviceId: string
  platform: string
  appVersion: string
  sessions: PerformanceSession[]
  totalSessions: number
  avgFps: number
  avgMemory: number
  avgLoadTime: number
  avgCpu: number
  lastSeen: string
  performanceTier?: string
  riskLevel: "low" | "medium" | "high"
}

interface DeviceCalculation {
  deviceId: string
  platform: string
  appVersion: string
  sessions: PerformanceSession[]
  totalSessions: number
  fpsMetrics: number[]
  memoryMetrics: number[]
  lastSeen: string
}

// CPU inference logic moved to utils/cpu-inference-helper.ts

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
        avgCacheSize: 0,
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

    // Calculate averages using helper functions
    const { average: avgFps } = extractMetricsByType(metrics || [], "FPS", 0)
    const { average: avgMemory } = extractMetricsByType(
      metrics || [],
      "MEMORY",
      0
    )
    const { average: avgLoadTime } = extractMetricsByType(
      metrics || [],
      "LOAD_TIME",
      0
    )
    const { average: avgCacheSize } = extractMetricsByType(
      metrics || [],
      "CACHE_SIZE",
      0
    )

    // Calculate inferred CPU usage
    let avgInferredCpu = 0
    if (sessions && sessions.length > 0 && metrics && metrics.length > 0) {
      // Calculate inferred CPU for each session and average them
      const sessionCpuValues: number[] = []

      sessions.forEach(session => {
        const sessionMetrics = metrics.filter(m => m.session_id === session.id)
        if (sessionMetrics.length > 0) {
          const inferredCpu = calculateInferredCPU(
            sessionMetrics,
            session.device_type || "Unknown"
          )
          sessionCpuValues.push(inferredCpu)
        }
      })

      if (sessionCpuValues.length > 0) {
        avgInferredCpu =
          sessionCpuValues.reduce((sum, cpu) => sum + cpu, 0) /
          sessionCpuValues.length
      }
    }

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
      avgCpu: Math.round(avgInferredCpu * 100) / 100, // Inferred CPU usage
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
      avgCacheSize: Math.round(avgCacheSize * 100) / 100,
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
      avgCacheSize: 0,
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
 * Get performance metrics trends over time with enhanced screen_time data
 */
export async function getPerformanceTrends(
  limit = 100
): Promise<MetricsTrend[]> {
  const supabase = createClient()

  try {
    // Get all performance metrics with normalized schema
    // Note: We fetch many rows since multiple metric types share the same timestamp
    // and we group them into single time points
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit * 10) // Fetch more rows to account for grouping by timestamp

    if (error) {
      console.warn(`Performance trends error: ${error.message}`)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform metrics to time points using temporal association like device pages
    const trends = transformMetricsToTimePoints(data)

    // Get session data to infer CPU for points that don't have CPU data
    const { data: sessions } = await supabase
      .from("performance_sessions")
      .select("id, device_type")

    const sessionMap = new Map(sessions?.map(s => [s.id, s.device_type]) || [])

    // Calculate inferred CPU and return final trends
    const finalTrends = trends.map(point => {
      if (point.cpu_usage === 0 && point.session_id) {
        const deviceType = sessionMap.get(point.session_id) || "Unknown"
        if (point.fps > 0 || point.memory_usage > 0 || point.load_time > 0) {
          const inferenceInput: PerformanceMetricsForInference = {
            fps: point.fps || 30,
            memory_usage: point.memory_usage || 200,
            load_time: point.load_time || 1000,
            device_type: deviceType,
          }
          point.cpu_usage =
            Math.round(inferCPUUsage(inferenceInput) * 100) / 100
        }
      }
      return point
    })

    // Return requested limit in chronological order (oldest to newest for charts)
    return finalTrends.slice(0, limit).reverse()
  } catch (error) {
    console.error("Error fetching performance trends:", error)
    return []
  }
}

/**
 * Transform metrics to time points with temporal screen_time association
 * (Same logic as device pages)
 */
function transformMetricsToTimePoints(
  metrics: PerformanceMetric[]
): (MetricsTrend & { session_id?: string })[] {
  // First, create a map of screen_time data by timestamp for reference
  const screenTimeMap = new Map<string, any>()

  metrics
    .filter(m => m.metric_type === "screen_time")
    .forEach(metric => {
      const routeInfo = getEnhancedRouteInfo(metric.context)
      screenTimeMap.set(metric.timestamp, routeInfo)
    })

  // Function to find the most recent screen_time data for a given timestamp
  const findScreenTimeForTimestamp = (timestamp: string) => {
    const targetTime = new Date(timestamp).getTime()
    let closestEntry = null
    let closestTimeDiff = Infinity

    // Look for screen_time data within a 10-second window
    for (const [screenTimestamp, routeInfo] of screenTimeMap.entries()) {
      const screenTime = new Date(screenTimestamp).getTime()
      const timeDiff = Math.abs(targetTime - screenTime)

      // Only consider screen_time data from before or at the same time as the metric
      if (
        screenTime <= targetTime &&
        timeDiff <= 10000 &&
        timeDiff < closestTimeDiff
      ) {
        closestTimeDiff = timeDiff
        closestEntry = routeInfo
      }
    }

    return closestEntry
  }

  // Group performance metrics by timestamp
  const metricsGrouped = new Map<string, any>()

  // Process non-screen_time metrics
  metrics
    .filter(m => m.metric_type !== "screen_time")
    .forEach(metric => {
      const timestamp = metric.timestamp
      if (!metricsGrouped.has(timestamp)) {
        // Find associated screen_time data
        const screenTimeInfo = findScreenTimeForTimestamp(timestamp)

        metricsGrouped.set(timestamp, {
          timestamp,
          fps: 0,
          memory_usage: 0,
          cpu_usage: 0,
          load_time: 0,
          cache_size: 0,
          screen_name:
            screenTimeInfo?.displayName || extractScreenName(metric.context),
          route_path: screenTimeInfo?.routePath,
          route_pattern: screenTimeInfo?.routePattern,
          is_dynamic: screenTimeInfo?.isDynamic || false,
          display_name:
            screenTimeInfo?.displayName || extractScreenName(metric.context),
          session_id: metric.session_id,
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
        case "cache_size":
          point.cache_size = metric.metric_value
          break
      }
    })

  return Array.from(metricsGrouped.values())
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
        cache_size: 0,
        screen_name: extractScreenName(metric.context),
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
      case "cache_size":
        point.cache_size = metric.metric_value
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

      // Calculate averages using helper functions
      const { average: avgFps } = extractMetricsByType(versionMetrics, "FPS", 0)
      const { average: avgMemory } = extractMetricsByType(
        versionMetrics,
        "MEMORY",
        0
      )
      const { average: avgLoadTime } = extractMetricsByType(
        versionMetrics,
        "LOAD_TIME",
        0
      )
      const { average: avgCpu, values: cpuValues } = extractMetricsByType(
        versionMetrics,
        "CPU",
        0
      )

      // If no direct CPU data, calculate inferred CPU
      let finalAvgCpu = avgCpu
      if (cpuValues.length === 0) {
        const cpuInferences: number[] = []
        group.sessions.forEach((session: any) => {
          const sessionMetrics = versionMetrics.filter(
            m => m.session_id === session.id
          )
          if (sessionMetrics.length > 0) {
            const inferredCpu = calculateInferredCPU(
              sessionMetrics,
              session.device_type || "Unknown"
            )
            cpuInferences.push(inferredCpu)
          }
        })
        if (cpuInferences.length > 0) {
          finalAvgCpu =
            cpuInferences.reduce((sum, cpu) => sum + cpu, 0) /
            cpuInferences.length
        }
      }

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
        avgCpu: Math.round(finalAvgCpu),
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

/**
 * Get device performance data with calculated metrics averages
 */
export async function getDevicePerformanceData(): Promise<DeviceProfile[]> {
  const supabase = createClient()

  try {
    // 1. Fetch all recent sessions grouped by device
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000) // Reasonable limit for performance

    if (sessionsError || !sessions?.length) {
      console.warn(
        `Sessions error: ${sessionsError?.message || "No sessions found"}`
      )
      return []
    }

    // 2. Get all session IDs for metrics lookup
    const sessionIds = sessions.map(s => s.id)

    // 3. Fetch all metrics for these sessions
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)

    if (metricsError) {
      console.warn(`Metrics error: ${metricsError.message}`)
    }

    // 4. Group sessions by device and calculate real averages
    const deviceMap = new Map<string, DeviceCalculation>()

    sessions.forEach(session => {
      const deviceId = session.anonymous_user_id
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          deviceId,
          platform: session.device_type || "Unknown",
          appVersion: session.app_version || "Unknown",
          sessions: [],
          totalSessions: 0,
          fpsMetrics: [],
          memoryMetrics: [],
          lastSeen: session.created_at,
        })
      }

      const device = deviceMap.get(deviceId)!
      device.sessions.push(session)
      device.totalSessions++

      // Update last seen
      if (new Date(session.created_at) > new Date(device.lastSeen)) {
        device.lastSeen = session.created_at
      }

      // Collect metrics for this session
      const sessionMetrics =
        metrics?.filter(m => m.session_id === session.id) || []

      sessionMetrics.forEach(metric => {
        switch (metric.metric_type) {
          case "fps":
            device.fpsMetrics.push(metric.metric_value)
            break
          case "memory_usage":
            device.memoryMetrics.push(metric.metric_value)
            break
        }
      })
    })

    // 5. Calculate final averages and return DeviceProfile[]
    return Array.from(deviceMap.values()).map(device => {
      const avgFps =
        device.fpsMetrics.length > 0
          ? device.fpsMetrics.reduce((sum, fps) => sum + fps, 0) /
            device.fpsMetrics.length
          : 0

      const avgMemory =
        device.memoryMetrics.length > 0
          ? device.memoryMetrics.reduce((sum, mem) => sum + mem, 0) /
            device.memoryMetrics.length
          : 0

      // Calculate inferred CPU
      const avgCpu = calculateInferredCPU(
        device.sessions.flatMap(
          s => metrics?.filter(m => m.session_id === s.id) || []
        ),
        device.platform
      )

      // Calculate risk level based on actual metrics
      let riskLevel: "low" | "medium" | "high" = "low"
      if (avgFps < 20 || avgMemory > 800 || device.totalSessions < 2) {
        riskLevel = "high"
      } else if (avgFps < 45 || avgMemory > 400 || device.totalSessions < 5) {
        riskLevel = "medium"
      }

      return {
        deviceId: device.deviceId,
        platform: device.platform,
        appVersion: device.appVersion,
        sessions: device.sessions,
        totalSessions: device.totalSessions,
        avgFps: Math.round(avgFps * 10) / 10, // Real calculated value
        avgMemory: Math.round(avgMemory), // Real calculated value
        avgLoadTime: 0, // Not available in this database
        avgCpu: Math.round(avgCpu * 10) / 10,
        lastSeen: device.lastSeen,
        riskLevel,
      }
    })
  } catch (error) {
    console.error("Error fetching device performance data:", error)
    return []
  }
}

/**
 * Debug function to analyze metric types in the database
 */
export async function debugMetricTypes() {
  try {
    const supabase = createClient()

    // Get sample metrics to analyze types
    const { data: metrics, error } = await supabase
      .from("performance_metrics")
      .select("metric_type, metric_value")
      .limit(1000)

    if (error) {
      return {
        totalMetrics: 0,
        error: `Database error: ${error.message}`,
        metricTypes: [],
      }
    }

    if (!metrics || metrics.length === 0) {
      return {
        totalMetrics: 0,
        error: "No metrics found in database",
        metricTypes: [],
      }
    }

    // Analyze metric types
    const typeCounts = new Map<string, number>()
    const typeExamples = new Map<string, number[]>()

    metrics.forEach(metric => {
      const type = metric.metric_type
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)

      if (!typeExamples.has(type)) {
        typeExamples.set(type, [])
      }
      const examples = typeExamples.get(type)!
      if (examples.length < 5) {
        examples.push(metric.metric_value)
      }
    })

    const metricTypes = Array.from(typeCounts.entries()).map(
      ([type, count]) => ({
        type,
        count,
        examples: typeExamples.get(type) || [],
      })
    )

    return {
      totalMetrics: metrics.length,
      error: null,
      metricTypes,
    }
  } catch (error) {
    console.error("Debug function error:", error)
    return {
      totalMetrics: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      metricTypes: [],
    }
  }
}

/**
 * React cached version of performance functions for server components
 * These functions are cached per request to eliminate duplicate database calls
 */

/**
 * Cached performance summary - shared across dashboard, metrics, devices pages
 */
export const getCachedPerformanceSummary = cache(
  async (): Promise<PerformanceSummary> => {
    return await getPerformanceSummary()
  }
)

/**
 * Cached performance trends - shared across dashboard, metrics, analytics pages
 */
export const getCachedPerformanceTrends = cache(
  async (limit: number = 50): Promise<MetricsTrend[]> => {
    return await getPerformanceTrends(limit)
  }
)

/**
 * Cached recent sessions - shared across analytics and other pages
 */
export const getCachedRecentSessions = cache(
  async (limit: number = 50): Promise<PerformanceSession[]> => {
    return await getRecentSessions(limit)
  }
)

/**
 * Cached device performance data - used in devices page
 */
export const getCachedDevicePerformanceData = cache(
  async (): Promise<DeviceProfile[]> => {
    return await getDevicePerformanceData()
  }
)
