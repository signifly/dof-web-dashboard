import { RoutePerformanceData } from "@/types/route-performance"
import { RouteCorrelationAnalysis } from "@/types/route-analytics"

export class RouteCorrelationAnalyzer {
  /**
   * Analyze relationship between two routes
   */
  async analyzeRouteRelationship(
    sourceRoute: RoutePerformanceData,
    targetRoute: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number }
  ): Promise<RouteCorrelationAnalysis> {
    // Calculate correlation strength using Pearson correlation coefficient
    const fpsCorrelation = this.calculateCorrelation(
      sourceRoute.sessions.map(s => s.avgFps),
      targetRoute.sessions.map(s => s.avgFps)
    )

    const memoryCorrelation = this.calculateCorrelation(
      sourceRoute.sessions.map(s => s.avgMemory),
      targetRoute.sessions.map(s => s.avgMemory)
    )

    const cpuCorrelation = this.calculateCorrelation(
      sourceRoute.sessions.map(s => s.avgCpu),
      targetRoute.sessions.map(s => s.avgCpu)
    )

    const overallCorrelation =
      (fpsCorrelation + memoryCorrelation + cpuCorrelation) / 3

    // Determine correlation type and impact
    const correlationType = this.determineCorrelationType(
      sourceRoute,
      targetRoute,
      fpsCorrelation,
      memoryCorrelation,
      cpuCorrelation
    )

    const performanceImpact = this.determinePerformanceImpact(
      sourceRoute,
      targetRoute,
      overallCorrelation
    )

    return {
      source_route: sourceRoute.routePattern,
      target_route: targetRoute.routePattern,
      correlation_strength: Math.abs(overallCorrelation),
      performance_impact: performanceImpact,
      confidence_level: this.calculateConfidenceLevel(sourceRoute, targetRoute),
      sample_size: Math.min(
        sourceRoute.totalSessions,
        targetRoute.totalSessions
      ),
      correlation_type: correlationType,
      statistical_significance: this.calculateStatisticalSignificance(
        overallCorrelation,
        sourceRoute.totalSessions
      ),
    }
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const minLength = Math.min(x.length, y.length)
    if (minLength < 2) return 0

    const xSlice = x.slice(0, minLength)
    const ySlice = y.slice(0, minLength)

    const meanX = xSlice.reduce((sum, val) => sum + val, 0) / minLength
    const meanY = ySlice.reduce((sum, val) => sum + val, 0) / minLength

    let numerator = 0
    let sumXSquared = 0
    let sumYSquared = 0

    for (let i = 0; i < minLength; i++) {
      const deltaX = xSlice[i] - meanX
      const deltaY = ySlice[i] - meanY
      numerator += deltaX * deltaY
      sumXSquared += deltaX * deltaX
      sumYSquared += deltaY * deltaY
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared)
    return denominator === 0 ? 0 : numerator / denominator
  }

  private determineCorrelationType(
    sourceRoute: RoutePerformanceData,
    targetRoute: RoutePerformanceData,
    fpsCorr: number,
    memoryCorr: number,
    cpuCorr: number
  ): "memory_leak" | "cpu_spike" | "fps_degradation" | "performance_boost" {
    // Memory leak pattern: high positive memory correlation
    if (memoryCorr > 0.5 && sourceRoute.avgMemory > targetRoute.avgMemory) {
      return "memory_leak"
    }

    // CPU spike pattern: high positive CPU correlation
    if (cpuCorr > 0.5 && sourceRoute.avgCpu > targetRoute.avgCpu) {
      return "cpu_spike"
    }

    // FPS degradation: negative FPS correlation or both low FPS
    if (
      fpsCorr < -0.3 ||
      (sourceRoute.avgFps < 40 && targetRoute.avgFps < 40)
    ) {
      return "fps_degradation"
    }

    // Performance boost: positive correlations with good metrics
    if (fpsCorr > 0.3 && sourceRoute.avgFps > 45 && targetRoute.avgFps > 45) {
      return "performance_boost"
    }

    return "performance_boost" // default fallback
  }

  private determinePerformanceImpact(
    sourceRoute: RoutePerformanceData,
    targetRoute: RoutePerformanceData,
    correlation: number
  ): "positive" | "negative" | "neutral" {
    const sourceBetter =
      sourceRoute.performanceScore > targetRoute.performanceScore

    if (Math.abs(correlation) < 0.2) return "neutral"

    if (correlation > 0) {
      // Positive correlation
      return sourceBetter ? "positive" : "negative"
    } else {
      // Negative correlation
      return sourceBetter ? "negative" : "positive"
    }
  }

  private calculateConfidenceLevel(
    sourceRoute: RoutePerformanceData,
    targetRoute: RoutePerformanceData
  ): number {
    const minSessions = Math.min(
      sourceRoute.totalSessions,
      targetRoute.totalSessions
    )

    // Confidence increases with more data
    if (minSessions >= 20) return 0.9
    if (minSessions >= 10) return 0.7
    if (minSessions >= 5) return 0.5
    return 0.3
  }

  private calculateStatisticalSignificance(
    correlation: number,
    sampleSize: number
  ): number {
    // Simple t-test approximation for correlation significance
    if (sampleSize < 3) return 0

    const t =
      correlation *
      Math.sqrt((sampleSize - 2) / (1 - correlation * correlation))
    const degreesOfFreedom = sampleSize - 2

    // Approximate p-value calculation (simplified)
    const pValue = Math.exp(-0.5 * t * t) * (1 + Math.abs(t) / degreesOfFreedom)

    return Math.max(0, Math.min(1, 1 - pValue))
  }
}
