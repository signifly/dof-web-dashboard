import {
  UserJourney,
  RouteVisit,
  PerformancePoint,
  BottleneckPoint,
  JourneyPattern,
} from "@/types/user-journey"
import { Database } from "@/types/database"
import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"
import { createClient } from "@/lib/supabase/server"

export class UserJourneyTracker {
  /**
   * Reconstruct user journeys from session data
   * Target: Handle 1000+ sessions efficiently
   */
  async reconstructJourneys(
    timeWindowHours: number = 24
  ): Promise<UserJourney[]> {
    const sessions = await this.getSessionsForJourneyAnalysis()
    const journeys: UserJourney[] = []

    // Group sessions by anonymous_user_id
    const userSessions = this.groupSessionsByUser(sessions)

    for (const [userId, userSessionList] of Array.from(
      userSessions.entries()
    )) {
      const userJourneys = await this.createJourneysForUser(
        userId,
        userSessionList,
        timeWindowHours
      )
      journeys.push(...userJourneys)
    }

    return journeys.sort(
      (a, b) =>
        new Date(b.journey_start).getTime() -
        new Date(a.journey_start).getTime()
    )
  }

  /**
   * Analyze journey patterns to identify common user paths
   */
  async analyzeJourneyPatterns(
    journeys: UserJourney[]
  ): Promise<JourneyPattern[]> {
    const patterns: JourneyPattern[] = []

    // Group journeys by route sequence pattern
    const patternGroups = this.groupJourneysByPattern(journeys)

    for (const [patternKey, journeyGroup] of Array.from(
      patternGroups.entries()
    )) {
      const pattern = await this.analyzePatternGroup(patternKey, journeyGroup)
      patterns.push(pattern)
    }

    return patterns.sort((a, b) => b.user_impact_score - a.user_impact_score)
  }

  /**
   * Detect bottlenecks within user journeys
   */
  async detectJourneyBottlenecks(
    journey: UserJourney
  ): Promise<BottleneckPoint[]> {
    const bottlenecks: BottleneckPoint[] = []

    // Analyze performance trajectory for significant drops
    for (let i = 1; i < journey.performance_trajectory.length; i++) {
      const current = journey.performance_trajectory[i]
      const previous = journey.performance_trajectory[i - 1]

      const bottleneck = this.analyzePerformanceTransition(previous, current)
      if (bottleneck) {
        bottlenecks.push(bottleneck)
      }
    }

    // Analyze route visit durations for outliers
    const durationBottlenecks = this.analyzeDurationBottlenecks(
      journey.route_sequence
    )
    bottlenecks.push(...durationBottlenecks)

    return bottlenecks.sort((a, b) => b.impact_score - a.impact_score)
  }

  /**
   * Calculate overall journey performance score
   */
  async calculateJourneyScore(journey: UserJourney): Promise<number> {
    if (journey.performance_trajectory.length === 0) return 50

    // Calculate weighted performance score
    const performanceScores = journey.performance_trajectory.map(point => {
      const fpsScore = Math.min(100, (point.fps / 60) * 100)
      const memoryScore = Math.max(0, 100 - (point.memory_usage / 1000) * 100)
      const cpuScore = Math.max(0, 100 - point.cpu_usage)

      return (fpsScore + memoryScore + cpuScore) / 3
    })

    const avgPerformance =
      performanceScores.reduce((sum, score) => sum + score, 0) /
      performanceScores.length

    // Apply completion bonus/penalty
    let completionMultiplier = 1.0
    if (journey.completion_status === "completed") {
      completionMultiplier = 1.1 // 10% bonus for completion
    } else if (journey.completion_status === "abandoned") {
      completionMultiplier = 0.8 // 20% penalty for abandonment
    }

    // Apply bottleneck penalty
    const bottleneckPenalty = Math.min(20, journey.bottleneck_points.length * 5)

    return Math.max(
      0,
      Math.min(100, avgPerformance * completionMultiplier - bottleneckPenalty)
    )
  }

