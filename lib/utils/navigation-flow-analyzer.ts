import { RoutePerformanceData } from "@/types/route-performance"
import { NavigationFlowAnalysis, RouteSequence } from "@/types/route-analytics"

export class NavigationFlowAnalyzer {
  /**
   * Analyze navigation flows for performance bottlenecks
   */
  async analyzeFlows(
    routeSequences: RouteSequence[],
    routes: RoutePerformanceData[]
  ): Promise<NavigationFlowAnalysis[]> {
    const flows: NavigationFlowAnalysis[] = []

    // Group sequences by common flow patterns
    const flowGroups = this.groupSequencesByPattern(routeSequences)

    const flowEntries = Array.from(flowGroups.entries())
    for (const [flowPattern, sequences] of flowEntries) {
      const flowAnalysis = await this.analyzeFlowPattern(
        flowPattern,
        sequences,
        routes
      )
      flows.push(flowAnalysis)
    }

    return flows.sort((a, b) => b.user_impact_score - a.user_impact_score)
  }

  private groupSequencesByPattern(
    sequences: RouteSequence[]
  ): Map<string, RouteSequence[]> {
    const flowGroups = new Map<string, RouteSequence[]>()

    sequences.forEach(sequence => {
      // Create flow pattern by joining route sequence
      const pattern = sequence.routes.join(" -> ")

      if (!flowGroups.has(pattern)) {
        flowGroups.set(pattern, [])
      }
      flowGroups.get(pattern)!.push(sequence)
    })

    // Only return flow patterns that occur multiple times
    const filteredGroups = new Map<string, RouteSequence[]>()
    flowGroups.forEach((sequences, pattern) => {
      if (sequences.length >= 2) {
        filteredGroups.set(pattern, sequences)
      }
    })

    return filteredGroups
  }

  private async analyzeFlowPattern(
    flowPattern: string,
    sequences: RouteSequence[],
    routes: RoutePerformanceData[]
  ): Promise<NavigationFlowAnalysis> {
    const routeSequence = flowPattern.split(" -> ")

    // Calculate average performance trajectory across all sequences
    const performanceTrajectory =
      this.calculateAveragePerformanceTrajectory(sequences)

    // Identify bottleneck routes
    const bottleneckRoutes = this.identifyBottleneckRoutes(
      routeSequence,
      performanceTrajectory
    )

    // Calculate optimization potential
    const optimizationPotential = this.calculateOptimizationPotential(
      performanceTrajectory
    )

    // Calculate user impact score
    const userImpactScore = this.calculateUserImpactScore(
      sequences,
      performanceTrajectory
    )

    // Analyze performance degradation points
    const degradationPoints = this.identifyPerformanceDegradationPoints(
      routeSequence,
      performanceTrajectory
    )

    // Calculate average transition time
    const avgTransitionTime = this.calculateAverageTransitionTime(sequences)

    return {
      flow_id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      route_sequence: routeSequence,
      performance_trajectory: performanceTrajectory,
      bottleneck_routes: bottleneckRoutes,
      optimization_potential: optimizationPotential,
      user_impact_score: userImpactScore,
      flow_frequency: sequences.length,
      avg_transition_time: avgTransitionTime,
      performance_degradation_points: degradationPoints,
    }
  }

  private calculateAveragePerformanceTrajectory(
    sequences: RouteSequence[]
  ): number[] {
    if (sequences.length === 0) return []

    const maxLength = Math.max(
      ...sequences.map(seq => seq.performance_scores.length)
    )
    const trajectory: number[] = []

    for (let i = 0; i < maxLength; i++) {
      const scoresAtPosition = sequences
        .map(seq => seq.performance_scores[i])
        .filter(score => score !== undefined)

      if (scoresAtPosition.length > 0) {
        const average =
          scoresAtPosition.reduce((sum, score) => sum + score, 0) /
          scoresAtPosition.length
        trajectory.push(average)
      }
    }

    return trajectory
  }

