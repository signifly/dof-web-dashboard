import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"
import {
  EarlyWarningAlert,
  EarlyWarningThresholds,
  PerformancePrediction,
  SeasonalPattern,
} from "@/types/insights"
import { RoutePerformancePrediction } from "@/types/route-analytics"
import { PerformancePredictionEngine } from "@/lib/utils/performance-prediction"
import { TimeSeriesAnalysis } from "@/lib/utils/statistical-analysis"
import {
  EARLY_WARNING_THRESHOLDS,
  PERFORMANCE_SCORING,
  ALERT_SEVERITY_THRESHOLDS,
  DEGRADATION_DETECTION,
} from "@/constants/performance"

/**
 * Early Warning Engine for Issue #30
 * Generates proactive alerts based on performance predictions and seasonal patterns
 */
export class EarlyWarningEngine {
  private predictionEngine: PerformancePredictionEngine
  private thresholds: EarlyWarningThresholds

  constructor(thresholds?: Partial<EarlyWarningThresholds>) {
    this.predictionEngine = new PerformancePredictionEngine()
    this.thresholds = {
      fps_degradation_threshold:
        EARLY_WARNING_THRESHOLDS.FPS_DEGRADATION_THRESHOLD,
      memory_spike_threshold: EARLY_WARNING_THRESHOLDS.MEMORY_SPIKE_THRESHOLD,
      cpu_spike_threshold: EARLY_WARNING_THRESHOLDS.CPU_SPIKE_THRESHOLD,
      confidence_threshold: EARLY_WARNING_THRESHOLDS.CONFIDENCE_THRESHOLD,
      time_horizon_days: EARLY_WARNING_THRESHOLDS.TIME_HORIZON_DAYS,
      ...thresholds,
    }
  }

  /**
   * Generate early warning alerts based on predictions
   */
  async generateEarlyWarnings(
    predictions: PerformancePrediction[],
    routePredictions: RoutePerformancePrediction[],
    seasonalPatterns: SeasonalPattern[],
    currentPerformance: PerformanceSummary,
    historicalTrends?: MetricsTrend[]
  ): Promise<EarlyWarningAlert[]> {
    const alerts: EarlyWarningAlert[] = []

    // 1. Performance degradation alerts from predictions
    const degradationAlerts =
      this.checkPerformanceDegradationAlerts(predictions)
    alerts.push(...degradationAlerts)

    // 2. Route-specific performance alerts
    const routeAlerts = this.checkRoutePerformanceAlerts(routePredictions)
    alerts.push(...routeAlerts)

    // 3. Seasonal peak alerts
    const seasonalAlerts = this.checkSeasonalPeakAlerts(
      seasonalPatterns,
      currentPerformance
    )
    alerts.push(...seasonalAlerts)

    // 4. Memory spike alerts from trend analysis
    if (historicalTrends) {
      const memoryAlerts = this.checkMemorySpikeAlerts(
        historicalTrends,
        currentPerformance
      )
      alerts.push(...memoryAlerts)
    }

    // 5. FPS drop alerts
    const fpsAlerts = this.checkFpsDropAlerts(predictions, currentPerformance)
    alerts.push(...fpsAlerts)

    // Sort by severity and confidence
    return alerts
      .filter(alert => this.isAlertValid(alert))
      .sort((a, b) => {
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
        const severityDiff =
          severityWeight[b.severity] - severityWeight[a.severity]
        if (severityDiff !== 0) return severityDiff
        return b.confidence - a.confidence
      })
      .slice(0, 10) // Limit to top 10 alerts
  }

  /**
   * Check for performance degradation alerts
   */
  private checkPerformanceDegradationAlerts(
    predictions: PerformancePrediction[]
  ): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = []

