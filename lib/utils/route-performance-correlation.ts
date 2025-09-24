import {
  RoutePerformanceAnalysis,
  RoutePerformanceData,
} from "@/types/route-performance"

export interface RoutePerformanceInsight {
  route_pattern: string
  route_name: string
  performance_vs_average: {
    fps_deviation: number // % difference from app average
    memory_deviation: number // % difference from app average
    cpu_deviation: number // % difference from app average
  }
  trend_analysis: {
    direction: "improving" | "stable" | "degrading"
    confidence: number
    sessions_analyzed: number
  }
  anomaly_score: number // 0-1, higher = more anomalous
  risk_assessment: "low" | "medium" | "high"
}

export interface RouteAnomalyDetection {
  route_pattern: string
  route_name: string
  metric_type: "fps" | "memory" | "cpu"
  anomaly_severity: "critical" | "high" | "medium"
  deviation_from_norm: number
  current_value: number
  expected_value: number
  sessions_count: number
  unique_devices: number
}

export interface RouteComparison {
  route_pattern: string
  route_name: string
  comparison_type: "underperforming" | "overperforming" | "normal"
  deviation_percentage: number
  metric_type: "fps" | "memory" | "cpu"
  sessions_count: number
  confidence: number
}

export interface RouteTrendAnalysis {
  route_pattern: string
  route_name: string
  trend_direction: "improving" | "degrading" | "stable"
  trend_significance: "high" | "medium" | "low"
  metric_type: "fps" | "memory" | "cpu"
  trend_strength: number
  sessions_analyzed: number
}

/**
 * Correlate route performance with global app averages
 */
export function correlateRouteWithGlobalPerformance(
  routeData: RoutePerformanceData,
  appAverages: { avgFps: number; avgMemory: number; avgCpu: number }
): RoutePerformanceInsight {
  // Calculate percentage deviations from app averages
  const fps_deviation =
    appAverages.avgFps > 0
      ? ((routeData.avgFps - appAverages.avgFps) / appAverages.avgFps) * 100
      : 0

  const memory_deviation =
    appAverages.avgMemory > 0
      ? ((routeData.avgMemory - appAverages.avgMemory) /
          appAverages.avgMemory) *
        100
      : 0

  const cpu_deviation =
    appAverages.avgCpu > 0
      ? ((routeData.avgCpu - appAverages.avgCpu) / appAverages.avgCpu) * 100
      : 0

  // Calculate anomaly score based on how far the route deviates from norms
  const anomaly_score = Math.min(
    1,
    (Math.abs(fps_deviation) +
      Math.abs(memory_deviation) +
      Math.abs(cpu_deviation)) /
      300 // Normalize to 0-1 scale
  )

  // Determine risk assessment
  let risk_assessment: "low" | "medium" | "high" = "low"
  if (anomaly_score > 0.7 || routeData.performanceScore < 50) {
    risk_assessment = "high"
  } else if (anomaly_score > 0.4 || routeData.performanceScore < 70) {
    risk_assessment = "medium"
  }

  // Analyze trend direction and confidence
  const trend_analysis = {
    direction: routeData.performanceTrend,
    confidence: routeData.totalSessions >= 10 ? 0.8 : 0.5, // Higher confidence with more data
    sessions_analyzed: routeData.totalSessions,
  }

  return {
    route_pattern: routeData.routePattern,
    route_name: routeData.routeName,
    performance_vs_average: {
      fps_deviation,
      memory_deviation,
      cpu_deviation,
    },
    trend_analysis,
    anomaly_score,
    risk_assessment,
  }
}

/**
 * Identify routes with problematic performance patterns
 */
export function identifyProblematicRoutes(
  routeAnalysis: RoutePerformanceAnalysis
): RoutePerformanceData[] {
  return routeAnalysis.routes.filter(route => {
    // Route is problematic if:
    // 1. Performance score is poor (< 60)
    // 2. Risk level is high
    // 3. Performance is degrading
    // 4. Significantly worse than app average
    const insight = correlateRouteWithGlobalPerformance(
      route,
      routeAnalysis.appAverages
    )

    return (
      route.performanceScore < 60 ||
      route.riskLevel === "high" ||
      route.performanceTrend === "degrading" ||
      insight.risk_assessment === "high"
    )
  })
}

/**
 * Analyze performance trends across all routes
 */