  private identifyBottleneckRoutes(
    routeSequence: string[],
    performanceTrajectory: number[]
  ): string[] {
    const bottlenecks: string[] = []

    for (let i = 0; i < performanceTrajectory.length; i++) {
      const currentScore = performanceTrajectory[i]
      const previousScore = i > 0 ? performanceTrajectory[i - 1] : currentScore

      // Identify significant performance drops (>20%)
      const performanceDrop =
        ((previousScore - currentScore) / previousScore) * 100

      if (performanceDrop > 20 && i < routeSequence.length) {
        bottlenecks.push(routeSequence[i])
      }

      // Also identify consistently low performing routes (<50 score)
      if (currentScore < 50 && i < routeSequence.length) {
        if (!bottlenecks.includes(routeSequence[i])) {
          bottlenecks.push(routeSequence[i])
        }
      }
    }

    return bottlenecks
  }

  private calculateOptimizationPotential(
    performanceTrajectory: number[]
  ): number {
    if (performanceTrajectory.length === 0) return 0

    const minScore = Math.min(...performanceTrajectory)
    const maxScore = Math.max(...performanceTrajectory)
    const avgScore =
      performanceTrajectory.reduce((sum, score) => sum + score, 0) /
      performanceTrajectory.length

    // Calculate potential improvement from worst to best performance in flow
    const improvementRange = maxScore - minScore
    const currentGap = 100 - avgScore // Gap from perfect performance

    // Optimization potential is the percentage of the gap that could be closed
    return Math.min(100, (improvementRange / currentGap) * 100)
  }

  private calculateUserImpactScore(
    sequences: RouteSequence[],
    performanceTrajectory: number[]
  ): number {
    // Impact = frequency * severity of performance issues
    const frequency = sequences.length
    const avgPerformance =
      performanceTrajectory.reduce((sum, score) => sum + score, 0) /
      performanceTrajectory.length

    // Lower performance = higher impact
    const performanceImpact = 100 - avgPerformance

    // Normalize frequency (more frequent flows have higher impact)
    const frequencyWeight = Math.min(1, frequency / 10) // Cap at 10 occurrences

    return Math.round(performanceImpact * frequencyWeight * 100) / 100
  }

  private identifyPerformanceDegradationPoints(
    routeSequence: string[],
    performanceTrajectory: number[]
  ): Array<{
    from_route: string
    to_route: string
    performance_drop: number
    severity: "critical" | "high" | "medium" | "low"
  }> {
    const degradationPoints: Array<{
      from_route: string
      to_route: string
      performance_drop: number
      severity: "critical" | "high" | "medium" | "low"
    }> = []

    for (
      let i = 1;
      i < Math.min(performanceTrajectory.length, routeSequence.length);
      i++
    ) {
      const previousScore = performanceTrajectory[i - 1]
      const currentScore = performanceTrajectory[i]

      const performanceDrop = previousScore - currentScore
      const performanceDropPercentage = (performanceDrop / previousScore) * 100

      if (performanceDropPercentage > 10) {
        // Only consider drops > 10%
        let severity: "critical" | "high" | "medium" | "low" = "low"

        if (performanceDropPercentage > 40) severity = "critical"
        else if (performanceDropPercentage > 25) severity = "high"
        else if (performanceDropPercentage > 15) severity = "medium"

        degradationPoints.push({
          from_route: routeSequence[i - 1],
          to_route: routeSequence[i],
          performance_drop: performanceDropPercentage,
          severity,
        })
      }
    }

    return degradationPoints.sort(
      (a, b) => b.performance_drop - a.performance_drop
    )
  }

  private calculateAverageTransitionTime(sequences: RouteSequence[]): number {
    let totalTransitionTime = 0
    let transitionCount = 0

    sequences.forEach(sequence => {
      for (let i = 1; i < sequence.timestamps.length; i++) {
        const previousTime = new Date(sequence.timestamps[i - 1]).getTime()
        const currentTime = new Date(sequence.timestamps[i]).getTime()
        const transitionTime = currentTime - previousTime

        // Only consider reasonable transition times (< 10 minutes)
        if (transitionTime < 10 * 60 * 1000) {
          totalTransitionTime += transitionTime
          transitionCount++
        }
      }
    })

    return transitionCount > 0 ? totalTransitionTime / transitionCount : 0
  }
}
