"use server"

import { RouteAnalyticsEngine } from "@/lib/services/route-analytics-engine"
import { UserJourneyTracker } from "@/lib/services/user-journey-tracker"
import { getRoutePerformanceAnalysis } from "@/lib/route-performance-data"
import { createClient } from "@/lib/supabase/server"
import {
  RoutePerformanceAnalysis,
  RoutePerformancePrediction,
  RouteCorrelationAnalysis,
} from "@/types/route-analytics"
import { JourneyPattern } from "@/types/user-journey"
import { SeasonalPattern, ProactiveRecommendation } from "@/types/insights"
import { SessionDetails } from "@/types/session"

export interface RouteAnalyticsDashboard {
  route_performance: RoutePerformanceAnalysis
  advanced_analytics: RouteAnalyticsReport | null
  journey_patterns: JourneyPattern[]
  performance_predictions: RoutePerformancePrediction[]
  seasonal_insights: SeasonalPattern[]
  proactive_recommendations: ProactiveRecommendation[]
  correlation_analysis: RouteCorrelationAnalysis[]
  processing_metadata: {
    generated_at: string
    processing_time_ms: number
    data_quality_score: number
    sessions_analyzed: number
    routes_analyzed: number
  }
}

interface RouteAnalyticsReport {
  id: string
  generated_at: string
  processing_time_ms: number
  route_correlations: RouteCorrelationAnalysis[]
  performance_predictions: RoutePerformancePrediction[]
  navigation_flows: any[]
  cross_route_patterns: any[]
  insights: any[]
  performance_meta: {
    sessions_processed: number
    routes_analyzed: number
    meets_performance_target: boolean
  }
  seasonal_patterns?: SeasonalPattern[]
  proactive_recommendations?: ProactiveRecommendation[]
}

/**
 * Get comprehensive route analytics dashboard data
 * Aggregates data from all analytics engines for the enhanced dashboard interface
 */
export async function getEnhancedRouteAnalytics(): Promise<RouteAnalyticsDashboard> {
  const startTime = performance.now()

  try {
    // Get base route performance data
    const routePerformance = await getRoutePerformanceAnalysis()

    // Get session data for journey analysis
    const sessionData = await getSessionDataForAnalysis()

    let advancedAnalytics: RouteAnalyticsReport | null = null
    let journeyPatterns: JourneyPattern[] = []

    // Generate advanced analytics if we have sufficient data
    if (routePerformance.routes && routePerformance.routes.length > 0) {
      try {
        const routeAnalyticsEngine = new RouteAnalyticsEngine()
        advancedAnalytics =
          await routeAnalyticsEngine.generateAdvancedInsights(routePerformance)
      } catch (error) {
        console.warn("Advanced analytics generation failed:", error)
      }
    }

    // Generate journey analytics if we have session data
    if (sessionData.length > 0) {
      try {
        const journeyTracker = new UserJourneyTracker()
        const journeys = await journeyTracker.reconstructJourneys(24)
        journeyPatterns = await journeyTracker.analyzeJourneyPatterns(journeys)
      } catch (error) {
        console.warn("Journey analytics generation failed:", error)
      }
    }

    const processingTime = performance.now() - startTime

    return {
      route_performance: routePerformance,
      advanced_analytics: advancedAnalytics,
      journey_patterns: journeyPatterns,
      performance_predictions: advancedAnalytics?.performance_predictions || [],
      seasonal_insights: advancedAnalytics?.seasonal_patterns || [],
      proactive_recommendations:
        advancedAnalytics?.proactive_recommendations || [],
      correlation_analysis: advancedAnalytics?.route_correlations || [],
      processing_metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        data_quality_score: calculateDataQualityScore(
          routePerformance,
          sessionData,
          journeyPatterns
        ),
        sessions_analyzed: sessionData.length,
        routes_analyzed: routePerformance.routes?.length || 0,
      },
    }
  } catch (error) {
    console.error("Error generating enhanced route analytics:", error)

    // Return minimal dashboard data in case of error
    const routePerformance = await getRoutePerformanceAnalysis().catch(() => ({
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
      trends: [],
      anomalies: [],
    }))

    const processingTime = performance.now() - startTime

    return {
      route_performance: routePerformance,
      advanced_analytics: null,
      journey_patterns: [],
      performance_predictions: [],
      seasonal_insights: [],
      proactive_recommendations: [],
      correlation_analysis: [],
      processing_metadata: {
        generated_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        data_quality_score: 0,
        sessions_analyzed: 0,
        routes_analyzed: routePerformance.routes?.length || 0,
      },
    }
  }
}

/**
 * Get session data optimized for analytics processing
 */
