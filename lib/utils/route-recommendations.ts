import {
  RoutePerformanceData,
  RoutePerformanceAnalysis,
} from "@/types/route-performance"
import { DeviceRouteCompatibility } from "@/types/insights"

export interface RouteOptimizationAnalysis {
  route_pattern: string
  preloading_opportunity: boolean
  caching_potential: "high" | "medium" | "low"
  device_compatibility_issues: DeviceRouteCompatibility[]
  performance_budget_status: "exceeded" | "approaching" | "within_budget"
  optimization_recommendations: RouteOptimizationRecommendation[]
}

export interface RouteOptimizationRecommendation {
  type: "preloading" | "caching" | "device_optimization" | "performance_budget"
  priority: "high" | "medium" | "low"
  description: string
  estimated_impact: string
  implementation_complexity: "simple" | "moderate" | "complex"
}

/**
 * Analyze route performance data to identify optimization opportunities
 */
export function analyzeRouteOptimizationOpportunities(
  routeData: RoutePerformanceAnalysis
): RouteOptimizationAnalysis[] {
  const analyses: RouteOptimizationAnalysis[] = []

  for (const route of routeData.routes) {
    const analysis: RouteOptimizationAnalysis = {
      route_pattern: route.routePattern,
      preloading_opportunity: identifyPreloadingOpportunities(route),
      caching_potential: assessCachingPotential(route),
      device_compatibility_issues: assessDeviceRouteCompatibility(route),
      performance_budget_status: calculatePerformanceBudgetStatus(route, 5000), // 5 second budget
      optimization_recommendations: [],
    }

    // Generate specific optimization recommendations
    analysis.optimization_recommendations =
      generateRouteNavigationRecommendations(analysis)

    analyses.push(analysis)
  }

  return analyses
}

/**
 * Identify if a route would benefit from preloading
 */
export function identifyPreloadingOpportunities(
  route: RoutePerformanceData
): boolean {
  // Routes with long load times (>3 seconds) benefit from preloading
  const avgScreenDuration =
    route.sessions.reduce(
      (sum, session) => sum + (session.screenDuration || 0),
      0
    ) / route.sessions.length

  // Also consider routes with high session count
  const isHighTraffic = route.totalSessions > 20
  const isSlowLoading = avgScreenDuration > 3000

  return isSlowLoading || (isHighTraffic && avgScreenDuration > 2000)
}

/**
 * Assess caching potential for a route
 */
export function assessCachingPotential(
  route: RoutePerformanceData
): "high" | "medium" | "low" {
  const sessionsPerDevice = route.totalSessions / route.uniqueDevices
  const avgMemoryUsage = route.avgMemory

  // High traffic routes with moderate memory usage benefit most from caching
  if (route.totalSessions > 50 && sessionsPerDevice > 2) {
    return "high"
  }

  if (route.totalSessions > 20 && avgMemoryUsage < 400) {
    return "medium"
  }

  return "low"
}

/**
 * Assess device-route compatibility issues
 */
export function assessDeviceRouteCompatibility(
  route: RoutePerformanceData
): DeviceRouteCompatibility[] {
  const compatibilityIssues: DeviceRouteCompatibility[] = []

  // Analyze performance by device tier (simplified logic based on performance metrics)
  const deviceTiers: ("high_end" | "mid_range" | "low_end")[] = [
    "high_end",
    "mid_range",
    "low_end",
  ]

  deviceTiers.forEach((tier, index) => {
    // Simulate device tier analysis based on performance metrics
    // In real implementation, this would analyze actual device data
    let performanceScore = 80

    // Lower-end devices typically have worse performance
    if (tier === "low_end") {
      performanceScore = Math.max(30, route.performanceScore - 30)
    } else if (tier === "mid_range") {
      performanceScore = Math.max(50, route.performanceScore - 15)
    }

    // High memory usage impacts lower-end devices more
    if (route.avgMemory > 500) {
      if (tier === "low_end") performanceScore -= 25
      if (tier === "mid_range") performanceScore -= 10
    }

    // Low FPS impacts all devices but more severely on lower-end
    if (route.avgFps < 45) {
      if (tier === "low_end") performanceScore -= 20
      if (tier === "mid_range") performanceScore -= 10
      if (tier === "high_end") performanceScore -= 5
    }

    if (performanceScore < 60) {
      compatibilityIssues.push({
        device_tier: tier,
        route_pattern: route.routePattern,
        performance_score: performanceScore,
        optimization_priority: 100 - performanceScore, // Higher priority for worse performance
      })
    }
  })

  return compatibilityIssues
}

/**
 * Calculate performance budget status for a route
 */
export function calculatePerformanceBudgetStatus(
  route: RoutePerformanceData,
  budgetThreshold: number
): "exceeded" | "approaching" | "within_budget" {
  const avgScreenDuration =
    route.sessions.reduce(
      (sum, session) => sum + (session.screenDuration || 0),
      0
    ) / route.sessions.length

  if (avgScreenDuration > budgetThreshold) {
    return "exceeded"
  }

  if (avgScreenDuration > budgetThreshold * 0.8) {
    return "approaching"
  }

  return "within_budget"
}

