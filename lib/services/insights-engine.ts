import {
  getPerformanceSummary,
  getPerformanceTrends,
  getDevicePerformanceData,
  PerformanceSummary,
  MetricsTrend,
} from "@/lib/performance-data"
import { getRoutePerformanceAnalysis } from "@/lib/route-performance-data"
import {
  detectRoutePerformanceAnomalies,
  compareRoutesAgainstGlobalPerformance,
  analyzeRoutePerformanceTrends,
  identifyProblematicRoutes,
  RouteAnomalyDetection,
  RouteComparison,
  RouteTrendAnalysis,
} from "@/lib/utils/route-performance-correlation"
import { StatisticalAnalysisUtils } from "@/lib/utils/statistical-analysis"
import { PerformanceScoringEngine } from "@/lib/utils/performance-scoring"
import { RecommendationEngine } from "./recommendation-engine"
import { UserJourneyTracker } from "./user-journey-tracker"
import { analyzeJourneyAbandonmentPatterns } from "@/lib/utils/journey-analysis"
import {
  InsightsReport,
  PerformanceInsight,
  PerformanceRecommendation,
  AnomalyDetection,
  OptimizationOpportunity,
  InsightsEngineConfig,
  TrendAnalysis,
  PerformancePrediction,
  SeasonalPattern,
  EarlyWarningAlert,
  ProactiveRecommendation,
} from "@/types/insights"
import { RoutePerformanceAnalysis } from "@/types/route-performance"
import { UserJourney, JourneyAbandonmentPattern } from "@/types/user-journey"
import { PerformancePredictionEngine } from "@/lib/utils/performance-prediction"
import { EarlyWarningEngine } from "./early-warning-engine"
import { TimeSeriesAnalysis } from "@/lib/utils/statistical-analysis"

export class PerformanceInsightsEngine {
  private statisticalAnalysis = StatisticalAnalysisUtils
  private scoringEngine: PerformanceScoringEngine
  private recommendationEngine: RecommendationEngine
  private journeyTracker: UserJourneyTracker
  private predictionEngine: PerformancePredictionEngine
  private earlyWarningEngine: EarlyWarningEngine
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
    this.journeyTracker = new UserJourneyTracker()
    this.predictionEngine = new PerformancePredictionEngine()
    this.earlyWarningEngine = new EarlyWarningEngine()
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
    const [performanceData, trendData, deviceData, routeData] =
      await Promise.all([
        getPerformanceSummary(),
        getPerformanceTrends(),
        getDevicePerformanceData(),
        getRoutePerformanceAnalysis(),
      ])