export function analyzeRoutePerformanceTrends(
  routeAnalysis: RoutePerformanceAnalysis
): RouteTrendAnalysis[] {
  const trends: RouteTrendAnalysis[] = []

  routeAnalysis.routes.forEach(route => {
    // Only analyze routes with sufficient data
    if (route.totalSessions < 3) return

    // FPS trend analysis
    if (route.performanceTrend !== "stable") {
      const fpsMetrics = route.sessions.map(s => s.avgFps)
      const trendStrength = calculateTrendStrength(fpsMetrics)

      trends.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        trend_direction: route.performanceTrend,
        trend_significance: getTrendSignificance(
          trendStrength,
          route.totalSessions
        ),
        metric_type: "fps",
        trend_strength: trendStrength,
        sessions_analyzed: route.totalSessions,
      })
    }

    // Memory trend analysis
    const memoryMetrics = route.sessions.map(s => s.avgMemory)
    const memoryTrendStrength = calculateTrendStrength(memoryMetrics)
    const memoryTrendDirection = getMemoryTrendDirection(memoryMetrics)

    if (memoryTrendDirection !== "stable") {
      trends.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        trend_direction: memoryTrendDirection,
        trend_significance: getTrendSignificance(
          memoryTrendStrength,
          route.totalSessions
        ),
        metric_type: "memory",
        trend_strength: memoryTrendStrength,
        sessions_analyzed: route.totalSessions,
      })
    }
  })

  return trends.sort((a, b) => {
    const severityWeight = { high: 3, medium: 2, low: 1 }
    return (
      severityWeight[b.trend_significance] -
      severityWeight[a.trend_significance]
    )
  })
}

/**
 * Detect route performance anomalies
 */
export function detectRoutePerformanceAnomalies(
  routeAnalysis: RoutePerformanceAnalysis
): RouteAnomalyDetection[] {
  const anomalies: RouteAnomalyDetection[] = []

  // FPS target range: 50-60 FPS is the goal for all routes
  const FPS_TARGET_MIN = 50
  const FPS_TARGET_OPTIMAL = 55

  routeAnalysis.routes.forEach(route => {
    const insight = correlateRouteWithGlobalPerformance(
      route,
      routeAnalysis.appAverages
    )

    // FPS anomalies - check against target range, not app average
    if (route.avgFps < FPS_TARGET_MIN) {
      const deviationFromTarget =
        ((route.avgFps - FPS_TARGET_OPTIMAL) / FPS_TARGET_OPTIMAL) * 100

      anomalies.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        metric_type: "fps",
        anomaly_severity: getFpsAnomalySeverity(route.avgFps),
        deviation_from_norm: deviationFromTarget,
        current_value: route.avgFps,
        expected_value: FPS_TARGET_OPTIMAL,
        sessions_count: route.totalSessions,
        unique_devices: route.uniqueDevices,
      })
    }

    // Memory anomalies - based on memory pressure levels
    // Since all current sessions show "normal" pressure, focus on routes that might cause pressure
    const MEMORY_WARNING_THRESHOLD = 400 // MB - point where "warning" pressure might occur
    const MEMORY_CRITICAL_THRESHOLD = 600 // MB - point where "critical" pressure might occur

    if (route.avgMemory > MEMORY_WARNING_THRESHOLD) {
      const severity =
        route.avgMemory > MEMORY_CRITICAL_THRESHOLD
          ? "critical"
          : route.avgMemory > 500
            ? "high"
            : "medium"

      anomalies.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        metric_type: "memory",
        anomaly_severity: severity,
        deviation_from_norm:
          ((route.avgMemory - MEMORY_WARNING_THRESHOLD) /
            MEMORY_WARNING_THRESHOLD) *
          100,
        current_value: route.avgMemory,
        expected_value: MEMORY_WARNING_THRESHOLD, // Target to stay below warning threshold
        sessions_count: route.totalSessions,
        unique_devices: route.uniqueDevices,
      })
    }

    // CPU anomalies
    if (Math.abs(insight.performance_vs_average.cpu_deviation) > 35) {
      anomalies.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        metric_type: "cpu",
        anomaly_severity: getAnomalySeverity(
          Math.abs(insight.performance_vs_average.cpu_deviation)
        ),
        deviation_from_norm: insight.performance_vs_average.cpu_deviation,
        current_value: route.avgCpu,
        expected_value: routeAnalysis.appAverages.avgCpu,
        sessions_count: route.totalSessions,
        unique_devices: route.uniqueDevices,
      })
    }
  })

  return anomalies.sort((a, b) => {
    const severityWeight = { critical: 4, high: 3, medium: 2 }
    return (
      severityWeight[b.anomaly_severity] - severityWeight[a.anomaly_severity]
    )
  })
}