/**
 * Generate route-specific navigation recommendations
 */
export function generateRouteNavigationRecommendations(
  routeAnalysis: RouteOptimizationAnalysis
): RouteOptimizationRecommendation[] {
  const recommendations: RouteOptimizationRecommendation[] = []

  // Preloading recommendations
  if (routeAnalysis.preloading_opportunity) {
    recommendations.push({
      type: "preloading",
      priority: "high",
      description: "Implement route preloading to reduce perceived load time",
      estimated_impact: "30-50% reduction in perceived load time",
      implementation_complexity: "moderate",
    })
  }

  // Caching recommendations
  if (routeAnalysis.caching_potential === "high") {
    recommendations.push({
      type: "caching",
      priority: "medium",
      description:
        "Implement aggressive caching strategy for high-traffic route",
      estimated_impact: "20-35% performance improvement for repeat visits",
      implementation_complexity: "simple",
    })
  } else if (routeAnalysis.caching_potential === "medium") {
    recommendations.push({
      type: "caching",
      priority: "low",
      description: "Consider selective caching for route components",
      estimated_impact: "10-20% performance improvement for repeat visits",
      implementation_complexity: "simple",
    })
  }

  // Device compatibility recommendations
  if (routeAnalysis.device_compatibility_issues.length > 0) {
    const hasLowEndIssues = routeAnalysis.device_compatibility_issues.some(
      issue => issue.device_tier === "low_end"
    )

    recommendations.push({
      type: "device_optimization",
      priority: hasLowEndIssues ? "high" : "medium",
      description: "Optimize route for device compatibility issues",
      estimated_impact: "40-60% improvement for affected device tiers",
      implementation_complexity: "moderate",
    })
  }

  // Performance budget recommendations
  if (routeAnalysis.performance_budget_status === "exceeded") {
    recommendations.push({
      type: "performance_budget",
      priority: "high",
      description:
        "Route exceeds performance budget - immediate optimization required",
      estimated_impact: "Restore within performance budget",
      implementation_complexity: "moderate",
    })
  } else if (routeAnalysis.performance_budget_status === "approaching") {
    recommendations.push({
      type: "performance_budget",
      priority: "medium",
      description:
        "Route approaching performance budget - preventive optimization recommended",
      estimated_impact: "Maintain within performance budget",
      implementation_complexity: "simple",
    })
  }

  return recommendations
}

/**
 * Helper function to categorize routes by performance characteristics
 */
export function categorizeRoutesByPerformance(routes: RoutePerformanceData[]): {
  heavyRoutes: RoutePerformanceData[]
  normalRoutes: RoutePerformanceData[]
  lightRoutes: RoutePerformanceData[]
} {
  const heavyRoutes: RoutePerformanceData[] = []
  const normalRoutes: RoutePerformanceData[] = []
  const lightRoutes: RoutePerformanceData[] = []

  routes.forEach(route => {
    const avgScreenDuration =
      route.sessions.reduce(
        (sum, session) => sum + (session.screenDuration || 0),
        0
      ) / route.sessions.length

    if (avgScreenDuration > 4000 || route.avgMemory > 500) {
      heavyRoutes.push(route)
    } else if (avgScreenDuration > 2000 || route.avgMemory > 300) {
      normalRoutes.push(route)
    } else {
      lightRoutes.push(route)
    }
  })

  return { heavyRoutes, normalRoutes, lightRoutes }
}

/**
 * Calculate route optimization impact score
 */
export function calculateRouteOptimizationImpactScore(
  route: RoutePerformanceData,
  optimizationType:
    | "preloading"
    | "caching"
    | "device_optimization"
    | "performance_budget"
): number {
  let impactScore = 0

  switch (optimizationType) {
    case "preloading":
      // Higher impact for slower routes and high-traffic routes
      const avgScreenDuration =
        route.sessions.reduce(
          (sum, session) => sum + (session.screenDuration || 0),
          0
        ) / route.sessions.length
      impactScore = Math.min(
        100,
        (avgScreenDuration / 1000) * route.totalSessions * 0.1
      )
      break

    case "caching":
      // Higher impact for routes with repeat visits
      const sessionsPerDevice = route.totalSessions / route.uniqueDevices
      impactScore = Math.min(100, sessionsPerDevice * 20)
      break

    case "device_optimization":
      // Higher impact for routes with poor device compatibility
      impactScore = route.avgFps < 45 || route.avgMemory > 500 ? 80 : 40
      break

    case "performance_budget":
      // Higher impact for routes significantly exceeding budget
      const avgDuration =
        route.sessions.reduce(
          (sum, session) => sum + (session.screenDuration || 0),
          0
        ) / route.sessions.length
      impactScore = avgDuration > 5000 ? 90 : avgDuration > 3000 ? 60 : 30
      break
  }

  return Math.max(0, Math.min(100, impactScore))
}