  /**
   * Get session data for journey analysis
   */
  private async getSessionsForJourneyAnalysis(): Promise<PerformanceSession[]> {
    const supabase = createClient()

    try {
      // Get sessions from the last 7 days for analysis
      const { data: sessions, error } = await supabase
        .from("performance_sessions")
        .select("*")
        .gte(
          "session_start",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("session_start", { ascending: false })
        .limit(1000) // Limit for performance

      if (error) {
        console.error("Error fetching sessions for journey analysis:", error)
        return []
      }

      return sessions || []
    } catch (error) {
      console.error("Error in getSessionsForJourneyAnalysis:", error)
      return []
    }
  }

  /**
   * Get metrics for a specific session
   */
  private async getSessionMetrics(
    sessionId: string
  ): Promise<PerformanceMetric[]> {
    const supabase = createClient()

    try {
      const { data: metrics, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true })

      if (error) {
        console.error("Error fetching session metrics:", error)
        return []
      }

      return metrics || []
    } catch (error) {
      console.error("Error in getSessionMetrics:", error)
      return []
    }
  }

  private groupSessionsByUser(
    sessions: PerformanceSession[]
  ): Map<string, PerformanceSession[]> {
    const userSessions = new Map<string, PerformanceSession[]>()

    sessions.forEach(session => {
      if (!userSessions.has(session.anonymous_user_id)) {
        userSessions.set(session.anonymous_user_id, [])
      }
      userSessions.get(session.anonymous_user_id)!.push(session)
    })

    return userSessions
  }

  private async createJourneysForUser(
    userId: string,
    sessions: PerformanceSession[],
    timeWindowHours: number
  ): Promise<UserJourney[]> {
    const journeys: UserJourney[] = []

    // Sort sessions by start time
    const sortedSessions = sessions.sort(
      (a, b) =>
        new Date(a.session_start).getTime() -
        new Date(b.session_start).getTime()
    )

    let currentJourney: UserJourney | null = null

    for (const session of sortedSessions) {
      if (!currentJourney) {
        // Start new journey
        currentJourney = await this.initializeJourney(userId, session)
      } else {
        // Check if session should be part of current journey
        const timeDiff =
          new Date(session.session_start).getTime() -
          new Date(currentJourney.journey_start).getTime()

        if (timeDiff <= timeWindowHours * 60 * 60 * 1000) {
          // Add to current journey
          await this.addSessionToJourney(currentJourney, session)
        } else {
          // Complete current journey and start new one
          await this.finalizeJourney(currentJourney)
          journeys.push(currentJourney)
          currentJourney = await this.initializeJourney(userId, session)
        }
      }
    }

    // Add final journey
    if (currentJourney) {
      await this.finalizeJourney(currentJourney)
      journeys.push(currentJourney)
    }

    return journeys
  }

  private async initializeJourney(
    userId: string,
    session: PerformanceSession
  ): Promise<UserJourney> {
    const routeVisits = await this.extractRouteVisits(session)
    const performanceTrajectory =
      await this.extractPerformanceTrajectory(session)

    return {
      journey_id: `journey_${userId}_${Date.now()}`,
      session_id: session.id,
      device_id: session.device_type, // Using device_type as device_id
      anonymous_user_id: userId,
      route_sequence: routeVisits,
      journey_duration: 0, // Will be calculated when finalized
      performance_trajectory: performanceTrajectory,
      bottleneck_points: [],
      journey_score: 0, // Will be calculated when finalized
      completion_status: "in_progress",
      journey_start: session.session_start,
      journey_end: null,
    }
  }

  private async addSessionToJourney(
    journey: UserJourney,
    session: PerformanceSession
  ): Promise<void> {
    const routeVisits = await this.extractRouteVisits(session)
    const performanceTrajectory =
      await this.extractPerformanceTrajectory(session)

    journey.route_sequence.push(...routeVisits)
    journey.performance_trajectory.push(...performanceTrajectory)
  }

