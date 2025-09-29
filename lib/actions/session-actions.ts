"use server"

import { createClient } from "@/lib/supabase/server"
import { PerformanceMetric } from "@/lib/performance-data"
import {
  SessionDetails,
  SessionMetricsTimeline,
  SessionPerformanceAnalysis,
  PerformanceIssue,
} from "@/types/session"

/**
 * Performance thresholds for issue detection
 */
const PERFORMANCE_THRESHOLDS = {
  fps: {
    good: 45,
    fair: 30,
    poor: 20,
  },
  memory: {
    good: 200,
    fair: 400,
    poor: 600,
  },
  loadTime: {
    good: 1000,
    fair: 2000,
    poor: 3000,
  },
  cpu: {
    good: 40,
    fair: 70,
    poor: 90,
  },
} as const

/**
 * Get comprehensive session details including health score and performance analysis
 */
export async function getSessionDetails(
  sessionId: string
): Promise<SessionDetails | null> {
  const supabase = createClient()

  try {
    // Get session data
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
      console.warn(`Session metrics error: ${metricsError.message}`)
    }

    const sessionMetrics = metrics || []

    // Calculate session details
    const isActive = !session.session_end
    const duration = session.session_end
      ? new Date(session.session_end).getTime() -
        new Date(session.session_start).getTime()
      : null

    // Get unique screens visited
    const uniqueScreens = Array.from(
      new Set(
        sessionMetrics.map(m => (m.context as any)?.screen_name).filter(Boolean)
      )
    )

    // Calculate health indicators
    const healthIndicators = calculateHealthIndicators(sessionMetrics)

    // Calculate performance score (0-100)
    const performanceScore = calculatePerformanceScore(healthIndicators)

    // Calculate risk level
    const riskLevel = calculateRiskLevel(healthIndicators, isActive)

    const sessionDetails: SessionDetails = {
      ...session,
      isActive,
      duration,
      totalMetrics: sessionMetrics.length,
      uniqueScreens,
      performanceScore,
      riskLevel,
      healthIndicators,
    }

    return sessionDetails
  } catch (error) {
    console.error("Error getting session details:", error)
    return null
  }
}

/**
 * Get session metrics timeline with aggregated data points
 */
export async function getSessionMetrics(
  sessionId: string
): Promise<SessionMetricsTimeline[]> {
  const supabase = createClient()

  try {
    const { data: metrics, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })

    if (error || !metrics) {
      return []
    }

    // Group metrics by timestamp (rounded to nearest 5 seconds)
    const groupedMetrics = new Map<string, PerformanceMetric[]>()

    metrics.forEach(metric => {
      const roundedTimestamp = roundToNearestInterval(metric.timestamp, 5000)
      if (!groupedMetrics.has(roundedTimestamp)) {
        groupedMetrics.set(roundedTimestamp, [])
      }
      groupedMetrics.get(roundedTimestamp)!.push(metric)
    })

    // Convert grouped metrics to timeline points
    const timeline: SessionMetricsTimeline[] = []

    groupedMetrics.forEach((metricsGroup, timestamp) => {
      const fpsMetrics = metricsGroup.filter(m => m.metric_type === "fps")
      const memoryMetrics = metricsGroup.filter(
        m => m.metric_type === "memory_usage"
      )
      const cpuMetrics = metricsGroup.filter(m => m.metric_type === "cpu_usage")
      const loadTimeMetrics = metricsGroup.filter(
        m =>
          m.metric_type === "navigation_time" || m.metric_type === "screen_load"
      )

      // Get screen name from any metric in this group
      const screenName =
        (metricsGroup[0]?.context as any)?.screen_name || "Unknown"

      const timelinePoint: SessionMetricsTimeline = {
        timestamp,
        fps:
          fpsMetrics.length > 0
            ? average(fpsMetrics.map(m => m.metric_value))
            : 0,
        memory_usage:
          memoryMetrics.length > 0
            ? average(memoryMetrics.map(m => m.metric_value))
            : 0,
        cpu_usage:
          cpuMetrics.length > 0
            ? average(cpuMetrics.map(m => m.metric_value))
            : 0,
        load_time:
          loadTimeMetrics.length > 0
            ? average(loadTimeMetrics.map(m => m.metric_value))
            : 0,
        screen_name: screenName,
        metric_count: metricsGroup.length,
      }

      timeline.push(timelinePoint)
    })

    return timeline.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  } catch (error) {
    console.error("Error getting session metrics:", error)
    return []
  }
}

/**
 * Get session performance analysis with issue detection and trends
 */
