import {
  getPerformanceSummary,
  getPerformanceTrends,
  getDevicePerformanceData,
  PerformanceSummary,
  MetricsTrend,
} from "@/lib/performance-data"
import { StatisticalAnalysisUtils } from "@/lib/utils/statistical-analysis"
import { PerformanceScoringEngine } from "@/lib/utils/performance-scoring"
import { RecommendationEngine } from "./recommendation-engine"
import {
  InsightsReport,
  PerformanceInsight,
  PerformanceRecommendation,
  AnomalyDetection,
  OptimizationOpportunity,
  InsightsEngineConfig,
  TrendAnalysis,
} from "@/types/insights"

export class PerformanceInsightsEngine {
  private statisticalAnalysis = StatisticalAnalysisUtils
  private scoringEngine: PerformanceScoringEngine
  private recommendationEngine: RecommendationEngine
  private config: InsightsEngineConfig

  constructor(config?: Partial<InsightsEngineConfig>) {
    this.config = {
      anomaly_detection: {
        z_score_threshold: 2.5,
        minimum_data_points: 5,
        rolling_window_size: 20,
      },
      trend_analysis: {
        minimum_r_squared: 0.1,
        significance_threshold: 0.05,
        minimum_data_points: 5,
        forecast_periods: 5,
      },
      scoring: {
        weights: {
          fps: 0.4,
          cpu: 0.3,
          memory: 0.3,
        },
        performance_tiers: {
          excellent: 90,
          good: 80,
          average: 70,
          poor: 60,
        },
      },
      recommendations: {
        max_recommendations: 10,
        min_confidence_threshold: 0.6,
        priority_threshold: 3.0,
      },
      ...config,
    }

    this.scoringEngine = new PerformanceScoringEngine({
      weights: this.config.scoring.weights,
    })
    this.recommendationEngine = new RecommendationEngine()
  }

  /**
   * Generate comprehensive insights report
   */
  async generateInsights(timeRange?: {
    start: string
    end: string
  }): Promise<InsightsReport> {
    const analysisStart = Date.now()

    // 1. Fetch performance data from existing functions
    const [performanceData, trendData, deviceData] = await Promise.all([
      getPerformanceSummary(),
      getPerformanceTrends(),
      getDevicePerformanceData(),
    ])

    console.log("🔍 Performance Data:", {
      performanceData,
      trendDataLength: trendData.length,
      deviceDataLength: deviceData.length,
    })

    // 2. Apply time range filter if specified
    const filteredTrends = timeRange
      ? this.filterTrendsByTimeRange(trendData, timeRange)
      : trendData

    // 3. Calculate performance score with trends
    const performanceScore = this.scoringEngine.calculatePerformanceScore(
      performanceData,
      filteredTrends
    )

    // 4. Analyze trends and patterns
    const trends = this.analyzeTrends(filteredTrends)

    // 5. Detect anomalies
    const anomalies = this.detectAnomalies(filteredTrends)

    // 6. Identify optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(
      performanceData,
      deviceData,
      trends
    )

    // 7. Generate insights
    const insights = [
      ...this.createTrendInsights(trends),
      ...this.createAnomalyInsights(anomalies),
      ...this.createOpportunityInsights(optimizationOpportunities),
      ...this.createPerformanceInsights(performanceData, performanceScore),
    ]

    // 8. Generate recommendations using recommendation engine
    console.log("📊 Generated Insights:", insights.length, insights.map(i => ({
      type: i.type,
      category: i.category,
      severity: i.severity,
      title: i.title
    })))
    console.log("🎯 Optimization Opportunities:", optimizationOpportunities.length)

    const recommendations =
      await this.recommendationEngine.generateRecommendations(
        insights,
        performanceData,
        optimizationOpportunities
      )

    console.log("💡 Generated Recommendations:", recommendations.length)