    console.log("🔍 Performance Data:", {
      performanceData,
      trendDataLength: trendData.length,
      deviceDataLength: deviceData.length,
      routeDataRoutesCount: routeData.routes.length,
      routeDataSessionsCount: routeData.summary.totalSessions,
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

    // 7. Generate insights (including route performance and journey insights)
    const journeyInsights = await this.createJourneyInsights()

    const insights = [
      ...this.createTrendInsights(trends),
      ...this.createAnomalyInsights(anomalies),
      ...this.createOpportunityInsights(optimizationOpportunities),
      ...this.createPerformanceInsights(performanceData, performanceScore),
      ...this.createRoutePerformanceInsights(routeData, performanceData),
      ...journeyInsights,
    ]

    // 8. Generate predictions and seasonal patterns (Issue #30)
    const predictions = await this.generatePredictiveInsights(
      routeData,
      filteredTrends
    )
    const seasonalPatterns = this.detectSeasonalPatterns(filteredTrends)

    // 9. Generate early warnings based on predictions
    const earlyWarnings = await this.earlyWarningEngine.generateEarlyWarnings(
      predictions,
      [], // Route predictions would go here if available
      seasonalPatterns,
      performanceData,
      filteredTrends
    )

    // 10. Add predictive insights to the main insights array
    insights.push(...this.createPredictiveInsights(predictions))
    insights.push(...this.createSeasonalInsights(seasonalPatterns))
    insights.push(...this.createEarlyWarningInsights(earlyWarnings))

    // 11. Generate recommendations using recommendation engine
    console.log(
      "📊 Generated Insights:",
      insights.length,
      insights.map(i => ({
        type: i.type,
        category: i.category,
        severity: i.severity,
        title: i.title,
      }))
    )
    console.log(
      "🎯 Optimization Opportunities:",
      optimizationOpportunities.length
    )
    console.log("🔮 Predictions Generated:", predictions.length)
    console.log("📅 Seasonal Patterns:", seasonalPatterns.length)
    console.log("⚠️ Early Warnings:", earlyWarnings.length)

    const recommendations =
      await this.recommendationEngine.generateRecommendations(
        insights,
        performanceData,
        optimizationOpportunities
      )

    // 12. Generate proactive recommendations based on predictions
    const proactiveRecommendations =
      await this.recommendationEngine.generateProactiveRecommendations(
        predictions,
        seasonalPatterns,
        earlyWarnings
      )

    console.log("💡 Generated Recommendations:", recommendations.length)
    console.log(
      "🚀 Proactive Recommendations:",
      proactiveRecommendations.length
    )

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
      insights: insights.slice(0, 25), // Increased limit for predictive insights
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
      predictions, // NEW: Performance predictions
      seasonal_patterns: seasonalPatterns, // NEW: Seasonal patterns
      early_warnings: earlyWarnings, // NEW: Early warning alerts
      proactive_recommendations: proactiveRecommendations, // NEW: Proactive recommendations
      metadata: {
        analysis_duration_ms: analysisDuration,
        data_points_analyzed: dataPointsAnalyzed,
        confidence_level: this.calculateOverallConfidence(insights),
        prediction_confidence: this.calculatePredictionConfidence(predictions),
        seasonal_patterns_detected: seasonalPatterns.length,
        early_warnings_generated: earlyWarnings.length,
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
   * Create route performance insights
   */
  private createRoutePerformanceInsights(
    routeAnalysis: RoutePerformanceAnalysis,
    globalPerformance: PerformanceSummary
  ): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Skip if no route data available
    if (!routeAnalysis.routes.length) {
      return insights
    }

    // 1. Route Performance Anomalies
    const routeAnomalies = detectRoutePerformanceAnomalies(routeAnalysis)
    insights.push(...this.createRouteAnomalyInsights(routeAnomalies))

    // 2. Route vs Global Performance
    const routeComparisons =
      compareRoutesAgainstGlobalPerformance(routeAnalysis)
    insights.push(...this.createRouteComparisonInsights(routeComparisons))

    // 3. Route Performance Degradation/Improvement Trends
    const routeTrends = analyzeRoutePerformanceTrends(routeAnalysis)
    insights.push(...this.createRouteTrendInsights(routeTrends))

    return insights.slice(0, 10) // Limit route insights to prevent overwhelming
  }

  /**
   * Create insights from route anomaly detections
   */
  private createRouteAnomalyInsights(
    anomalies: RouteAnomalyDetection[]
  ): PerformanceInsight[] {
    return anomalies.slice(0, 5).map(anomaly => ({
      id: `route_anomaly_${anomaly.route_pattern}_${anomaly.metric_type}_${Date.now()}`,
      type: "route_performance_anomaly" as const,
      severity: anomaly.anomaly_severity,
      title: `${anomaly.route_name} Route ${anomaly.metric_type.toUpperCase()} Anomaly`,
      description: `Route "${anomaly.route_pattern}" shows unusual ${anomaly.metric_type} performance: ${anomaly.current_value.toFixed(1)} vs expected ${anomaly.expected_value.toFixed(1)} (${anomaly.deviation_from_norm > 0 ? "+" : ""}${anomaly.deviation_from_norm.toFixed(1)}% deviation)`,
      confidence: anomaly.sessions_count >= 10 ? 0.9 : 0.7,
      impact:
        anomaly.anomaly_severity === "critical"
          ? "high"
          : anomaly.anomaly_severity === "high"
            ? "medium"
            : "low",
      category: this.mapMetricToCategory(anomaly.metric_type),
      detected_at: new Date().toISOString(),
      data_context: {
        metric_type: anomaly.metric_type,
        value: anomaly.current_value,
        baseline: anomaly.expected_value,
        deviation: anomaly.deviation_from_norm,
        affected_sessions: anomaly.sessions_count,
        affected_devices: anomaly.unique_devices,
        route_context: {
          route_name: anomaly.route_name,
          route_pattern: anomaly.route_pattern,
          affected_routes: [anomaly.route_pattern],
          route_specific_metrics: {
            sessions_count: anomaly.sessions_count,
            unique_devices: anomaly.unique_devices,
            avg_screen_duration: 0, // Will be populated by correlation utility
          },
        },
      },
    }))
  }

  /**
   * Create insights from route vs global performance comparisons
   */
  private createRouteComparisonInsights(
    comparisons: RouteComparison[]
  ): PerformanceInsight[] {
    return comparisons.slice(0, 3).map(comparison => ({
      id: `route_comparison_${comparison.route_pattern}_${comparison.metric_type}_${Date.now()}`,
      type: "route_vs_global_performance" as const,
      severity:
        comparison.deviation_percentage > 50
          ? "high"
          : comparison.deviation_percentage > 30
            ? "medium"
            : "low",
      title: `${comparison.route_name} Route ${comparison.comparison_type === "underperforming" ? "Underperforms" : "Outperforms"} App Average`,
      description: `Route "${comparison.route_pattern}" ${comparison.comparison_type === "underperforming" ? "underperforms" : "outperforms"} app average ${comparison.metric_type} by ${comparison.deviation_percentage.toFixed(1)}%`,
      confidence: comparison.confidence,
      impact:
        comparison.deviation_percentage > 40
          ? "high"
          : comparison.deviation_percentage > 20
            ? "medium"
            : "low",
      category: this.mapMetricToCategory(comparison.metric_type),
      detected_at: new Date().toISOString(),
      data_context: {
        metric_type: comparison.metric_type,
        value: comparison.deviation_percentage,
        baseline: 0,
        deviation:
          comparison.comparison_type === "underperforming"
            ? -comparison.deviation_percentage
            : comparison.deviation_percentage,
        affected_sessions: comparison.sessions_count,
        route_context: {
          route_name: comparison.route_name,
          route_pattern: comparison.route_pattern,
          affected_routes: [comparison.route_pattern],
          route_specific_metrics: {
            sessions_count: comparison.sessions_count,
            unique_devices: 0, // Will be populated by correlation utility
            avg_screen_duration: 0,
          },
        },
      },
    }))
  }

  /**
   * Create insights from route performance trends
   */
  private createRouteTrendInsights(
    trends: RouteTrendAnalysis[]
  ): PerformanceInsight[] {
    return trends
      .filter(trend => trend.trend_significance !== "low")
      .slice(0, 3)
      .map(trend => ({
        id: `route_trend_${trend.route_pattern}_${trend.metric_type}_${Date.now()}`,
        type: "route_performance_degradation" as const,
        severity:
          trend.trend_significance === "high" &&
          trend.trend_direction === "degrading"
            ? "high"
            : "medium",
        title: `${trend.route_name} Route Performance ${trend.trend_direction === "degrading" ? "Declining" : "Improving"}`,
        description: `Route "${trend.route_pattern}" shows ${trend.trend_significance} ${trend.trend_direction} trend in ${trend.metric_type} performance over time (${trend.sessions_analyzed} sessions analyzed)`,
        confidence: Math.min(0.9, 0.5 + (trend.sessions_analyzed / 20) * 0.4), // Higher confidence with more sessions
        impact: trend.trend_significance === "high" ? "high" : "medium",
        category: this.mapMetricToCategory(trend.metric_type),
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: trend.metric_type,
          value: trend.trend_strength,
          baseline: 0,
          deviation:
            trend.trend_direction === "degrading"
              ? -trend.trend_strength
              : trend.trend_strength,
          affected_sessions: trend.sessions_analyzed,
          time_window: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          route_context: {
            route_name: trend.route_name,
            route_pattern: trend.route_pattern,
            affected_routes: [trend.route_pattern],
            route_specific_metrics: {
              sessions_count: trend.sessions_analyzed,
              unique_devices: 0, // Will be populated by correlation utility
              avg_screen_duration: 0,
            },
          },
        },
      }))
  }

  /**
   * Create journey-specific insights from user journey analysis
   */
  private async createJourneyInsights(): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = []

    try {
      // Reconstruct user journeys
      const journeys = await this.journeyTracker.reconstructJourneys()

      if (journeys.length === 0) {
        return insights
      }

      // Analyze journey patterns
      const patterns =
        await this.journeyTracker.analyzeJourneyPatterns(journeys)

      // Analyze abandonment patterns
      const abandonmentPatterns = analyzeJourneyAbandonmentPatterns(journeys)

      // Generate journey-specific insights
      insights.push(
        ...this.createJourneyAbandonmentInsights(abandonmentPatterns)
      )
      insights.push(...this.createJourneyBottleneckInsights(journeys))
      insights.push(...this.createJourneyOptimizationInsights(patterns))

      return insights
    } catch (error) {
      console.error("Error generating journey insights:", error)
      return insights
    }
  }

