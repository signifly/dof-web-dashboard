import { createClient } from "@/lib/supabase/server"
import { Tables, Json } from "@/types/database"
import {
  ScreenTimeContext,
  RoutePerformanceSession,
  RoutePerformanceData,
  RoutePerformanceAnalysis,
  PerformanceDistribution,
} from "@/types/route-performance"
import {
  inferCPUUsage,
  PerformanceMetricsForInference,
} from "@/lib/utils/cpu-inference"

export function parseScreenTimeContext(context: Json): ScreenTimeContext | null {
  if (!context || typeof context !== "object") {
    return null
  }

  const ctx = context as any

  if (
    !ctx.segments ||
    !Array.isArray(ctx.segments) ||
    !ctx.routeName ||
    !ctx.routePath ||
    typeof ctx.screenStartTime !== "number"
  ) {
    return null
  }

  return {
    segments: ctx.segments,
    routeName: ctx.routeName,
    routePath: ctx.routePath,
    screenStartTime: ctx.screenStartTime,
  }
}

export function normalizeRoutePattern(
  routePath: string,
  segments: string[]
): string {
  let pattern = routePath

  for (const segment of segments) {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      continue
    }

    if (isDynamicSegment(segment, routePath)) {
      const segmentRegex = new RegExp(`/${escapeRegExp(segment)}(/|$)`, "g")
      pattern = pattern.replace(segmentRegex, "/[id]$1")
    }
  }

  return pattern
}

function isDynamicSegment(segment: string, routePath: string): boolean {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return true
  }

  const commonStaticSegments = [
    "home",
    "dashboard",
    "settings",
    "profile",
    "about",
    "contact",
    "game",
    "menu",
    "list",
    "detail",
    "edit",
    "create",
    "view",
  ]

  if (commonStaticSegments.includes(segment.toLowerCase())) {
    return false
  }

  if (/^[a-f0-9-]{36}$/i.test(segment)) {
    return true
  }

  if (/^\d+$/.test(segment)) {
    return true
  }

  if (segment.length > 10 && /[a-z0-9-]/.test(segment)) {
    return true
  }

  return false
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function correlateRoutePerformance(
  sessionId: string
): Promise<RoutePerformanceSession[]> {
  const supabase = createClient()

  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true })

  if (!metrics?.length) return []

  const { data: session } = await supabase
    .from("performance_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (!session) return []

  const screenTimeEvents = metrics
    .filter(m => m.metric_type === "screen_time")
    .map(m => ({
      ...parseScreenTimeContext(m.context),
      timestamp: m.timestamp,
      metricId: m.id,
    }))
    .filter(Boolean)
    .sort((a, b) => a!.screenStartTime - b!.screenStartTime) as Array<
    ScreenTimeContext & { timestamp: string; metricId: string }
  >

  const performanceMetrics = metrics.filter(m =>
    ["fps", "memory_usage", "cpu_usage"].includes(m.metric_type)
  )

  const routeSessions: RoutePerformanceSession[] = []

  for (let i = 0; i < screenTimeEvents.length; i++) {
    const screenEvent = screenTimeEvents[i]
    const nextScreenEvent = screenTimeEvents[i + 1]

    const windowStart = screenEvent.screenStartTime
    const windowEnd = nextScreenEvent
      ? nextScreenEvent.screenStartTime
      : windowStart + 5 * 60 * 1000

    const screenMetrics = performanceMetrics.filter(metric => {
      const metricTime = new Date(metric.timestamp).getTime()
      return metricTime >= windowStart && metricTime < windowEnd
    })

    const fpsMetrics = screenMetrics
      .filter(m => m.metric_type === "fps")
      .map(m => m.metric_value)

    const memoryMetrics = screenMetrics
      .filter(m => m.metric_type === "memory_usage")
      .map(m => m.metric_value)

    const cpuMetrics = screenMetrics
      .filter(m => m.metric_type === "cpu_usage")
      .map(m => m.metric_value)

    const avgFps =
      fpsMetrics.length > 0
        ? fpsMetrics.reduce((sum, fps) => sum + fps, 0) / fpsMetrics.length
        : 0

    const avgMemory =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, mem) => sum + mem, 0) / memoryMetrics.length
        : 0

    let avgCpu =
      cpuMetrics.length > 0
        ? cpuMetrics.reduce((sum, cpu) => sum + cpu, 0) / cpuMetrics.length
        : 0

    if (avgCpu === 0 && (avgFps > 0 || avgMemory > 0)) {
      const inferenceInput: PerformanceMetricsForInference = {
        fps: avgFps || 30,
        memory_usage: avgMemory || 200,
        load_time: 1000,
        device_type: session.device_type || "Unknown",
      }
      avgCpu = inferCPUUsage(inferenceInput)
    }

    const routeSession: RoutePerformanceSession = {
      sessionId,
      deviceId: session.anonymous_user_id,
      routeName: screenEvent.routeName,
      routePath: screenEvent.routePath,
      routePattern: normalizeRoutePattern(
        screenEvent.routePath,
        screenEvent.segments
      ),
      segments: screenEvent.segments,
      screenStartTime: windowStart,
      screenDuration: windowEnd - windowStart,
      fpsMetrics,
      memoryMetrics,
      cpuMetrics,
      avgFps,
      avgMemory,
      avgCpu,
      deviceType: session.device_type,
      appVersion: session.app_version,
      timestamp: screenEvent.timestamp,
    }

    routeSessions.push(routeSession)
  }

  return routeSessions
}