    // Ensure we always have at least one recommendation for demo purposes
    if (recommendations.length === 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        insight_id: "default_insight",
        title: "Performance Monitoring Optimization",
        description: `Your application is performing well with an overall score of ${performanceScore.overall}/100. Consider implementing additional performance monitoring to catch potential issues early.`,
        category: "performance",
        impact: "medium",
        effort: "low",
        priority_score: 2.5,
        actionable_steps: [
          "Set up automated performance alerts for key metrics",
          "Implement user experience tracking for real-world performance data",
          "Consider A/B testing different performance optimizations",
          "Review performance metrics weekly to identify trends",
        ],
        estimated_improvement: "Proactive monitoring reduces issues by 30%",
        related_metrics: ["fps", "cpu_usage", "memory_usage"],
        implementation_time: "1-2 hours",
        status: "pending",
        created_at: new Date().toISOString(),
      })
    }

    // 9. Calculate metadata
    const analysisDuration = Date.now() - analysisStart
    const dataPointsAnalyzed = filteredTrends.length + deviceData.length

    return {
      id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      time_range: timeRange || this.getDefaultTimeRange(),
      performance_score: performanceScore,
      insights: insights.slice(0, 20), // Limit insights
      recommendations: recommendations.slice(
        0,
        this.config.recommendations.max_recommendations
      ),
      summary: this.generateSummary(insights, recommendations),
      trends: {
        fps_trend: trends.fps,
        memory_trend: trends.memory,
        cpu_trend: trends.cpu,
      },
      anomalies,
      optimization_opportunities: optimizationOpportunities,
      metadata: {
        analysis_duration_ms: analysisDuration,
        data_points_analyzed: dataPointsAnalyzed,
        confidence_level: this.calculateOverallConfidence(insights),
      },
    }
  }

  /**
   * Analyze trends across all metrics
   */
  private analyzeTrends(data: MetricsTrend[]): {
    fps: TrendAnalysis
    memory: TrendAnalysis
    cpu: TrendAnalysis
  } {
    const timePeriod = this.calculateTimePeriod(data)

    return {
      fps: this.statisticalAnalysis.analyzeTrend(data, "fps", timePeriod),
      memory: this.statisticalAnalysis.analyzeTrend(
        data,
        "memory_usage",
        timePeriod
      ),
      cpu: this.statisticalAnalysis.analyzeTrend(data, "cpu_usage", timePeriod),
    }
  }

  /**
   * Detect anomalies across all metrics
   */
  private detectAnomalies(data: MetricsTrend[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = []

    // Detect anomalies for each metric type
    const metrics: Array<
      keyof Pick<MetricsTrend, "fps" | "memory_usage" | "cpu_usage">
    > = ["fps", "memory_usage", "cpu_usage"]

    metrics.forEach(metric => {
      const metricAnomalies = this.statisticalAnalysis.detectAnomalies(
        data,
        metric,
        this.config.anomaly_detection.z_score_threshold
      )
      anomalies.push(...metricAnomalies)
    })

    return anomalies.sort((a, b) => b.z_score - a.z_score)
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(
    summary: PerformanceSummary,
    devices: any[],
    trends: {
      fps: TrendAnalysis
      memory: TrendAnalysis
      cpu: TrendAnalysis
    }
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // Memory optimization opportunities
    if (summary.avgMemory > 300) {
      opportunities.push({
        id: `memory_opt_${Date.now()}`,
        type: "memory_optimization",
        potential_impact: summary.avgMemory > 600 ? "high" : "medium",
        affected_metric: "memory_usage",
        current_value: summary.avgMemory,
        target_value: Math.max(200, summary.avgMemory * 0.7),
        improvement_potential: Math.min(
          50,
          ((summary.avgMemory - 200) / summary.avgMemory) * 100
        ),
        complexity: summary.avgMemory > 800 ? "complex" : "moderate",
        description: `High memory usage detected (${summary.avgMemory.toFixed(0)}MB average). Consider implementing memory optimization strategies.`,
      })
    }

    // FPS optimization opportunities
    if (summary.avgFps < 50) {
      opportunities.push({
        id: `fps_opt_${Date.now()}`,
        type: "fps_improvement",
        potential_impact: summary.avgFps < 30 ? "high" : "medium",
        affected_metric: "fps",
        current_value: summary.avgFps,
        target_value: Math.min(60, summary.avgFps * 1.5),
        improvement_potential: Math.min(
          100,
          ((60 - summary.avgFps) / 60) * 100
        ),
        complexity: summary.avgFps < 20 ? "complex" : "moderate",
        description: `Low FPS performance detected (${summary.avgFps.toFixed(1)} average). Frame rate optimization could significantly improve user experience.`,
      })
    }

    // CPU optimization opportunities
    if (summary.avgCpu > 50) {
      opportunities.push({
        id: `cpu_opt_${Date.now()}`,
        type: "cpu_optimization",
        potential_impact: summary.avgCpu > 80 ? "high" : "medium",
        affected_metric: "cpu_usage",
        current_value: summary.avgCpu,
        target_value: Math.max(30, summary.avgCpu * 0.7),
        improvement_potential: Math.min(
          50,
          ((summary.avgCpu - 30) / summary.avgCpu) * 100
        ),
        complexity: summary.avgCpu > 90 ? "complex" : "moderate",
        description: `High CPU usage detected (${summary.avgCpu.toFixed(1)}% average). CPU optimization could improve battery life and performance.`,
      })
    }

    return opportunities.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 }
      return impactWeight[b.potential_impact] - impactWeight[a.potential_impact]
    })
  }

  /**
   * Create trend-based insights
   */
  private createTrendInsights(trends: {
    fps: TrendAnalysis
    memory: TrendAnalysis
    cpu: TrendAnalysis
  }): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // FPS trend insights
    if (trends.fps.significance !== "low" && Math.abs(trends.fps.slope) > 0.1) {
      const isDecline = trends.fps.direction === "down"
      insights.push({
        id: `fps_trend_${Date.now()}`,
        type: isDecline ? "trend_decline" : "trend_improvement",
        severity:
          isDecline && trends.fps.significance === "high" ? "high" : "medium",
        title: `FPS Performance ${isDecline ? "Declining" : "Improving"} Trend`,
        description: `FPS shows a ${trends.fps.significance} ${trends.fps.direction}ward trend (${trends.fps.slope > 0 ? "+" : ""}${trends.fps.slope.toFixed(2)} per period) with ${(trends.fps.confidence * 100).toFixed(0)}% confidence.`,
        confidence: trends.fps.confidence,
        impact: trends.fps.significance === "high" ? "high" : "medium",
        category: "performance",
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: "fps",
          value: trends.fps.forecast || 0,
          baseline: 0,
          deviation: trends.fps.slope,
          time_window: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        },
      })
    }

    // Memory trend insights
    if (
      trends.memory.significance !== "low" &&
      Math.abs(trends.memory.slope) > 5
    ) {
      const isIncrease = trends.memory.direction === "up"
      insights.push({
        id: `memory_trend_${Date.now()}`,
        type: isIncrease ? "trend_decline" : "trend_improvement",
        severity:
          isIncrease && trends.memory.significance === "high"
            ? "high"
            : "medium",
        title: `Memory Usage ${isIncrease ? "Increasing" : "Decreasing"} Trend`,
        description: `Memory usage shows a ${trends.memory.significance} ${trends.memory.direction}ward trend (${trends.memory.slope > 0 ? "+" : ""}${trends.memory.slope.toFixed(1)}MB per period) with ${(trends.memory.confidence * 100).toFixed(0)}% confidence.`,
        confidence: trends.memory.confidence,
        impact: trends.memory.significance === "high" ? "high" : "medium",
        category: "memory",
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: "memory",
          value: trends.memory.forecast || 0,
          baseline: 0,
          deviation: trends.memory.slope,
          time_window: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        },
      })
    }

    return insights
  }

  /**
   * Create anomaly-based insights
   */
  private createAnomalyInsights(
    anomalies: AnomalyDetection[]
  ): PerformanceInsight[] {
    return anomalies
      .filter(anomaly => anomaly.severity !== "low")
      .slice(0, 5) // Limit to top 5 anomalies
      .map(anomaly => ({
        id: `anomaly_${anomaly.id}`,
        type: "anomaly" as const,
        severity: anomaly.severity,
        title: `${anomaly.metric_type.toUpperCase()} Anomaly Detected`,
        description: `Unusual ${anomaly.metric_type} value detected: ${anomaly.value.toFixed(1)} (expected ~${anomaly.expected_value.toFixed(1)}, deviation: ${anomaly.deviation > 0 ? "+" : ""}${anomaly.deviation.toFixed(1)})`,
        confidence: Math.min(1, anomaly.z_score / 5), // Normalize z-score to confidence
        impact:
          anomaly.severity === "critical"
            ? "high"
            : anomaly.severity === "high"
              ? "medium"
              : "low",
        category: this.mapMetricToCategory(anomaly.metric_type),
        detected_at: anomaly.timestamp,
        data_context: {
          metric_type: anomaly.metric_type,
          value: anomaly.value,
          baseline: anomaly.expected_value,
          deviation: anomaly.deviation,
          affected_sessions: 1,
        },
      }))
  }

  /**
   * Create opportunity-based insights
   */
  private createOpportunityInsights(
    opportunities: OptimizationOpportunity[]
  ): PerformanceInsight[] {
    return opportunities
      .slice(0, 3) // Top 3 opportunities
      .map(opportunity => ({
        id: `opportunity_${opportunity.id}`,
        type: "opportunity" as const,
        severity: opportunity.potential_impact === "high" ? "high" : "medium",
        title: `${opportunity.type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} Opportunity`,
        description: opportunity.description,
        confidence: 0.8, // High confidence for rule-based opportunities
        impact: opportunity.potential_impact,
        category: this.mapOptimizationTypeToCategory(opportunity.type),
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: opportunity.affected_metric,
          value: opportunity.current_value,
          baseline: opportunity.target_value,
          deviation: opportunity.current_value - opportunity.target_value,
        },
      }))
  }

  /**
   * Create performance-based insights
   */
  private createPerformanceInsights(
    summary: PerformanceSummary,
    score: any
  ): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Overall performance grade insight
    if (score.grade === "D" || score.grade === "F") {
      insights.push({
        id: `performance_grade_${Date.now()}`,
        type: "alert",
        severity: score.grade === "F" ? "critical" : "high",
        title: `Poor Performance Score (${score.grade})`,
        description: `Overall performance score is ${score.overall}/100 (Grade ${score.grade}). Multiple performance issues detected requiring attention.`,
        confidence: 0.9,
        impact: "high",
        category: "performance",
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: "overall_score",
          value: score.overall,
          baseline: 80,
          deviation: score.overall - 80,
        },
      })
    }

    return insights
  }

  /**
   * Helper methods
   */
  private filterTrendsByTimeRange(
    trends: MetricsTrend[],
    timeRange: { start: string; end: string }
  ): MetricsTrend[] {
    const start = new Date(timeRange.start).getTime()
    const end = new Date(timeRange.end).getTime()

    return trends.filter(trend => {
      const timestamp = new Date(trend.timestamp).getTime()
      return timestamp >= start && timestamp <= end
    })
  }

  private getDefaultTimeRange(): { start: string; end: string } {
    const end = new Date()
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  private calculateTimePeriod(trends: MetricsTrend[]): string {
    if (trends.length === 0) return "unknown"

    const start = new Date(trends[0].timestamp)
    const end = new Date(trends[trends.length - 1].timestamp)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "1 day"
    if (diffDays < 7) return `${diffDays + 1} days`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`
    return `${Math.floor(diffDays / 30)} months`
  }

  private generateSummary(
    insights: PerformanceInsight[],
    recommendations: PerformanceRecommendation[]
  ) {
    const criticalIssues = insights.filter(
      i => i.severity === "critical"
    ).length
    const improvementOpportunities = insights.filter(
      i => i.type === "opportunity"
    ).length
    const topRecommendations = recommendations.filter(
      r => r.priority_score > this.config.recommendations.priority_threshold
    ).length

    return {
      total_insights: insights.length,
      critical_issues: criticalIssues,
      improvement_opportunities: improvementOpportunities,
      estimated_impact: this.calculateEstimatedImpact(insights),
      top_priority_recommendations: topRecommendations,
    }
  }

  private calculateEstimatedImpact(insights: PerformanceInsight[]): string {
    const highImpactCount = insights.filter(i => i.impact === "high").length
    const mediumImpactCount = insights.filter(i => i.impact === "medium").length

    if (highImpactCount >= 3) return "High potential impact"
    if (highImpactCount >= 1 || mediumImpactCount >= 3)
      return "Medium potential impact"
    return "Low potential impact"
  }

  private calculateOverallConfidence(insights: PerformanceInsight[]): number {
    if (insights.length === 0) return 0
    return (
      insights.reduce((sum, insight) => sum + insight.confidence, 0) /
      insights.length
    )
  }

  private mapMetricToCategory(
    metricType: string
  ): "performance" | "memory" | "cpu" | "rendering" {
    if (metricType === "fps") return "performance"
    if (metricType.includes("memory")) return "memory"
    if (metricType.includes("cpu")) return "cpu"
    return "performance"
  }

  private mapOptimizationTypeToCategory(
    type: string
  ): "performance" | "memory" | "cpu" | "rendering" {
    if (type.includes("memory")) return "memory"
    if (type.includes("cpu")) return "cpu"
    if (type.includes("fps")) return "performance"
    return "performance"
  }

}
