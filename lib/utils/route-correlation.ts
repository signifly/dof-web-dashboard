import { RoutePerformanceData } from "@/types/route-performance"
import { RouteCorrelationAnalysis } from "@/types/route-analytics"

export class RouteCorrelationAnalyzer {
  /**
   * Analyze relationship between two routes
   */
  async analyzeRouteRelationship(
    sourceRoute: RoutePerformanceData,
    targetRoute: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number } // TODO: Fix unused variable appAverages
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

    // Add debugging information
    const result = {
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

    // Debug logging for correlation analysis
    console.log(`🔗 Correlation Analysis:`, {
      source: sourceRoute.routePattern,
      target: targetRoute.routePattern,
      fpsCorrelation,
      memoryCorrelation,
      cpuCorrelation,
      overallCorrelation,
      correlationStrength: result.correlation_strength,
      sourceSessions: sourceRoute.sessions?.length || 0,
      targetSessions: targetRoute.sessions?.length || 0,
      sampleSize: result.sample_size,
    })

    return result
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const minLength = Math.min(x.length, y.length)

    // Allow correlation calculation with just 1 data point for limited data scenarios
    // In this case, we'll use a simple comparison approach
    if (minLength === 0) return 0

    if (minLength === 1) {
      // For single data points, calculate similarity as inverse of relative difference
      const xVal = x[0]
      const yVal = y[0]
      if (xVal === 0 && yVal === 0) return 1 // Perfect match
      if (xVal === 0 || yVal === 0) return 0 // One is zero, no correlation

      const relativeDiff =
        Math.abs(xVal - yVal) / Math.max(Math.abs(xVal), Math.abs(yVal))
      // Convert to correlation-like value: 1 - relativeDiff, capped between -1 and 1
      return Math.max(-1, Math.min(1, 1 - relativeDiff))
    }

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
    if (denominator === 0) {
      // If both variables have no variance, check if they're equal
      const allXEqual = xSlice.every(val => val === xSlice[0])
      const allYEqual = ySlice.every(val => val === ySlice[0])
      if (allXEqual && allYEqual) {
        return xSlice[0] === ySlice[0] ? 1 : 0
      }
      return 0
    }

    return numerator / denominator
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