function calculatePerformanceDistribution(
  values: number[],
  type: "fps" | "memory"
): PerformanceDistribution {
  if (values.length === 0) {
    return { excellent: 0, good: 0, fair: 0, poor: 0 }
  }

  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }

  values.forEach(value => {
    if (type === "fps") {
      if (value >= 50) distribution.excellent++
      else if (value >= 30) distribution.good++
      else if (value >= 20) distribution.fair++
      else distribution.poor++
    } else {
      if (value <= 200) distribution.excellent++
      else if (value <= 400) distribution.good++
      else if (value <= 600) distribution.fair++
      else distribution.poor++
    }
  })

  return distribution
}

function calculatePerformanceScore(
  avgFps: number,
  avgMemory: number,
  avgCpu: number
): number {
  const fpsScore = Math.min(100, Math.max(0, (avgFps / 60) * 100))
  const memoryScore = Math.min(100, Math.max(0, 100 - (avgMemory / 1000) * 100))
  const cpuScore = Math.min(100, Math.max(0, 100 - avgCpu))

  return Math.round((fpsScore + memoryScore + cpuScore) / 3)
}

function calculateRoutePerformanceData(
  sessions: RoutePerformanceSession[]
): RoutePerformanceData {
  if (sessions.length === 0) {
    throw new Error("Cannot calculate performance data for empty sessions array")
  }

  const firstSession = sessions[0]
  const uniqueDevices = new Set(sessions.map(s => s.deviceId)).size

  const avgFps =
    sessions.reduce((sum, s) => sum + s.avgFps, 0) / sessions.length
  const avgMemory =
    sessions.reduce((sum, s) => sum + s.avgMemory, 0) / sessions.length
  const avgCpu =
    sessions.reduce((sum, s) => sum + s.avgCpu, 0) / sessions.length
  const avgScreenDuration =
    sessions.reduce((sum, s) => sum + (s.screenDuration || 0), 0) /
    sessions.length

  const allFpsValues = sessions.flatMap(s => s.fpsMetrics)
  const allMemoryValues = sessions.flatMap(s => s.memoryMetrics)

  const fpsDistribution = calculatePerformanceDistribution(allFpsValues, "fps")
  const memoryDistribution = calculatePerformanceDistribution(
    allMemoryValues,
    "memory"
  )

  const performanceScore = calculatePerformanceScore(avgFps, avgMemory, avgCpu)

  let riskLevel: "low" | "medium" | "high" = "low"
  if (performanceScore < 50) riskLevel = "high"
  else if (performanceScore < 70) riskLevel = "medium"

  const sortedSessions = sessions.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  let performanceTrend: "improving" | "stable" | "degrading" = "stable"
  if (sortedSessions.length >= 3) {
    const firstHalf = sortedSessions.slice(0, Math.floor(sessions.length / 2))
    const secondHalf = sortedSessions.slice(Math.floor(sessions.length / 2))

    const firstHalfAvg =
      firstHalf.reduce((sum, s) => sum + s.avgFps, 0) / firstHalf.length
    const secondHalfAvg =
      secondHalf.reduce((sum, s) => sum + s.avgFps, 0) / secondHalf.length

    const improvement = (secondHalfAvg - firstHalfAvg) / firstHalfAvg
    if (improvement > 0.1) performanceTrend = "improving"
    else if (improvement < -0.1) performanceTrend = "degrading"
  }

  return {
    routeName: firstSession.routeName,
    routePattern: firstSession.routePattern,
    totalSessions: sessions.length,
    uniqueDevices,
    avgFps: Math.round(avgFps * 100) / 100,
    avgMemory: Math.round(avgMemory),
    avgCpu: Math.round(avgCpu * 100) / 100,
    avgScreenDuration: Math.round(avgScreenDuration),
    fpsDistribution,
    memoryDistribution,
    performanceScore,
    riskLevel,
    sessions,
    performanceTrend,
    relativePerformance: {
      fpsVsAverage: 0,
      memoryVsAverage: 0,
      cpuVsAverage: 0,
    },
  }
}