  private async finalizeJourney(journey: UserJourney): Promise<void> {
    if (journey.route_sequence.length > 0) {
      const lastRoute =
        journey.route_sequence[journey.route_sequence.length - 1]
      journey.journey_end =
        lastRoute.exit_timestamp || lastRoute.entry_timestamp

      journey.journey_duration =
        new Date(journey.journey_end!).getTime() -
        new Date(journey.journey_start).getTime()

      // Determine completion status
      journey.completion_status = this.determineCompletionStatus(journey)

      // Calculate journey score
      journey.journey_score = await this.calculateJourneyScore(journey)

      // Detect bottlenecks
      journey.bottleneck_points = await this.detectJourneyBottlenecks(journey)
    }
  }

  private determineCompletionStatus(
    journey: UserJourney
  ): "completed" | "abandoned" | "in_progress" {
    // Simple heuristic: if journey has >= 3 route visits and reasonable duration, consider completed
    if (
      journey.route_sequence.length >= 3 &&
      journey.journey_duration > 30000
    ) {
      return "completed"
    } else if (
      journey.route_sequence.length === 1 ||
      journey.journey_duration < 10000
    ) {
      return "abandoned"
    }
    return "in_progress"
  }

  private async extractRouteVisits(
    session: PerformanceSession
  ): Promise<RouteVisit[]> {
    const routeVisits: RouteVisit[] = []
    const metrics = await this.getSessionMetrics(session.id)

    // Group metrics by screen name to identify route visits
    const screenTimeMetrics = metrics.filter(
      m => m.metric_type === "screen_time"
    )
    const screenGroups = new Map<string, PerformanceMetric[]>()

    screenTimeMetrics.forEach(metric => {
      const screenName = (metric.context as any)?.screen_name || "unknown"
      if (!screenGroups.has(screenName)) {
        screenGroups.set(screenName, [])
      }
      screenGroups.get(screenName)!.push(metric)
    })

    // Convert screen groups to route visits
    const _sessionStart = new Date(session.session_start).getTime()
    let visitIndex = 0

    for (const [screenName, screenMetrics] of Array.from(
      screenGroups.entries()
    )) {
      const sortedMetrics = screenMetrics.sort(
        (
          a: Database["public"]["Tables"]["performance_metrics"]["Row"],
          b: Database["public"]["Tables"]["performance_metrics"]["Row"]
        ) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      if (sortedMetrics.length > 0) {
        const entryTime = sortedMetrics[0].timestamp
        const exitTime = sortedMetrics[sortedMetrics.length - 1].timestamp
        const duration =
          new Date(exitTime).getTime() - new Date(entryTime).getTime()

        // Calculate performance metrics for this route visit
        const performanceMetrics = this.calculateRoutePerformanceMetrics(
          metrics,
          screenName
        )

        routeVisits.push({
          route_pattern: `/${screenName.toLowerCase().replace(/\s+/g, "-")}`,
          route_name: screenName,
          entry_timestamp: entryTime,
          exit_timestamp: exitTime,
          duration: Math.max(1000, duration), // Minimum 1 second
          performance_metrics: performanceMetrics,
          transition_performance: {
            transition_time: visitIndex === 0 ? 0 : 1000, // Placeholder
            memory_spike: 0,
            cpu_spike: 0,
          },
        })
        visitIndex++
      }
    }

    return routeVisits.sort(
      (a, b) =>
        new Date(a.entry_timestamp).getTime() -
        new Date(b.entry_timestamp).getTime()
    )
  }

  private async extractPerformanceTrajectory(
    session: PerformanceSession
  ): Promise<PerformancePoint[]> {
    const trajectory: PerformancePoint[] = []
    const metrics = await this.getSessionMetrics(session.id)

    // Group metrics by timestamp (approximately)
    const timeGroups = new Map<string, Map<string, number>>()

    metrics.forEach(metric => {
      // Round timestamp to nearest minute for grouping
      const timeKey = new Date(
        Math.floor(new Date(metric.timestamp).getTime() / 60000) * 60000
      ).toISOString()

      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, new Map())
      }

      const metricGroup = timeGroups.get(timeKey)!
      metricGroup.set(metric.metric_type, metric.metric_value)
    })