  /**
   * Create insights from journey abandonment patterns
   */
  private createJourneyAbandonmentInsights(
    abandonmentPatterns: JourneyAbandonmentPattern[]
  ): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Focus on top 3 abandonment points
    abandonmentPatterns.slice(0, 3).forEach(pattern => {
      if (pattern.frequency >= 3) {
        insights.push({
          id: crypto.randomUUID(),
          type: "journey_abandonment_pattern",
          title: `High User Abandonment at ${pattern.abandonment_point}`,
          description: `Users frequently abandon their journey at ${pattern.abandonment_point} (${pattern.frequency} instances)`,
          severity:
            pattern.frequency > 10
              ? "high"
              : pattern.frequency > 5
                ? "medium"
                : "low",
          confidence: Math.min(0.9, pattern.frequency / 20),
          impact:
            pattern.frequency > 10
              ? "high"
              : pattern.frequency > 5
                ? "medium"
                : "low",
          category: "performance",
          detected_at: new Date().toISOString(),
          data_context: {
            metric_type: "journey_abandonment",
            value: pattern.frequency,
            baseline: 0,
            deviation: pattern.frequency,
            affected_sessions: pattern.frequency,
            route_context: {
              route_name: pattern.abandonment_point,
              route_pattern: pattern.abandonment_point,
              affected_routes: pattern.common_preceding_routes,
              route_specific_metrics: {
                sessions_count: pattern.frequency,
                unique_devices: pattern.frequency, // Approximation
                avg_screen_duration: pattern.avg_time_to_abandonment,
              },
            },
          },
        })
      }
    })