function getEmptyAnalysis(): RoutePerformanceAnalysis {
  return {
    routes: [],
    summary: {
      totalRoutes: 0,
      totalSessions: 0,
      worstPerformingRoutes: [],
      bestPerformingRoutes: [],
      routesWithHighMemoryUsage: [],
      routesWithLowFps: [],
    },
    appAverages: {
      avgFps: 0,
      avgMemory: 0,
      avgCpu: 0,
    },
  }
}

export async function getRoutePerformanceAnalysis(): Promise<RoutePerformanceAnalysis> {
  const supabase = createClient()

  const { data: sessions } = await supabase
    .from("performance_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000)

  if (!sessions?.length) {
    return getEmptyAnalysis()
  }

  const allRouteSessions: RoutePerformanceSession[] = []

  for (const session of sessions) {
    try {
      const routeSessions = await correlateRoutePerformance(session.id)
      allRouteSessions.push(...routeSessions)
    } catch (error) {
      console.warn(`Failed to process session ${session.id}:`, error)
    }
  }

  if (allRouteSessions.length === 0) {
    return getEmptyAnalysis()
  }

  const routeMap = new Map<string, RoutePerformanceSession[]>()

  allRouteSessions.forEach(session => {
    const key = `${session.routeName}:${session.routePattern}`
    if (!routeMap.has(key)) {
      routeMap.set(key, [])
    }
    routeMap.get(key)!.push(session)
  })

  const routes: RoutePerformanceData[] = Array.from(routeMap.entries()).map(
    ([, sessions]) => calculateRoutePerformanceData(sessions)
  )

  const appAverages = {
    avgFps:
      allRouteSessions.reduce((sum, s) => sum + s.avgFps, 0) /
      allRouteSessions.length,
    avgMemory:
      allRouteSessions.reduce((sum, s) => sum + s.avgMemory, 0) /
      allRouteSessions.length,
    avgCpu:
      allRouteSessions.reduce((sum, s) => sum + s.avgCpu, 0) /
      allRouteSessions.length,
  }

  routes.forEach(route => {
    route.relativePerformance = {
      fpsVsAverage:
        appAverages.avgFps > 0
          ? ((route.avgFps - appAverages.avgFps) / appAverages.avgFps) * 100
          : 0,
      memoryVsAverage:
        appAverages.avgMemory > 0
          ? ((route.avgMemory - appAverages.avgMemory) / appAverages.avgMemory) *
            100
          : 0,
      cpuVsAverage:
        appAverages.avgCpu > 0
          ? ((route.avgCpu - appAverages.avgCpu) / appAverages.avgCpu) * 100
          : 0,
    }
  })

  const sortedRoutes = routes.sort((a, b) => b.performanceScore - a.performanceScore)

  const summary = {
    totalRoutes: routes.length,
    totalSessions: allRouteSessions.length,
    worstPerformingRoutes: sortedRoutes.slice(-3).reverse(),
    bestPerformingRoutes: sortedRoutes.slice(0, 3),
    routesWithHighMemoryUsage: routes
      .filter(r => r.avgMemory > appAverages.avgMemory * 1.5)
      .sort((a, b) => b.avgMemory - a.avgMemory)
      .slice(0, 3),
    routesWithLowFps: routes
      .filter(r => r.avgFps < appAverages.avgFps * 0.7)
      .sort((a, b) => a.avgFps - b.avgFps)
      .slice(0, 3),
  }

  return {
    routes: sortedRoutes,
    summary,
    appAverages: {
      avgFps: Math.round(appAverages.avgFps * 100) / 100,
      avgMemory: Math.round(appAverages.avgMemory),
      avgCpu: Math.round(appAverages.avgCpu * 100) / 100,
    },
  }
}