    // Convert time groups to performance points
    for (const [timestamp, metricMap] of Array.from(timeGroups.entries())) {
      const screenName = this.getScreenNameFromMetrics(metrics, timestamp)

      trajectory.push({
        timestamp,
        fps: metricMap.get("fps") || 30,
        memory_usage: metricMap.get("memory_usage") || 200,
        cpu_usage: metricMap.get("cpu_usage") || 30,
        route_pattern: `/${screenName.toLowerCase().replace(/\s+/g, "-")}`,
      })
    }

    return trajectory.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  private calculateRoutePerformanceMetrics(
    allMetrics: PerformanceMetric[],
    screenName: string
  ): RouteVisit["performance_metrics"] {
    // Filter metrics for this screen
    const screenMetrics = allMetrics.filter(m => {
      const context = m.context as any
      return context?.screen_name === screenName
    })

    if (screenMetrics.length === 0) {
      return {
        avg_fps: 30,
        avg_memory: 200,
        avg_cpu: 30,
        avg_load_time: 2000,
      }
    }

    const fpsMetrics = screenMetrics.filter(m => m.metric_type === "fps")
    const memoryMetrics = screenMetrics.filter(
      m => m.metric_type === "memory_usage"
    )
    const loadTimeMetrics = screenMetrics.filter(
      m => m.metric_type === "load_time" || m.metric_type === "screen_load"
    )

    return {
      avg_fps: this.calculateAverage(
        fpsMetrics.map(m => m.metric_value),
        30
      ),
      avg_memory: this.calculateAverage(
        memoryMetrics.map(m => m.metric_value),
        200
      ),
      avg_cpu: 30, // Would be calculated using CPU inference
      avg_load_time: this.calculateAverage(
        loadTimeMetrics.map(m => m.metric_value),
        2000
      ),
    }
  }

  private calculateAverage(values: number[], defaultValue: number): number {
    if (values.length === 0) return defaultValue
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private getScreenNameFromMetrics(
    metrics: PerformanceMetric[],
    timestamp: string
  ): string {
    // Find the screen name closest to this timestamp
    const nearbyMetrics = metrics.filter(m => {
      const metricTime = new Date(m.timestamp).getTime()
      const targetTime = new Date(timestamp).getTime()
      return Math.abs(metricTime - targetTime) <= 120000 // Within 2 minutes
    })

    for (const metric of nearbyMetrics) {
      const context = metric.context as any
      if (context?.screen_name) {
        return context.screen_name
      }
    }

    return "unknown"
  }

  private groupJourneysByPattern(
    journeys: UserJourney[]
  ): Map<string, UserJourney[]> {
    const patternGroups = new Map<string, UserJourney[]>()

    journeys.forEach(journey => {
      const pattern = journey.route_sequence
        .map(route => route.route_pattern)
        .join(" -> ")

      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, [])
      }
      patternGroups.get(pattern)!.push(journey)
    })

    // Only return patterns that occur multiple times
    const filteredGroups = new Map<string, UserJourney[]>()
    patternGroups.forEach((journeys, pattern) => {
      if (journeys.length >= 2) {
        filteredGroups.set(pattern, journeys)
      }
    })