    return insights
  }

  /**
   * Create insights from journey bottleneck analysis
   */
  private createJourneyBottleneckInsights(
    journeys: UserJourney[]
  ): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Analyze bottlenecks across all journeys
    const allBottlenecks = journeys.flatMap(
      journey => journey.bottleneck_points
    )
    const bottleneckCounts = new Map<
      string,
      { count: number; avgImpact: number }
    >()

    allBottlenecks.forEach(bottleneck => {
      const key = bottleneck.route_pattern
      if (!bottleneckCounts.has(key)) {
        bottleneckCounts.set(key, { count: 0, avgImpact: 0 })
      }
      const data = bottleneckCounts.get(key)!
      data.count++
      data.avgImpact =
        (data.avgImpact * (data.count - 1) + bottleneck.impact_score) /
        data.count
    })

    // Create insights for significant bottlenecks
    Array.from(bottleneckCounts.entries())
      .filter(([_, data]) => data.count >= 3)
      .sort((a, b) => b[1].avgImpact - a[1].avgImpact)
      .slice(0, 3)
      .forEach(([route, data]) => {
        insights.push({
          id: crypto.randomUUID(),
          type: "journey_bottleneck_detection",
          title: `Journey Bottleneck Detected at ${route}`,
          description: `Route ${route} consistently causes performance issues across user journeys (${data.count} instances)`,
          severity:
            data.avgImpact > 60
              ? "high"
              : data.avgImpact > 30
                ? "medium"
                : "low",
          confidence: Math.min(0.9, data.count / 10),
          impact:
            data.avgImpact > 60
              ? "high"
              : data.avgImpact > 30
                ? "medium"
                : "low",
          category: "performance",
          detected_at: new Date().toISOString(),
          data_context: {
            metric_type: "journey_bottleneck",
            value: data.avgImpact,
            baseline: 0,
            deviation: data.avgImpact,
            affected_sessions: data.count,
            route_context: {
              route_name: route,
              route_pattern: route,
              affected_routes: [route],
              route_specific_metrics: {
                sessions_count: data.count,
                unique_devices: data.count, // Approximation
                avg_screen_duration: 5000, // Would calculate from actual data
              },
            },
          },
        })
      })

    return insights
  }

  /**
   * Create insights from journey optimization opportunities
   */
  private createJourneyOptimizationInsights(
    patterns: any[]
  ): PerformanceInsight[] {
    const insights: PerformanceInsight[] = []

    // Focus on patterns with high optimization potential
    patterns
      .filter(pattern => pattern.optimization_potential > 40)
      .sort((a, b) => b.optimization_potential - a.optimization_potential)
      .slice(0, 2)
      .forEach(pattern => {
        insights.push({
          id: crypto.randomUUID(),
          type: "journey_optimization_opportunity",
          title: `Journey Optimization Opportunity: ${pattern.route_sequence.join(" → ")}`,
          description: `User journey pattern with ${pattern.frequency} occurrences has ${pattern.optimization_potential.toFixed(1)}% optimization potential`,
          severity: pattern.optimization_potential > 70 ? "high" : "medium",
          confidence: Math.min(0.9, pattern.frequency / 10),
          impact: pattern.optimization_potential > 70 ? "high" : "medium",
          category: "performance",
          detected_at: new Date().toISOString(),
          data_context: {
            metric_type: "journey_optimization",
            value: pattern.optimization_potential,
            baseline: 0,
            deviation: pattern.optimization_potential,
            affected_sessions: pattern.frequency,
            route_context: {
              route_name: pattern.route_sequence.join(" → "),
              route_pattern: pattern.route_sequence.join(" -> "),
              affected_routes: pattern.route_sequence,
              route_specific_metrics: {
                sessions_count: pattern.frequency,
                unique_devices: pattern.frequency,
                avg_screen_duration: pattern.avg_journey_duration,
              },
            },
          },
        })
      })

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

  /**
   * Enhanced Predictive Analysis Methods for Issue #30
   */

  /**
   * Generate predictive insights using multiple models
   */
  private async generatePredictiveInsights(
    routeData: RoutePerformanceAnalysis | null,
    trends: MetricsTrend[]
  ): Promise<PerformancePrediction[]> {
    const predictions: PerformancePrediction[] = []

    try {
      if (trends.length >= 10) {
        const fpsPrediction = await this.generateMetricPrediction(
          trends,
          "fps",
          "24h"
        )
        if (fpsPrediction) predictions.push(fpsPrediction)

        const memoryPrediction = await this.generateMetricPrediction(
          trends,
          "memory_usage",
          "24h"
        )
        if (memoryPrediction) predictions.push(memoryPrediction)
      }
    } catch (error) {
      console.warn("Error generating predictive insights:", error)
    }

    return predictions
  }

  private async generateMetricPrediction(
    trends: MetricsTrend[],
    metric: "fps" | "memory_usage" | "cpu_usage",
    timeHorizon: "1h" | "24h" | "7d" | "30d"
  ): Promise<PerformancePrediction | null> {
    try {
      const values = trends.map(t => t[metric] as number).filter(v => !isNaN(v))
      if (values.length < 5) return null

      const forecast = TimeSeriesAnalysis.exponentialSmoothing(values, 0.3, 1)
      const predictedValue = forecast[forecast.length - 1]
      const volatility = this.calculateStandardDeviation(values.slice(-10))
      const marginOfError = Math.min(volatility * 1.5, predictedValue * 0.3)

      return {
        prediction_id: `${metric}_${timeHorizon}_${Date.now()}`,
        metric_type: metric,
        predicted_value: Math.max(0, predictedValue),
        confidence_interval: [
          Math.max(0, predictedValue - marginOfError),
          predictedValue + marginOfError,
        ],
        time_horizon: timeHorizon,
        probability_of_issue: this.calculateProbabilityOfIssue(
          metric,
          predictedValue
        ),
        contributing_factors: [
          {
            factor_name: "Historical performance pattern",
            impact_weight: 1.0,
            description: `Prediction based on historical ${metric} data`,
          },
        ],
        recommended_actions: [`Monitor ${metric} performance closely`],
        model_used: "exponential_smoothing",
      }
    } catch (error) {
      return null
    }
  }

  private detectSeasonalPatterns(trends: MetricsTrend[]): SeasonalPattern[] {
    if (trends.length < 24) return []
    try {
      return TimeSeriesAnalysis.detectSeasonalPatterns(trends, ["daily"], "fps")
        .filter(pattern => pattern.confidence > 0.5)
        .slice(0, 3)
    } catch (error) {
      return []
    }
  }

  private createPredictiveInsights(
    predictions: PerformancePrediction[]
  ): PerformanceInsight[] {
    return predictions
      .filter(p => p.probability_of_issue > 0.6)
      .map(prediction => ({
        id: `prediction_insight_${prediction.prediction_id}`,
        type: "predicted_performance_degradation" as const,
        severity:
          prediction.probability_of_issue > 0.8
            ? ("high" as const)
            : ("medium" as const),
        title: `${prediction.metric_type} Performance Prediction`,
        description: `Predicted ${prediction.metric_type} value: ${prediction.predicted_value.toFixed(1)}`,
        confidence: prediction.probability_of_issue * 0.8,
        impact:
          prediction.probability_of_issue > 0.8
            ? ("high" as const)
            : ("medium" as const),
        category: this.mapMetricToCategory(prediction.metric_type),
        detected_at: new Date().toISOString(),
        data_context: {
          metric_type: prediction.metric_type,
          value: prediction.predicted_value,
          baseline: 50,
          deviation: prediction.predicted_value - 50,
        },
      }))
  }

  private createSeasonalInsights(
    patterns: SeasonalPattern[]
  ): PerformanceInsight[] {
    return patterns.map(pattern => ({
      id: `seasonal_insight_${pattern.pattern_id}`,
      type: "seasonal_pattern_detected" as const,
      severity: "medium" as const,
      title: `${pattern.pattern_type} Pattern in ${pattern.metric_type}`,
      description: `Seasonal pattern detected with ${(pattern.confidence * 100).toFixed(0)}% confidence`,
      confidence: pattern.confidence,
      impact: "medium" as const,
      category: this.mapMetricToCategory(pattern.metric_type),
      detected_at: new Date().toISOString(),
      data_context: {
        metric_type: pattern.metric_type,
        value: pattern.amplitude,
        baseline: 0,
        deviation: pattern.amplitude,
      },
    }))
  }

  private createEarlyWarningInsights(
    alerts: EarlyWarningAlert[]
  ): PerformanceInsight[] {
    return alerts.map(alert => ({
      id: `early_warning_insight_${alert.id}`,
      type: "early_warning_alert" as const,
      severity: alert.severity,
      title: `Early Warning: ${alert.type.replace("_", " ")}`,
      description: `Early warning detected in ${alert.time_to_issue}`,
      confidence: alert.confidence,
      impact:
        alert.severity === "critical" ? ("high" as const) : ("medium" as const),
      category: "performance" as const,
      detected_at: new Date().toISOString(),
      data_context: {
        metric_type: alert.type,
        value: 1,
        baseline: 0,
        deviation: 1,
      },
    }))
  }

  private calculatePredictionConfidence(
    predictions: PerformancePrediction[]
  ): number {
    if (predictions.length === 0) return 0
    return (
      predictions.reduce(
        (sum, pred) => sum + (1 - pred.probability_of_issue),
        0
      ) / predictions.length
    )
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
    return Math.sqrt(variance)
  }

  private calculateProbabilityOfIssue(
    metric: string,
    predictedValue: number
  ): number {
    switch (metric) {
      case "fps":
        return predictedValue < 45 ? 0.7 : 0.3
      case "memory_usage":
        return predictedValue > 400 ? 0.7 : 0.3
      default:
        return 0.4
    }
  }
}