    predictions.forEach(prediction => {
      if (
        prediction.probability_of_issue > 0.5 &&
        prediction.predicted_value <
          ALERT_SEVERITY_THRESHOLDS.MEDIUM_PERFORMANCE_SCORE && // Performance score below 60
        this.calculateConfidenceFromInterval(prediction.confidence_interval) >
          this.thresholds.confidence_threshold
      ) {
        const timeToIssue = this.calculateTimeToIssue(prediction.time_horizon)
        const severity = this.calculateSeverity(
          prediction.probability_of_issue,
          prediction.predicted_value
        )

        alerts.push({
          id: `perf_degradation_${prediction.prediction_id}_${Date.now()}`,
          type: "performance_degradation",
          predicted_issue_date: this.calculatePredictedIssueDate(
            prediction.time_horizon
          ),
          time_to_issue: timeToIssue,
          confidence: this.calculateConfidenceFromInterval(
            prediction.confidence_interval
          ),
          affected_routes: prediction.route_pattern
            ? [prediction.route_pattern]
            : undefined,
          severity,
          prevention_recommendations: this.generatePreventionRecommendations(
            "performance_degradation",
            {
              predicted_value: prediction.predicted_value,
              current_performance: prediction.predicted_value + 20, // Estimate current as better
            }
          ),
          monitoring_suggestions: [
            "Monitor performance metrics every hour until risk passes",
            "Set up automated alerts for performance threshold breaches",
            "Prepare rollback strategies for recent deployments",
            "Review resource usage patterns for anomalies",
          ],
          prediction_basis: "trend_analysis",
        })
      }
    })