export async function getSessionAnalysis(
  sessionId: string
): Promise<SessionPerformanceAnalysis> {
  const metrics = await getSessionMetrics(sessionId)

  // Detect performance issues
  const performanceIssues = detectPerformanceIssues(metrics)

  // Calculate trends
  const performanceTrends = calculatePerformanceTrends(metrics)

  // Calculate screen-by-screen performance
  const screenPerformance = calculateScreenPerformance(metrics)

  return {
    performanceIssues,
    performanceTrends,
    screenPerformance,
  }
}

/**
 * Check if a session is currently active (receiving metrics recently)
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Check if session has no end time
    const { data: session } = await supabase
      .from("performance_sessions")
      .select("session_end")
      .eq("id", sessionId)
      .single()

    if (!session || session.session_end) {
      return false
    }

    // Check for recent metrics (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()

    const { data: recentMetrics } = await supabase
      .from("performance_metrics")
      .select("id")
      .eq("session_id", sessionId)
      .gte("timestamp", thirtySecondsAgo)
      .limit(1)

    return (recentMetrics?.length || 0) > 0
  } catch (error) {
    console.error("Error checking session activity:", error)
    return false
  }
}

// Helper functions

function calculateHealthIndicators(metrics: PerformanceMetric[]) {
  const fpsMetrics = metrics.filter(m => m.metric_type === "fps")
  const memoryMetrics = metrics.filter(m => m.metric_type === "memory_usage")
  const cpuMetrics = metrics.filter(m => m.metric_type === "cpu_usage")
  const loadTimeMetrics = metrics.filter(
    m => m.metric_type === "navigation_time" || m.metric_type === "screen_load"
  )

  return {
    avgFps:
      fpsMetrics.length > 0 ? average(fpsMetrics.map(m => m.metric_value)) : 0,
    avgMemory:
      memoryMetrics.length > 0
        ? average(memoryMetrics.map(m => m.metric_value))
        : 0,
    avgCpu:
      cpuMetrics.length > 0 ? average(cpuMetrics.map(m => m.metric_value)) : 0,
    avgLoadTime:
      loadTimeMetrics.length > 0
        ? average(loadTimeMetrics.map(m => m.metric_value))
        : 0,
  }
}

function calculatePerformanceScore(healthIndicators: {
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
}): number {
  const { avgFps, avgMemory, avgCpu, avgLoadTime } = healthIndicators

  // Score each metric (0-100)
  const fpsScore = Math.min(100, (avgFps / 60) * 100)
  const memoryScore = Math.max(0, 100 - (avgMemory / 1000) * 100)
  const cpuScore = Math.max(0, 100 - avgCpu)
  const loadTimeScore = Math.max(0, 100 - (avgLoadTime / 5000) * 100)

  // Weighted average
  const score =
    fpsScore * 0.3 + memoryScore * 0.25 + cpuScore * 0.25 + loadTimeScore * 0.2

  return Math.round(Math.max(0, Math.min(100, score)))
}

function calculateRiskLevel(
  healthIndicators: {
    avgFps: number
    avgMemory: number
    avgCpu: number
    avgLoadTime: number
  },
  isActive: boolean // TODO: Fix unused variable isActive
): "low" | "medium" | "high" {
  const { avgFps, avgMemory, avgCpu, avgLoadTime } = healthIndicators

  // High risk conditions
  if (
    avgFps < PERFORMANCE_THRESHOLDS.fps.poor ||
    avgMemory > PERFORMANCE_THRESHOLDS.memory.poor ||
    avgCpu > PERFORMANCE_THRESHOLDS.cpu.poor ||
    avgLoadTime > PERFORMANCE_THRESHOLDS.loadTime.poor
  ) {
    return "high"
  }

  // Medium risk conditions
  if (
    avgFps < PERFORMANCE_THRESHOLDS.fps.fair ||
    avgMemory > PERFORMANCE_THRESHOLDS.memory.fair ||
    avgCpu > PERFORMANCE_THRESHOLDS.cpu.fair ||
    avgLoadTime > PERFORMANCE_THRESHOLDS.loadTime.fair
  ) {
    return "medium"
  }

  return "low"
}

function detectPerformanceIssues(
  metrics: SessionMetricsTimeline[]
): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []

  metrics.forEach(metric => {
    // FPS drop detection
    if (metric.fps > 0 && metric.fps < PERFORMANCE_THRESHOLDS.fps.poor) {
      issues.push({
        type: "fps_drop",
        timestamp: metric.timestamp,
        severity: metric.fps < 15 ? "high" : "medium",
        description: `Low FPS detected: ${metric.fps.toFixed(1)} FPS`,
        affectedScreen: metric.screen_name,
        value: metric.fps,
        threshold: PERFORMANCE_THRESHOLDS.fps.poor,
      })
    }

    // Memory spike detection
    if (metric.memory_usage > PERFORMANCE_THRESHOLDS.memory.poor) {
      issues.push({
        type: "memory_spike",
        timestamp: metric.timestamp,
        severity: metric.memory_usage > 800 ? "high" : "medium",
        description: `High memory usage: ${metric.memory_usage.toFixed(0)}MB`,
        affectedScreen: metric.screen_name,
        value: metric.memory_usage,
        threshold: PERFORMANCE_THRESHOLDS.memory.poor,
      })
    }

    // Slow load detection
    if (metric.load_time > PERFORMANCE_THRESHOLDS.loadTime.poor) {
      issues.push({
        type: "slow_load",
        timestamp: metric.timestamp,
        severity: metric.load_time > 5000 ? "high" : "medium",
        description: `Slow load time: ${(metric.load_time / 1000).toFixed(1)}s`,
        affectedScreen: metric.screen_name,
        value: metric.load_time,
        threshold: PERFORMANCE_THRESHOLDS.loadTime.poor,
      })
    }

    // High CPU detection
    if (metric.cpu_usage > PERFORMANCE_THRESHOLDS.cpu.poor) {
      issues.push({
        type: "cpu_high",
        timestamp: metric.timestamp,
        severity: metric.cpu_usage > 90 ? "high" : "medium",
        description: `High CPU usage: ${metric.cpu_usage.toFixed(0)}%`,
        affectedScreen: metric.screen_name,
        value: metric.cpu_usage,
        threshold: PERFORMANCE_THRESHOLDS.cpu.poor,
      })
    }
  })

  return issues.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

function calculatePerformanceTrends(metrics: SessionMetricsTimeline[]) {
  if (metrics.length < 4) {
    return {
      overall: "stable" as const,
      fps: "stable" as const,
      memory: "stable" as const,
      loadTime: "stable" as const,
    }
  }

  const midpoint = Math.floor(metrics.length / 2)
  const firstHalf = metrics.slice(0, midpoint)
  const secondHalf = metrics.slice(midpoint)

  const firstHalfAvg = {
    fps: average(firstHalf.map(m => m.fps)),
    memory: average(firstHalf.map(m => m.memory_usage)),
    loadTime: average(firstHalf.map(m => m.load_time)),
  }

  const secondHalfAvg = {
    fps: average(secondHalf.map(m => m.fps)),
    memory: average(secondHalf.map(m => m.memory_usage)),
    loadTime: average(secondHalf.map(m => m.load_time)),
  }

  const getTrend = (
    before: number,
    after: number,
    higherIsBetter: boolean
  ): "improving" | "stable" | "declining" => {
    const change = after - before
    const threshold = before * 0.1 // 10% change threshold

    if (Math.abs(change) < threshold) return "stable"

    if (higherIsBetter) {
      return change > 0 ? "improving" : "declining"
    } else {
      return change < 0 ? "improving" : "declining"
    }
  }

  const fpsTrend = getTrend(firstHalfAvg.fps, secondHalfAvg.fps, true)
  const memoryTrend = getTrend(firstHalfAvg.memory, secondHalfAvg.memory, false)
  const loadTimeTrend = getTrend(
    firstHalfAvg.loadTime,
    secondHalfAvg.loadTime,
    false
  )

  // Overall trend based on majority
  const trends = [fpsTrend, memoryTrend, loadTimeTrend]
  const improving = trends.filter(t => t === "improving").length
  const declining = trends.filter(t => t === "declining").length

  let overall: "improving" | "stable" | "declining"
  if (improving > declining) {
    overall = "improving"
  } else if (declining > improving) {
    overall = "declining"
  } else {
    overall = "stable"
  }

  return {
    overall,
    fps: fpsTrend,
    memory: memoryTrend,
    loadTime: loadTimeTrend,
  }
}

function calculateScreenPerformance(metrics: SessionMetricsTimeline[]) {
  const screenMetrics = new Map<string, SessionMetricsTimeline[]>()

  // Group metrics by screen
  metrics.forEach(metric => {
    if (!screenMetrics.has(metric.screen_name)) {
      screenMetrics.set(metric.screen_name, [])
    }
    screenMetrics.get(metric.screen_name)!.push(metric)
  })

  // Calculate performance for each screen
  return Array.from(screenMetrics.entries())
    .map(([screenName, screenData]) => {
      const issues = detectPerformanceIssues(screenData)

      return {
        screenName,
        visitCount: screenData.length,
        avgFps: average(screenData.map(m => m.fps)),
        avgMemory: average(screenData.map(m => m.memory_usage)),
        avgLoadTime: average(screenData.map(m => m.load_time)),
        issueCount: issues.length,
      }
    })
    .sort((a, b) => b.visitCount - a.visitCount)
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

function roundToNearestInterval(timestamp: string, intervalMs: number): string {
  const date = new Date(timestamp)
  const rounded = new Date(Math.round(date.getTime() / intervalMs) * intervalMs)
  return rounded.toISOString()
}
