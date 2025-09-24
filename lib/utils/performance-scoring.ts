import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"
import { PerformanceCategory } from "@/constants/enums"
import {
  PerformanceScore,
  TrendAnalysis,
  PerformanceBenchmark,
} from "@/types/insights"
import { StatisticalAnalysisUtils } from "./statistical-analysis"

export interface ScoringConfig {
  weights: {
    fps: number
    memory: number
    cpu: number
  }
  benchmarks: {
    fps: PerformanceBenchmark
    memory: PerformanceBenchmark
    cpu: PerformanceBenchmark
  }
  trend_weight: number // How much trend affects overall score
}

export class PerformanceScoringEngine {
  private config: ScoringConfig

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      weights: {
        fps: 0.4, // User experience impact
        memory: 0.3, // Resource efficiency
        cpu: 0.3, // Battery/performance impact
      },
      benchmarks: {
        fps: {
          metric_type: "fps",
          excellent_threshold: 45, // Tightened for more demanding scoring
          good_threshold: 35,
          average_threshold: 25,
          poor_threshold: 15,
          device_specific: true,
        },
        memory: {
          metric_type: "memory",
          excellent_threshold: 40, // MB - More demanding threshold
          good_threshold: 80, // MB - Reasonable for most mobile apps
          average_threshold: 120, // MB - Within Android recommendations
          poor_threshold: 200, // MB - Upper limit before performance issues
          device_specific: true,
        },
        cpu: {
          metric_type: "cpu",
          excellent_threshold: 10, // % - More demanding for excellent rating
          good_threshold: 25, // % - Acceptable for normal operation
          average_threshold: 45, // % - Higher but still manageable
          poor_threshold: 70, // % - Approaching problematic levels
          device_specific: false,
        },
      },
      trend_weight: 0.15,
      ...config,
    }
  }

  /**
   * Calculate comprehensive performance score
   */
  calculatePerformanceScore(
    summary: PerformanceSummary,
    trends?: MetricsTrend[],
    baseline?: Record<string, number>
  ): PerformanceScore {
    // Calculate individual metric scores
    const fpsScore = this.calculateMetricScore(summary.avgFps, "fps")
    const memoryScore = this.calculateMetricScore(summary.avgMemory, "memory")
    const cpuScore = this.calculateMetricScore(summary.avgCpu, "cpu")

    // Calculate weighted overall score
    let overallScore =
      fpsScore * this.config.weights.fps +
      memoryScore * this.config.weights.memory +
      cpuScore * this.config.weights.cpu

    // Apply trend analysis if available
    let trendDirection: "improving" | "stable" | "declining" = "stable"
    if (trends && trends.length >= 5) {
      const trendAnalysis = this.analyzeTrends(trends)
      trendDirection = this.determineTrendDirection(trendAnalysis)

      // Adjust score based on trends
      const trendAdjustment = this.calculateTrendAdjustment(trendAnalysis)
      overallScore = Math.max(0, Math.min(100, overallScore + trendAdjustment))
    }

    const grade = this.calculateGrade(overallScore)

    // Calculate baseline comparison if provided
    let baselineComparison
    if (baseline) {
      baselineComparison = {
        fps_vs_baseline: this.calculatePercentageChange(
          summary.avgFps,
          baseline.fps || 0
        ),
        cpu_vs_baseline: this.calculatePercentageChange(
          summary.avgCpu,
          baseline.cpu || 0
        ),
        memory_vs_baseline: this.calculatePercentageChange(
          summary.avgMemory,
          baseline.memory || 0
        ),
      }
    }

    return {
      overall: Math.round(overallScore),
      breakdown: {
        fps: Math.round(fpsScore),
        cpu: Math.round(cpuScore),
        memory: Math.round(memoryScore),
      },
      grade,
      trend: trendDirection,
      last_calculated: new Date().toISOString(),
      baseline_comparison: baselineComparison,
    }
  }

  /**
   * Calculate score for individual metric
   */
  private calculateMetricScore(
    value: number,
    metricType: keyof ScoringConfig["benchmarks"]
  ): number {
    if (isNaN(value) || value < 0) return 0

    const benchmark = this.config.benchmarks[metricType]

    // For metrics where lower is better (memory, cpu)
    if (metricType === "memory" || metricType === "cpu") {
      if (value <= benchmark.excellent_threshold) return 100
      if (value <= benchmark.good_threshold) {
        return this.interpolateScore(
          value,
          benchmark.excellent_threshold,
          benchmark.good_threshold,
          100,
          80
        )
      }
      if (value <= benchmark.average_threshold) {
        return this.interpolateScore(
          value,
          benchmark.good_threshold,
          benchmark.average_threshold,
          80,
          60
        )
      }
      if (value <= benchmark.poor_threshold) {
        return this.interpolateScore(
          value,
          benchmark.average_threshold,
          benchmark.poor_threshold,
          60,
          40
        )
      }
      return Math.max(
        0,
        40 -
          ((value - benchmark.poor_threshold) / benchmark.poor_threshold) * 40
      )
    }

    // For metrics where higher is better (fps)
    if (metricType === "fps") {
      if (value >= benchmark.excellent_threshold) return 100
      if (value >= benchmark.good_threshold) {
        return this.interpolateScore(
          value,
          benchmark.good_threshold,
          benchmark.excellent_threshold,
          80,
          100
        )
      }
      if (value >= benchmark.average_threshold) {
        return this.interpolateScore(
          value,
          benchmark.average_threshold,
          benchmark.good_threshold,
          60,
          80
        )
      }
      if (value >= benchmark.poor_threshold) {
        return this.interpolateScore(
          value,
          benchmark.poor_threshold,
          benchmark.average_threshold,
          40,
          60
        )
      }
      return Math.max(0, (value / benchmark.poor_threshold) * 40)
    }

    return 50 // Fallback
  }

  /**
   * Interpolate score between two thresholds
   */
  private interpolateScore(
    value: number,
    minThreshold: number,
    maxThreshold: number,
    minScore: number,
    maxScore: number
  ): number {
    const ratio = (value - minThreshold) / (maxThreshold - minThreshold)
    return minScore + ratio * (maxScore - minScore)
  }

  /**
   * Calculate performance grade based on overall score
   */
  private calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  /**
   * Analyze performance trends across all metrics
   */
  private analyzeTrends(trends: MetricsTrend[]): {
    fps: TrendAnalysis
    memory: TrendAnalysis
    cpu: TrendAnalysis
  } {
    const timePeriod = this.calculateTimePeriod(trends)

    return {
      fps: StatisticalAnalysisUtils.analyzeTrend(trends, "fps", timePeriod),
      memory: StatisticalAnalysisUtils.analyzeTrend(
        trends,
        "memory_usage",
        timePeriod
      ),
      cpu: StatisticalAnalysisUtils.analyzeTrend(
        trends,
        "cpu_usage",
        timePeriod
      ),
    }
  }

  /**
   * Determine overall trend direction from individual metric trends
   */
  private determineTrendDirection(trends: {
    fps: TrendAnalysis
    memory: TrendAnalysis
    cpu: TrendAnalysis
  }): "improving" | "stable" | "declining" {
    // Weight the importance of each metric's trend
    let improvingScore = 0
    let decliningScore = 0

    // FPS: higher is better
    if (trends.fps.direction === "up" && trends.fps.significance !== "low") {
      improvingScore +=
        this.config.weights.fps * this.getTrendStrength(trends.fps)
    } else if (
      trends.fps.direction === "down" &&
      trends.fps.significance !== "low"
    ) {
      decliningScore +=
        this.config.weights.fps * this.getTrendStrength(trends.fps)
    }

    // Memory, CPU: lower is better
    const lowerIsBetter = [trends.memory, trends.cpu]
    const weights = [this.config.weights.memory, this.config.weights.cpu]

    lowerIsBetter.forEach((trend, index) => {
      if (trend.direction === "down" && trend.significance !== "low") {
        improvingScore += weights[index] * this.getTrendStrength(trend)
      } else if (trend.direction === "up" && trend.significance !== "low") {
        decliningScore += weights[index] * this.getTrendStrength(trend)
      }
    })

    const netScore = improvingScore - decliningScore

    if (Math.abs(netScore) < 0.1) return "stable"
    return netScore > 0 ? "improving" : "declining"
  }

  /**
   * Calculate trend adjustment for overall score
   */
  private calculateTrendAdjustment(trends: {
    fps: TrendAnalysis
    memory: TrendAnalysis
    cpu: TrendAnalysis
  }): number {
    const trendDirection = this.determineTrendDirection(trends)

    if (trendDirection === "stable") return 0

    // Calculate the magnitude of trend impact
    let trendMagnitude = 0

    // Sum weighted trend strengths
    trendMagnitude +=
      Math.abs(trends.fps.slope) *
      this.config.weights.fps *
      this.getTrendStrength(trends.fps)
    trendMagnitude +=
      Math.abs(trends.memory.slope) *
      this.config.weights.memory *
      this.getTrendStrength(trends.memory)
    trendMagnitude +=
      Math.abs(trends.cpu.slope) *
      this.config.weights.cpu *
      this.getTrendStrength(trends.cpu)

    // Apply trend weight and direction
    const maxAdjustment = 10 // Maximum score adjustment from trends
    const adjustment = Math.min(
      maxAdjustment,
      trendMagnitude * this.config.trend_weight * 100
    )

    return trendDirection === "improving" ? adjustment : -adjustment
  }

  /**
   * Get trend strength multiplier based on significance and confidence
   */
  private getTrendStrength(trend: TrendAnalysis): number {
    let strength = Math.abs(trend.confidence)

    // Apply significance multiplier
    switch (trend.significance) {
      case "high":
        strength *= 1.0
        break
      case "medium":
        strength *= 0.7
        break
      case "low":
        strength *= 0.3
        break
    }

    return Math.min(1, strength)
  }

  /**
   * Calculate time period for trend analysis
   */
  private calculateTimePeriod(trends: MetricsTrend[]): string {
    if (trends.length === 0) return "unknown"

    const start = new Date(trends[0].timestamp)
    const end = new Date(trends[trends.length - 1].timestamp)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "1 day"
    if (diffDays === 1) return "2 days"
    if (diffDays < 7) return `${diffDays + 1} days`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`
    return `${Math.floor(diffDays / 30)} months`
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, baseline: number): number {
    if (baseline === 0) return 0
    return ((current - baseline) / baseline) * 100
  }

  /**
   * Benchmark against device-specific baselines
   */
  benchmarkAgainstBaseline(
    current: number,
    baseline: number,
    metricType: keyof ScoringConfig["benchmarks"]
  ): {
    score: number
    deviation: number
    classification: PerformanceCategory | "average" | "critical"
  } {
    const deviation = current - baseline
    const percentageDeviation =
      baseline === 0 ? 0 : Math.abs(deviation / baseline) * 100

    // For metrics where lower is better
    const isLowerBetter = ["memory", "cpu"].includes(metricType)

    let classification: PerformanceCategory | "average" | "critical"
    let score: number

    if (percentageDeviation < 5) {
      classification = PerformanceCategory.EXCELLENT
      score = 95
    } else if (percentageDeviation < 15) {
      classification = PerformanceCategory.GOOD
      score = 80
    } else if (percentageDeviation < 30) {
      classification = "average"
      score = 65
    } else if (percentageDeviation < 50) {
      classification = PerformanceCategory.POOR
      score = 40
    } else {
      classification = "critical"
      score = 20
    }

    // Adjust score based on direction for "lower is better" metrics
    if (isLowerBetter && deviation < 0) {
      // Performing better than baseline
      score = Math.min(100, score + 10)
    } else if (isLowerBetter && deviation > 0) {
      // Performing worse than baseline
      score = Math.max(0, score - 10)
    } else if (!isLowerBetter && deviation > 0) {
      // FPS: performing better than baseline
      score = Math.min(100, score + 10)
    } else if (!isLowerBetter && deviation < 0) {
      // FPS: performing worse than baseline
      score = Math.max(0, score - 10)
    }

    return { score, deviation, classification }
  }

  /**
   * Calculate device-specific performance tier
   */
  calculatePerformanceTier(summary: PerformanceSummary): {
    tier: "high_end" | "mid_range" | "low_end"
    confidence: number
    reasoning: string[]
  } {
    const reasoning: string[] = []
    let tierScore = 0

    // Analyze FPS capability
    if (summary.avgFps > 50) {
      tierScore += 3
      reasoning.push("High average FPS indicates good GPU performance")
    } else if (summary.avgFps > 30) {
      tierScore += 2
      reasoning.push("Moderate FPS suggests mid-range performance")
    } else {
      tierScore += 1
      reasoning.push("Low FPS indicates limited graphics capability")
    }

    // Analyze memory usage patterns
    if (summary.avgMemory < 300) {
      tierScore += 2
      reasoning.push(
        "Low memory usage suggests efficient device or good optimization"
      )
    } else if (summary.avgMemory > 600) {
      tierScore -= 1
      reasoning.push(
        "High memory usage may indicate lower-end device or memory pressure"
      )
    }

    // Analyze CPU usage
    if (summary.avgCpu < 30) {
      tierScore += 2
      reasoning.push(
        "Low CPU usage indicates efficient processing or powerful CPU"
      )
    } else if (summary.avgCpu > 60) {
      tierScore -= 1
      reasoning.push(
        "High CPU usage suggests device is working hard or limited CPU power"
      )
    }

    // Determine tier
    let tier: "high_end" | "mid_range" | "low_end"
    let confidence: number

    if (tierScore >= 6) {
      tier = "high_end"
      confidence = Math.min(0.9, tierScore / 7)
    } else if (tierScore >= 4) {
      tier = "mid_range"
      confidence = 0.7
    } else {
      tier = "low_end"
      confidence = Math.min(0.8, (5 - tierScore) / 5)
    }

    return { tier, confidence, reasoning }
  }
}