    return alerts
  }

  /**
   * Check for route-specific performance alerts
   */
  private checkRoutePerformanceAlerts(
    routePredictions: RoutePerformancePrediction[]
  ): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = []

    routePredictions.forEach(prediction => {
      if (
        prediction.predicted_performance_score <
          ALERT_SEVERITY_THRESHOLDS.HIGH_PERFORMANCE_SCORE &&
        prediction.forecast_accuracy > this.thresholds.confidence_threshold
      ) {
        const severity =
          prediction.predicted_performance_score <
          ALERT_SEVERITY_THRESHOLDS.CRITICAL_PERFORMANCE_SCORE
            ? "critical"
            : "high"

        alerts.push({
          id: `route_perf_${prediction.route_pattern}_${Date.now()}`,
          type: "performance_degradation",
          predicted_issue_date: this.calculatePredictedIssueDate(
            prediction.prediction_horizon
          ),
          time_to_issue: this.calculateTimeToIssue(
            prediction.prediction_horizon
          ),
          confidence: prediction.forecast_accuracy,
          affected_routes: [prediction.route_pattern],
          severity,
          prevention_recommendations:
            this.generateRouteSpecificRecommendations(prediction),
          monitoring_suggestions: [
            `Focus monitoring on ${prediction.route_pattern} route`,
            "Check route-specific resource usage patterns",
            "Review recent route-specific deployments or changes",
            "Consider temporary route optimization measures",
          ],
          prediction_basis: prediction.prediction_model as any,
        })
      }
    })

    return alerts
  }

  /**
   * Check for seasonal peak alerts
   */
  private checkSeasonalPeakAlerts(
    seasonalPatterns: SeasonalPattern[],
    currentPerformance: PerformanceSummary // TODO: Fix unused variable currentPerformance
  ): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = []

    seasonalPatterns.forEach(pattern => {
      if (pattern.confidence > 0.7 && pattern.seasonal_strength > 0.3) {
        const nextPeakDate = new Date(pattern.next_predicted_peak)
        const now = new Date()
        const timeToPeak = nextPeakDate.getTime() - now.getTime()
        const hoursToNextPeak = timeToPeak / (1000 * 60 * 60)

        // Alert if peak is within 48 hours
        if (hoursToNextPeak > 0 && hoursToNextPeak <= 48) {
          alerts.push({
            id: `seasonal_peak_${pattern.pattern_id}_${Date.now()}`,
            type: "seasonal_peak",
            predicted_issue_date: pattern.next_predicted_peak,
            time_to_issue: this.formatTimeToIssue(hoursToNextPeak),
            confidence: pattern.confidence,
            severity: pattern.seasonal_strength > 0.5 ? "high" : "medium",
            prevention_recommendations:
              this.generateSeasonalPreparationRecommendations(pattern),
            monitoring_suggestions: [
              `Monitor ${pattern.metric_type} closely during predicted peak period`,
              "Prepare additional resources for increased load",
              "Review historical performance during similar peak periods",
              "Set up enhanced alerting during peak window",
            ],
            prediction_basis: "seasonal_pattern",
          })
        }
      }
    })

    return alerts
  }

  /**
   * Check for memory spike alerts using trend analysis
   */
  private checkMemorySpikeAlerts(
    historicalTrends: MetricsTrend[],
    currentPerformance: PerformanceSummary
  ): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = []

    // Use exponential smoothing to predict memory usage
    const memoryValues = historicalTrends
      .map(trend => trend.memory_usage)
      .filter(val => !isNaN(val) && val > 0)

    if (memoryValues.length >= 10) {
      const smoothed = TimeSeriesAnalysis.exponentialSmoothing(
        memoryValues,
        0.3,
        3
      )
      const nextPredictedMemory = smoothed[smoothed.length - 1]

      if (
        nextPredictedMemory > this.thresholds.memory_spike_threshold &&
        nextPredictedMemory > currentPerformance.avgMemory * 1.5 // 50% increase
      ) {
        const severity =
          nextPredictedMemory > this.thresholds.memory_spike_threshold * 1.5
            ? "critical"
            : "high"

        alerts.push({
          id: `memory_spike_${Date.now()}`,
          type: "memory_spike",
          predicted_issue_date: this.calculatePredictedIssueDate("24h"),
          time_to_issue: "24 hours",
          confidence: this.calculateTrendConfidence(memoryValues),
          severity,
          prevention_recommendations: this.generatePreventionRecommendations(
            "memory_spike",
            {
              predicted_value: nextPredictedMemory,
              current_performance: currentPerformance.avgMemory,
            }
          ),
          monitoring_suggestions: [
            "Monitor memory usage every 15 minutes",
            "Identify memory-intensive processes or routes",
            "Prepare memory cleanup procedures",
            "Review recent changes that might affect memory usage",
          ],
          prediction_basis: "trend_analysis",
        })
      }
    }

    return alerts
  }

  /**
   * Check for FPS drop alerts
   */
  private checkFpsDropAlerts(
    predictions: PerformancePrediction[],
    currentPerformance: PerformanceSummary
  ): EarlyWarningAlert[] {
    const alerts: EarlyWarningAlert[] = []

    predictions.forEach(prediction => {
      if (
        prediction.metric_type === "fps" &&
        prediction.predicted_value <
          this.thresholds.fps_degradation_threshold &&
        prediction.predicted_value <
          currentPerformance.avgFps * DEGRADATION_DETECTION.FPS_DROP_THRESHOLD // 20% drop
      ) {
        const confidence = this.calculateConfidenceFromInterval(
          prediction.confidence_interval
        )

        if (confidence > this.thresholds.confidence_threshold) {
          const severity =
            prediction.predicted_value <
            ALERT_SEVERITY_THRESHOLDS.CRITICAL_PERFORMANCE_SCORE
              ? "critical"
              : "high"

          alerts.push({
            id: `fps_drop_${prediction.prediction_id}_${Date.now()}`,
            type: "fps_drop",
            predicted_issue_date: this.calculatePredictedIssueDate(
              prediction.time_horizon
            ),
            time_to_issue: this.calculateTimeToIssue(prediction.time_horizon),
            confidence,
            affected_routes: prediction.route_pattern
              ? [prediction.route_pattern]
              : undefined,
            severity,
            prevention_recommendations: this.generatePreventionRecommendations(
              "fps_drop",
              {
                predicted_value: prediction.predicted_value,
                current_performance: currentPerformance.avgFps,
              }
            ),
            monitoring_suggestions: [
              "Monitor FPS metrics in real-time",
              "Check GPU and rendering performance",
              "Review draw call optimization opportunities",
              "Prepare frame rate optimization strategies",
            ],
            prediction_basis: "model_ensemble",
          })
        }
      }
    })

    return alerts
  }

  /**
   * Helper methods for alert generation
   */
  private isAlertValid(alert: EarlyWarningAlert): boolean {
    return (
      alert.confidence >= this.thresholds.confidence_threshold &&
      alert.severity !== "low" &&
      new Date(alert.predicted_issue_date) > new Date()
    )
  }

  private calculateSeverity(
    probabilityOfIssue: number,
    predictedValue: number
  ): "critical" | "high" | "medium" | "low" {
    if (probabilityOfIssue > 0.8 && predictedValue < 30) return "critical"
    if (probabilityOfIssue > 0.6 && predictedValue < 50) return "high"
    if (probabilityOfIssue > 0.4) return "medium"
    return "low"
  }

  private calculatePredictedIssueDate(timeHorizon: string): string {
    const now = new Date()
    const hours = this.parseTimeHorizon(timeHorizon)
    const issueDate = new Date(now.getTime() + hours * 60 * 60 * 1000)
    return issueDate.toISOString()
  }

  private calculateTimeToIssue(timeHorizon: string): string {
    const hours = this.parseTimeHorizon(timeHorizon)
    if (hours < 24) return `${hours} hours`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""}`
  }

  private parseTimeHorizon(timeHorizon: string): number {
    switch (timeHorizon) {
      case "1h":
        return 1
      case "24h":
        return 24
      case "7d":
        return 24 * 7
      case "30d":
        return 24 * 30
      default:
        return 24
    }
  }

  private formatTimeToIssue(hours: number): string {
    if (hours < 1) return "Less than 1 hour"
    if (hours < 24) return `${Math.round(hours)} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    if (remainingHours === 0) return `${days} day${days > 1 ? "s" : ""}`
    return `${days} day${days > 1 ? "s" : ""} and ${remainingHours} hours`
  }

  private calculateConfidenceFromInterval(
    confidenceInterval: [number, number]
  ): number {
    const range = confidenceInterval[1] - confidenceInterval[0]
    const midpoint = (confidenceInterval[1] + confidenceInterval[0]) / 2

    // Confidence is inversely related to the size of the interval
    const normalizedRange = Math.min(range / midpoint, 1)
    return Math.max(0.1, 1 - normalizedRange)
  }

  private calculateTrendConfidence(values: number[]): number {
    if (values.length < 5) return 0.3

    // Calculate consistency of trend
    const diffs = values.slice(1).map((val, i) => val - values[i])
    const positiveDiffs = diffs.filter(diff => diff > 0).length
    const negativeDiffs = diffs.filter(diff => diff < 0).length

    // Higher confidence if trend is consistent (mostly positive or mostly negative)
    const consistency = Math.max(positiveDiffs, negativeDiffs) / diffs.length
    return Math.min(0.95, consistency)
  }

  private generatePreventionRecommendations(
    alertType: "performance_degradation" | "memory_spike" | "fps_drop",
    context: { predicted_value: number; current_performance: number }
  ): string[] {
    const baseRecommendations: { [key: string]: string[] } = {
      performance_degradation: [
        "Review and optimize critical performance bottlenecks",
        "Implement caching strategies for frequently accessed data",
        "Consider horizontal scaling if possible",
        "Review recent deployments for performance regressions",
      ],
      memory_spike: [
        "Implement memory cleanup procedures immediately",
        "Review memory-intensive operations and optimize",
        "Consider implementing memory pooling or recycling",
        "Monitor for memory leaks in recent code changes",
      ],
      fps_drop: [
        "Optimize rendering pipeline and draw calls",
        "Review GPU-intensive operations",
        "Implement frame rate limiting or adaptive quality",
        "Check for background processes affecting rendering",
      ],
    }

    const recommendations = [...(baseRecommendations[alertType] || [])]

    // Add severity-specific recommendations
    const severityRatio = context.current_performance / context.predicted_value
    if (severityRatio > 2) {
      recommendations.unshift(
        "URGENT: Immediate intervention required - predicted severe degradation"
      )
    }

    return recommendations
  }

  private generateRouteSpecificRecommendations(
    prediction: RoutePerformancePrediction
  ): string[] {
    const recommendations = [
      `Optimize performance for route: ${prediction.route_pattern}`,
      "Review route-specific resource usage patterns",
      "Consider route-level caching or preloading strategies",
    ]

    prediction.contributing_factors.forEach(factor => {
      if (factor.includes("memory")) {
        recommendations.push("Focus on memory optimization for this route")
      }
      if (factor.includes("FPS")) {
        recommendations.push("Optimize rendering performance for this route")
      }
      if (factor.includes("CPU")) {
        recommendations.push("Optimize CPU-intensive operations in this route")
      }
    })

    return recommendations
  }

  private generateSeasonalPreparationRecommendations(
    pattern: SeasonalPattern
  ): string[] {
    const recommendations = [
      `Prepare for predicted ${pattern.pattern_type} peak in ${pattern.metric_type}`,
      "Scale resources in advance of peak period",
      "Review historical mitigation strategies from similar peaks",
    ]

    switch (pattern.pattern_type) {
      case "daily":
        recommendations.push("Implement time-based auto-scaling")
        break
      case "weekly":
        recommendations.push("Plan weekend/weekday performance adjustments")
        break
      case "monthly":
        recommendations.push(
          "Coordinate with business calendar for peak planning"
        )
        break
    }

    return recommendations
  }
}