/**
 * Compare routes against global performance
 */
export function compareRoutesAgainstGlobalPerformance(
  routeAnalysis: RoutePerformanceAnalysis
): RouteComparison[] {
  const comparisons: RouteComparison[] = []

  // FPS target range: 50-60 FPS is the goal for all routes
  const FPS_TARGET_OPTIMAL = 55

  routeAnalysis.routes.forEach(route => {
    const _insight = correlateRouteWithGlobalPerformance(
      route,
      routeAnalysis.appAverages
    )

    // FPS comparison - against target performance, not just app average
    const fpsDeviationFromTarget =
      ((route.avgFps - FPS_TARGET_OPTIMAL) / FPS_TARGET_OPTIMAL) * 100

    if (Math.abs(fpsDeviationFromTarget) > 15) {
      comparisons.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        comparison_type:
          route.avgFps >= FPS_TARGET_OPTIMAL
            ? "overperforming"
            : "underperforming",
        deviation_percentage: Math.abs(fpsDeviationFromTarget),
        metric_type: "fps",
        sessions_count: route.totalSessions,
        confidence: route.totalSessions >= 10 ? 0.9 : 0.6,
      })
    }

    // Memory comparison - against memory pressure thresholds
    const MEMORY_OPTIMAL_TARGET = 300 // MB - target for optimal performance
    const MEMORY_WARNING_THRESHOLD = 400 // MB - warning pressure threshold

    const memoryDeviationFromOptimal =
      ((route.avgMemory - MEMORY_OPTIMAL_TARGET) / MEMORY_OPTIMAL_TARGET) * 100

    if (
      Math.abs(memoryDeviationFromOptimal) > 20 ||
      route.avgMemory > MEMORY_WARNING_THRESHOLD
    ) {
      comparisons.push({
        route_pattern: route.routePattern,
        route_name: route.routeName,
        comparison_type:
          route.avgMemory <= MEMORY_OPTIMAL_TARGET
            ? "overperforming" // Lower memory usage is better
            : "underperforming",
        deviation_percentage: Math.abs(memoryDeviationFromOptimal),
        metric_type: "memory",
        sessions_count: route.totalSessions,
        confidence: route.totalSessions >= 10 ? 0.9 : 0.6,
      })
    }
  })

  return comparisons.sort(
    (a, b) => b.deviation_percentage - a.deviation_percentage
  )
}

// Helper functions

function calculateTrendStrength(values: number[]): number {
  if (values.length < 3) return 0

  // Simple linear regression to calculate trend strength
  const n = values.length
  const sumX = (n * (n - 1)) / 2 // Sum of indices 0, 1, 2, ...
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, index) => sum + index * val, 0)
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6 // Sum of squares of indices

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

  // Normalize slope to 0-1 scale
  return Math.min(1, Math.abs(slope) / Math.max(...values))
}

function getTrendSignificance(
  strength: number,
  sessions: number
): "high" | "medium" | "low" {
  const confidenceAdjustedStrength = strength * (Math.min(sessions, 20) / 20)

  if (confidenceAdjustedStrength > 0.6) return "high"
  if (confidenceAdjustedStrength > 0.3) return "medium"
  return "low"
}

function getMemoryTrendDirection(
  memoryValues: number[]
): "improving" | "degrading" | "stable" {
  if (memoryValues.length < 3) return "stable"

  const firstHalf = memoryValues.slice(0, Math.floor(memoryValues.length / 2))
  const secondHalf = memoryValues.slice(Math.floor(memoryValues.length / 2))

  const firstAvg =
    firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg =
    secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

  const change = (secondAvg - firstAvg) / firstAvg

  if (change > 0.1) return "degrading" // Memory usage increasing is bad
  if (change < -0.1) return "improving" // Memory usage decreasing is good
  return "stable"
}

function getAnomalySeverity(
  deviationPercentage: number
): "critical" | "high" | "medium" {
  if (deviationPercentage > 70) return "critical"
  if (deviationPercentage > 50) return "high"
  return "medium"
}

function getFpsAnomalySeverity(
  actualFps: number
): "critical" | "high" | "medium" {
  if (actualFps < 20) return "critical" // Very poor performance
  if (actualFps < 30) return "high" // Poor performance
  return "medium" // Below target but manageable
}