    return filteredGroups
  }

  private async analyzePatternGroup(
    patternKey: string,
    journeys: UserJourney[]
  ): Promise<JourneyPattern> {
    const routeSequence = patternKey.split(" -> ")

    const avgPerformanceScore =
      journeys.reduce((sum, journey) => sum + journey.journey_score, 0) /
      journeys.length
    const avgDuration =
      journeys.reduce((sum, journey) => sum + journey.journey_duration, 0) /
      journeys.length
    const completionRate =
      journeys.filter(j => j.completion_status === "completed").length /
      journeys.length

    // Identify common bottlenecks across journeys
    const allBottlenecks = journeys.flatMap(
      journey => journey.bottleneck_points
    )
    const bottleneckCounts = new Map<string, number>()

    allBottlenecks.forEach(bottleneck => {
      const key = bottleneck.route_pattern
      bottleneckCounts.set(key, (bottleneckCounts.get(key) || 0) + 1)
    })

    const commonBottlenecks = Array.from(bottleneckCounts.entries())
      .filter(([_, count]) => count >= Math.max(2, journeys.length * 0.3))
      .map(([route, _]) => route)

    return {
      pattern_id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      route_sequence: routeSequence,
      frequency: journeys.length,
      avg_performance_score: avgPerformanceScore,
      common_bottlenecks: commonBottlenecks,
      optimization_potential: this.calculateOptimizationPotential(journeys),
      user_impact_score: this.calculateUserImpactScore(journeys),
      avg_journey_duration: avgDuration,
      completion_rate: completionRate,
    }
  }

  private calculateOptimizationPotential(journeys: UserJourney[]): number {
    const bottleneckCount = journeys.reduce(
      (sum, journey) => sum + journey.bottleneck_points.length,
      0
    )
    const avgBottlenecks = bottleneckCount / journeys.length

    // Higher bottleneck count = higher optimization potential
    return Math.min(100, avgBottlenecks * 20)
  }

  private calculateUserImpactScore(journeys: UserJourney[]): number {
    const frequency = journeys.length
    const avgPerformance =
      journeys.reduce((sum, journey) => sum + journey.journey_score, 0) /
      journeys.length
    const abandonmentRate =
      journeys.filter(j => j.completion_status === "abandoned").length /
      journeys.length

    // Impact = frequency * performance issues * abandonment rate
    const performanceImpact = 100 - avgPerformance
    const frequencyWeight = Math.min(1, frequency / 20)
    const abandonmentWeight = abandonmentRate * 100

    return Math.round((performanceImpact + abandonmentWeight) * frequencyWeight)
  }

  private analyzePerformanceTransition(
    previous: PerformancePoint,
    current: PerformancePoint
  ): BottleneckPoint | null {
    const fpsDropPercent = ((previous.fps - current.fps) / previous.fps) * 100
    const memoryIncreasePercent =
      ((current.memory_usage - previous.memory_usage) / previous.memory_usage) *
      100
    const cpuIncreasePercent =
      ((current.cpu_usage - previous.cpu_usage) / previous.cpu_usage) * 100

    // Detect significant performance drops
    if (fpsDropPercent > 20) {
      return {
        route_pattern: current.route_pattern,
        timestamp: current.timestamp,
        bottleneck_type: "performance_drop",
        severity:
          fpsDropPercent > 40
            ? "critical"
            : fpsDropPercent > 30
              ? "high"
              : "medium",
        impact_score: fpsDropPercent,
        description: `FPS dropped by ${fpsDropPercent.toFixed(1)}% transitioning to ${current.route_pattern}`,
      }
    }

    if (memoryIncreasePercent > 50) {
      return {
        route_pattern: current.route_pattern,
        timestamp: current.timestamp,
        bottleneck_type: "memory_spike",
        severity: memoryIncreasePercent > 100 ? "critical" : "high",
        impact_score: memoryIncreasePercent,
        description: `Memory usage increased by ${memoryIncreasePercent.toFixed(1)}% at ${current.route_pattern}`,
      }
    }

    if (cpuIncreasePercent > 30) {
      return {
        route_pattern: current.route_pattern,
        timestamp: current.timestamp,
        bottleneck_type: "high_cpu",
        severity: cpuIncreasePercent > 60 ? "critical" : "high",
        impact_score: cpuIncreasePercent,
        description: `CPU usage increased by ${cpuIncreasePercent.toFixed(1)}% at ${current.route_pattern}`,
      }
    }

    return null
  }

  private analyzeDurationBottlenecks(
    routeVisits: RouteVisit[]
  ): BottleneckPoint[] {
    const bottlenecks: BottleneckPoint[] = []

    routeVisits.forEach(visit => {
      if (visit.duration > 30000) {
        // Routes taking > 30 seconds
        bottlenecks.push({
          route_pattern: visit.route_pattern,
          timestamp: visit.entry_timestamp,
          bottleneck_type: "slow_transition",
          severity: visit.duration > 60000 ? "critical" : "high",
          impact_score: Math.min(100, visit.duration / 1000),
          description: `Route ${visit.route_pattern} took ${(visit.duration / 1000).toFixed(1)}s to load`,
        })
      }
    })

    return bottlenecks
  }
}