async function getSessionDataForAnalysis(): Promise<SessionDetails[]> {
  const supabase = createClient()

  try {
    // Get recent sessions with performance data (last 30 days)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data: sessions, error } = await supabase
      .from("performance_sessions")
      .select("*")
      .gte("session_start", thirtyDaysAgo)
      .order("session_start", { ascending: false })
      .limit(500) // Limit to 500 most recent sessions for performance

    if (error || !sessions) {
      console.warn("Error fetching session data for analytics:", error)
      return []
    }

    // Convert to SessionDetails format with basic health indicators
    const sessionDetails: SessionDetails[] = []

    for (const session of sessions) {
      try {
        // Get basic metrics for this session
        const { data: metrics } = await supabase
          .from("performance_metrics")
          .select("*")
          .eq("session_id", session.id)
          .limit(100) // Limit metrics per session

        const sessionMetrics = metrics || []

        // Calculate basic health indicators
        const fpsMetrics = sessionMetrics.filter(m => m.metric_type === "fps")
        const memoryMetrics = sessionMetrics.filter(
          m => m.metric_type === "memory_usage"
        )
        const cpuMetrics = sessionMetrics.filter(
          m => m.metric_type === "cpu_usage"
        )
        const loadTimeMetrics = sessionMetrics.filter(
          m =>
            m.metric_type === "navigation_time" ||
            m.metric_type === "screen_load"
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
        const avgCpu =
          cpuMetrics.length > 0
            ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
              cpuMetrics.length
            : 0
        const avgLoadTime =
          loadTimeMetrics.length > 0
            ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
              loadTimeMetrics.length
            : 0

        // Get unique screens
        const uniqueScreens = Array.from(
          new Set(
            sessionMetrics
              .map(m => (m.context as any)?.screen_name)
              .filter(Boolean)
          )
        )

        const healthIndicators = {
          avgFps,
          avgMemory,
          avgCpu,
          avgLoadTime,
        }

        // Calculate performance score
        const fpsScore = Math.min(100, (avgFps / 60) * 100)
        const memoryScore = Math.max(0, 100 - (avgMemory / 1000) * 100)
        const cpuScore = Math.max(0, 100 - avgCpu)
        const loadTimeScore = Math.max(0, 100 - (avgLoadTime / 5000) * 100)

        const performanceScore = Math.round(
          fpsScore * 0.3 +
            memoryScore * 0.25 +
            cpuScore * 0.25 +
            loadTimeScore * 0.2
        )

        // Calculate risk level
        let riskLevel: "low" | "medium" | "high" = "low"
        if (
          avgFps < 20 ||
          avgMemory > 600 ||
          avgCpu > 90 ||
          avgLoadTime > 3000
        ) {
          riskLevel = "high"
        } else if (
          avgFps < 30 ||
          avgMemory > 400 ||
          avgCpu > 70 ||
          avgLoadTime > 2000
        ) {
          riskLevel = "medium"
        }

        const isActive = !session.session_end
        const duration = session.session_end
          ? new Date(session.session_end).getTime() -
            new Date(session.session_start).getTime()
          : null

        sessionDetails.push({
          ...session,
          isActive,
          duration,
          totalMetrics: sessionMetrics.length,
          uniqueScreens,
          performanceScore,
          riskLevel,
          healthIndicators,
        })
      } catch (sessionError) {
        console.warn(`Error processing session ${session.id}:`, sessionError)
        // Continue with other sessions
      }
    }

    return sessionDetails
  } catch (error) {
    console.error("Error getting session data for analysis:", error)
    return []
  }
}

/**
 * Calculate overall data quality score for the dashboard
 */
function calculateDataQualityScore(
  routeData: RoutePerformanceAnalysis,
  sessionData: SessionDetails[],
  journeyPatterns: JourneyPattern[]
): number {
  let score = 0
  let maxScore = 0

  // Route data quality (30 points)
  maxScore += 30
  if (routeData.routes && routeData.routes.length > 0) {
    const routeScore = Math.min(30, (routeData.routes.length / 10) * 30)
    const sessionScore = Math.min(
      30,
      ((routeData.summary?.totalSessions || 0) / 50) * 30
    )
    score += Math.max(routeScore, sessionScore) // Take the better of the two
  }

  // Session data quality (40 points)
  maxScore += 40
  if (sessionData.length > 0) {
    const sessionCountScore = Math.min(20, (sessionData.length / 100) * 20)
    const sessionQualityScore = Math.min(
      20,
      (sessionData.filter(s => s.totalMetrics > 5).length /
        sessionData.length) *
        20
    )
    score += sessionCountScore + sessionQualityScore
  }

  // Journey pattern quality (30 points)
  maxScore += 30
  if (journeyPatterns.length > 0) {
    const patternScore = Math.min(15, (journeyPatterns.length / 5) * 15)
    const completionScore = Math.min(
      15,
      (journeyPatterns.filter(p => p.completion_rate > 0.5).length /
        Math.max(journeyPatterns.length, 1)) *
        15
    )
    score += patternScore + completionScore
  }

  return Math.round((score / maxScore) * 100)
}

/**
 * Export dashboard data as JSON
 */
export async function exportRouteAnalytics(
  format: "json" | "csv" = "json"
): Promise<string> {
  const dashboardData = await getEnhancedRouteAnalytics()

  if (format === "json") {
    return JSON.stringify(
      {
        ...dashboardData,
        export_timestamp: new Date().toISOString(),
        export_format: "json",
        export_version: "1.0",
      },
      null,
      2
    )
  }

  // CSV export for tabular data
  if (format === "csv") {
    return generateCSVExport(dashboardData)
  }

  // Fallback to JSON
  return JSON.stringify(dashboardData, null, 2)
}

/**
 * Generate CSV export from dashboard data
 */
function generateCSVExport(data: RouteAnalyticsDashboard): string {
  const csvSections: string[] = []

  // Route Performance Summary
  if (
    data.route_performance.routes &&
    data.route_performance.routes.length > 0
  ) {
    csvSections.push("Route Performance Summary")
    csvSections.push(
      "Route,Sessions,Devices,Avg FPS,Avg Memory,Avg CPU,Performance Score,Risk Level,Trend"
    )

    data.route_performance.routes.forEach(route => {
      csvSections.push(
        `"${route.routeName}",${route.totalSessions},${route.uniqueDevices},${route.avgFps.toFixed(1)},${route.avgMemory.toFixed(1)},${route.avgCpu.toFixed(1)},${route.performanceScore},${route.riskLevel},${route.performanceTrend}`
      )
    })
    csvSections.push("")
  }

  // Journey Patterns
  if (data.journey_patterns.length > 0) {
    csvSections.push("Journey Patterns")
    csvSections.push(
      "Pattern ID,Routes,Completion Rate,Avg Duration,Impact Score,Optimization Potential"
    )

    data.journey_patterns.forEach(pattern => {
      csvSections.push(
        `"${pattern.pattern_id}","${pattern.route_sequence.join(" → ")}",${(pattern.completion_rate * 100).toFixed(1)}%,${Math.round(pattern.avg_journey_duration / 1000)}s,${pattern.user_impact_score.toFixed(1)},${pattern.optimization_potential.toFixed(1)}%`
      )
    })
    csvSections.push("")
  }

  // Performance Predictions
  if (data.performance_predictions.length > 0) {
    csvSections.push("Performance Predictions")
    csvSections.push(
      "Route,Predicted Score,Confidence Min,Confidence Max,Horizon,Trend,Priority,Accuracy"
    )

    data.performance_predictions.forEach(prediction => {
      csvSections.push(
        `"${prediction.route_pattern}",${Math.round(prediction.predicted_performance_score)},${Math.round(prediction.confidence_interval[0])},${Math.round(prediction.confidence_interval[1])},${prediction.prediction_horizon},${prediction.trend_direction},${prediction.recommendation_priority},${(prediction.forecast_accuracy * 100).toFixed(1)}%`
      )
    })
    csvSections.push("")
  }

  // Correlation Analysis
  if (data.correlation_analysis.length > 0) {
    csvSections.push("Route Correlations")
    csvSections.push(
      "Source Route,Target Route,Correlation Strength,Impact,Confidence,Significance"
    )

    data.correlation_analysis.forEach(correlation => {
      csvSections.push(
        `"${correlation.source_route}","${correlation.target_route}",${correlation.correlation_strength.toFixed(3)},${correlation.performance_impact},${correlation.confidence_level.toFixed(3)},${correlation.statistical_significance.toFixed(3)}`
      )
    })
    csvSections.push("")
  }

  // Metadata
  csvSections.push("Export Metadata")
  csvSections.push(
    "Generated At,Processing Time (ms),Data Quality Score,Sessions Analyzed,Routes Analyzed"
  )
  csvSections.push(
    `"${data.processing_metadata.generated_at}",${data.processing_metadata.processing_time_ms},${data.processing_metadata.data_quality_score},${data.processing_metadata.sessions_analyzed},${data.processing_metadata.routes_analyzed}`
  )

  return csvSections.join("\n")
}

/**
 * Get dashboard metadata without full data processing (for quick status checks)
 */
export async function getDashboardMetadata(): Promise<{
  last_updated: string
  data_freshness: "fresh" | "stale" | "unavailable"
  processing_status: "ready" | "processing" | "error"
  estimated_quality_score: number
}> {
  try {
    const supabase = createClient()

    // Quick check of data availability
    const [routeDataCheck, sessionDataCheck] = await Promise.all([
      supabase.from("screen_time").select("id").limit(1),
      supabase.from("performance_sessions").select("id").limit(1),
    ])

    const hasRouteData = (routeDataCheck.data?.length || 0) > 0
    const hasSessionData = (sessionDataCheck.data?.length || 0) > 0

    let estimatedQuality = 0
    if (hasRouteData) estimatedQuality += 50
    if (hasSessionData) estimatedQuality += 50

    const dataFreshness: "fresh" | "stale" | "unavailable" =
      hasRouteData && hasSessionData
        ? "fresh"
        : hasRouteData || hasSessionData
          ? "stale"
          : "unavailable"

    return {
      last_updated: new Date().toISOString(),
      data_freshness: dataFreshness,
      processing_status: "ready",
      estimated_quality_score: estimatedQuality,
    }
  } catch (error) {
    console.error("Error getting dashboard metadata:", error)
    return {
      last_updated: new Date().toISOString(),
      data_freshness: "unavailable",
      processing_status: "error",
      estimated_quality_score: 0,
    }
  }
}
