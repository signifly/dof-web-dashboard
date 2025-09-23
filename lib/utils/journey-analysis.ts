import {
  UserJourney,
  JourneyPattern,
  JourneyAbandonmentPattern,
  JourneyPerformanceRegression,
} from "@/types/user-journey"

/**
 * Analyze user journey abandonment patterns to identify where users commonly drop off
 */
export function analyzeJourneyAbandonmentPatterns(
  journeys: UserJourney[]
): JourneyAbandonmentPattern[] {
  const abandonedJourneys = journeys.filter(
    j => j.completion_status === "abandoned"
  )
  const abandonmentPoints = new Map<
    string,
    {
      count: number
      times: number[]
      precedingRoutes: string[][]
    }
  >()

  abandonedJourneys.forEach(journey => {
    if (journey.route_sequence.length > 0) {
      const lastRoute =
        journey.route_sequence[journey.route_sequence.length - 1]
      const abandonmentPoint = lastRoute.route_pattern

      if (!abandonmentPoints.has(abandonmentPoint)) {
        abandonmentPoints.set(abandonmentPoint, {
          count: 0,
          times: [],
          precedingRoutes: [],
        })
      }

      const data = abandonmentPoints.get(abandonmentPoint)!
      data.count++
      data.times.push(journey.journey_duration)
      data.precedingRoutes.push(
        journey.route_sequence.slice(0, -1).map(r => r.route_pattern)
      )
    }
  })

  return Array.from(abandonmentPoints.entries())
    .map(([point, data]) => ({
      abandonment_point: point,
      frequency: data.count,
      avg_time_to_abandonment:
        data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
      common_preceding_routes: findCommonRoutes(data.precedingRoutes),
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

/**
 * Identify high-value journey paths that have good completion rates and frequency
 */
export function identifyHighValueJourneyPaths(
  patterns: JourneyPattern[]
): JourneyPattern[] {
  return patterns
    .filter(pattern => pattern.completion_rate > 0.7 && pattern.frequency >= 5)
    .sort(
      (a, b) =>
        b.completion_rate * b.frequency - a.completion_rate * a.frequency
    )
}

/**
 * Detect performance regressions in user journeys by comparing current vs historical data
 */
export function detectJourneyPerformanceRegression(
  currentJourneys: UserJourney[],
  historicalJourneys: UserJourney[]
): JourneyPerformanceRegression[] {
  const regressions: JourneyPerformanceRegression[] = []

  const currentRoutePerformance =
    calculateRoutePerformanceFromJourneys(currentJourneys)
  const historicalRoutePerformance =
    calculateRoutePerformanceFromJourneys(historicalJourneys)

  currentRoutePerformance.forEach((currentPerf, route) => {
    const historicalPerf = historicalRoutePerformance.get(route)
    if (
      historicalPerf &&
      currentPerf.sampleSize >= 3 &&
      historicalPerf.sampleSize >= 3
    ) {
      const performanceChange = currentPerf.avgScore - historicalPerf.avgScore

      if (Math.abs(performanceChange) > 5) {
        let significance: "high" | "medium" | "low" = "low"
        if (Math.abs(performanceChange) > 20) significance = "high"
        else if (Math.abs(performanceChange) > 10) significance = "medium"

        regressions.push({
          route_pattern: route,
          performance_change: performanceChange,
          significance,
          sample_size: currentPerf.sampleSize,
        })
      }
    }
  })

  return regressions.sort(
    (a, b) => Math.abs(b.performance_change) - Math.abs(a.performance_change)
  )
}

/**
 * Analyze journey completion rates by route sequence length
 */
export function analyzeCompletionRatesByLength(journeys: UserJourney[]): Array<{
  sequence_length: number
  total_journeys: number
  completion_rate: number
  avg_performance_score: number
}> {
  const lengthGroups = new Map<number, UserJourney[]>()

  journeys.forEach(journey => {
    const length = journey.route_sequence.length
    if (!lengthGroups.has(length)) {
      lengthGroups.set(length, [])
    }
    lengthGroups.get(length)!.push(journey)
  })

  return Array.from(lengthGroups.entries())
    .map(([length, journeys]) => {
      const completedJourneys = journeys.filter(
        j => j.completion_status === "completed"
      )
      const avgScore =
        journeys.reduce((sum, j) => sum + j.journey_score, 0) / journeys.length

      return {
        sequence_length: length,
        total_journeys: journeys.length,
        completion_rate: completedJourneys.length / journeys.length,
        avg_performance_score: avgScore,
      }
    })
    .sort((a, b) => a.sequence_length - b.sequence_length)
}

/**
 * Identify routes that consistently cause journey abandonment
 */
export function identifyProblematicRoutes(journeys: UserJourney[]): Array<{
  route_pattern: string
  abandonment_correlation: number
  frequency_in_abandoned_journeys: number
  avg_performance_impact: number
}> {
  const abandonedJourneys = journeys.filter(
    j => j.completion_status === "abandoned"
  )
  const completedJourneys = journeys.filter(
    j => j.completion_status === "completed"
  )

  const routeAbandonmentStats = new Map<
    string,
    {
      abandonedCount: number
      completedCount: number
      totalPerformanceImpact: number
    }
  >()

  // Collect stats for abandoned journeys
  abandonedJourneys.forEach(journey => {
    journey.route_sequence.forEach(route => {
      const pattern = route.route_pattern
      if (!routeAbandonmentStats.has(pattern)) {
        routeAbandonmentStats.set(pattern, {
          abandonedCount: 0,
          completedCount: 0,
          totalPerformanceImpact: 0,
        })
      }
      const stats = routeAbandonmentStats.get(pattern)!
      stats.abandonedCount++

      // Calculate performance impact (lower is worse)
      const performanceImpact = 100 - calculateRoutePerformanceScore(route)
      stats.totalPerformanceImpact += performanceImpact
    })
  })

  // Collect stats for completed journeys
  completedJourneys.forEach(journey => {
    journey.route_sequence.forEach(route => {
      const pattern = route.route_pattern
      if (!routeAbandonmentStats.has(pattern)) {
        routeAbandonmentStats.set(pattern, {
          abandonedCount: 0,
          completedCount: 0,
          totalPerformanceImpact: 0,
        })
      }
      routeAbandonmentStats.get(pattern)!.completedCount++
    })
  })

  return Array.from(routeAbandonmentStats.entries())
    .map(([route, stats]) => {
      const totalOccurrences = stats.abandonedCount + stats.completedCount
      const abandonmentCorrelation =
        totalOccurrences > 0 ? stats.abandonedCount / totalOccurrences : 0
      const avgPerformanceImpact =
        stats.abandonedCount > 0
          ? stats.totalPerformanceImpact / stats.abandonedCount
          : 0

      return {
        route_pattern: route,
        abandonment_correlation: abandonmentCorrelation,
        frequency_in_abandoned_journeys: stats.abandonedCount,
        avg_performance_impact: avgPerformanceImpact,
      }
    })
    .filter(
      route =>
        route.frequency_in_abandoned_journeys >= 3 &&
        route.abandonment_correlation > 0.3
    )
    .sort((a, b) => b.abandonment_correlation - a.abandonment_correlation)
}

/**
 * Calculate journey flow efficiency metrics
 */
export function calculateJourneyFlowEfficiency(journeys: UserJourney[]): {
  avg_journey_duration: number
  avg_routes_per_journey: number
  avg_time_per_route: number
  efficiency_score: number
  bottleneck_frequency: number
} {
  if (journeys.length === 0) {
    return {
      avg_journey_duration: 0,
      avg_routes_per_journey: 0,
      avg_time_per_route: 0,
      efficiency_score: 0,
      bottleneck_frequency: 0,
    }
  }

  const totalDuration = journeys.reduce((sum, j) => sum + j.journey_duration, 0)
  const totalRoutes = journeys.reduce(
    (sum, j) => sum + j.route_sequence.length,
    0
  )
  const totalBottlenecks = journeys.reduce(
    (sum, j) => sum + j.bottleneck_points.length,
    0
  )

  const avgDuration = totalDuration / journeys.length
  const avgRoutesPerJourney = totalRoutes / journeys.length
  const avgTimePerRoute =
    avgRoutesPerJourney > 0 ? avgDuration / avgRoutesPerJourney : 0
  const bottleneckFrequency = totalBottlenecks / journeys.length

  // Calculate efficiency score (lower time per route = higher efficiency)
  const baselineTimePerRoute = 30000 // 30 seconds baseline
  const efficiencyScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        ((avgTimePerRoute - baselineTimePerRoute) / baselineTimePerRoute) * 100
    )
  )

  return {
    avg_journey_duration: avgDuration,
    avg_routes_per_journey: avgRoutesPerJourney,
    avg_time_per_route: avgTimePerRoute,
    efficiency_score: efficiencyScore,
    bottleneck_frequency: bottleneckFrequency,
  }
}

/**
 * Analyze user journey patterns by device type
 */
export function analyzeJourneyPatternsByDevice(journeys: UserJourney[]): Array<{
  device_type: string
  total_journeys: number
  avg_completion_rate: number
  avg_performance_score: number
  common_bottlenecks: string[]
}> {
  const deviceGroups = new Map<string, UserJourney[]>()

  journeys.forEach(journey => {
    const deviceType = journey.device_id || "unknown"
    if (!deviceGroups.has(deviceType)) {
      deviceGroups.set(deviceType, [])
    }
    deviceGroups.get(deviceType)!.push(journey)
  })

  return Array.from(deviceGroups.entries())
    .map(([deviceType, deviceJourneys]) => {
      const completedJourneys = deviceJourneys.filter(
        j => j.completion_status === "completed"
      )
      const avgScore =
        deviceJourneys.reduce((sum, j) => sum + j.journey_score, 0) /
        deviceJourneys.length

      // Find common bottlenecks for this device type
      const allBottlenecks = deviceJourneys.flatMap(j => j.bottleneck_points)
      const bottleneckCounts = new Map<string, number>()

      allBottlenecks.forEach(bottleneck => {
        const route = bottleneck.route_pattern
        bottleneckCounts.set(route, (bottleneckCounts.get(route) || 0) + 1)
      })

      const commonBottlenecks = Array.from(bottleneckCounts.entries())
        .filter(
          ([_, count]) => count >= Math.max(2, deviceJourneys.length * 0.2)
        )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([route, _]) => route)

      return {
        device_type: deviceType,
        total_journeys: deviceJourneys.length,
        avg_completion_rate: completedJourneys.length / deviceJourneys.length,
        avg_performance_score: avgScore,
        common_bottlenecks: commonBottlenecks,
      }
    })
    .sort((a, b) => b.total_journeys - a.total_journeys)
}

// Helper functions

function findCommonRoutes(routeLists: string[][]): string[] {
  const routeCounts = new Map<string, number>()

  routeLists.forEach(routes => {
    routes.forEach(route => {
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1)
    })
  })

  const threshold = Math.max(2, routeLists.length * 0.3)
  return Array.from(routeCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 common routes
    .map(([route, _]) => route)
}

function calculateRoutePerformanceFromJourneys(journeys: UserJourney[]): Map<
  string,
  {
    avgScore: number
    sampleSize: number
  }
> {
  const routePerformance = new Map<
    string,
    { scores: number[]; count: number }
  >()

  journeys.forEach(journey => {
    journey.route_sequence.forEach(routeVisit => {
      const route = routeVisit.route_pattern
      const score = calculateRoutePerformanceScore(routeVisit)

      if (!routePerformance.has(route)) {
        routePerformance.set(route, { scores: [], count: 0 })
      }

      const data = routePerformance.get(route)!
      data.scores.push(score)
      data.count++
    })
  })

  const result = new Map<string, { avgScore: number; sampleSize: number }>()
  routePerformance.forEach((data, route) => {
    const avgScore =
      data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
    result.set(route, { avgScore, sampleSize: data.count })
  })

  return result
}

function calculateRoutePerformanceScore(routeVisit: {
  performance_metrics: {
    avg_fps: number
    avg_memory: number
    avg_cpu: number
    avg_load_time: number
  }
}): number {
  const { avg_fps, avg_memory, avg_cpu, avg_load_time } =
    routeVisit.performance_metrics

  const fpsScore = Math.min(100, (avg_fps / 60) * 100)
  const memoryScore = Math.max(0, 100 - (avg_memory / 1000) * 100)
  const cpuScore = Math.max(0, 100 - avg_cpu)
  const loadTimeScore = Math.max(0, 100 - (avg_load_time / 5000) * 100) // 5s baseline

  return (fpsScore + memoryScore + cpuScore + loadTimeScore) / 4
}
