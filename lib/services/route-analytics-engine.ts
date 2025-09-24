import {
  RoutePerformanceAnalysis,
  RoutePerformanceData,
  RoutePerformanceSession,
} from "@/types/route-performance"
import {
  RouteAnalyticsReport,
  RouteCorrelationAnalysis,
  RoutePerformancePrediction,
  NavigationFlowAnalysis,
  CrossRoutePattern,
  RoutePerformanceInsight,
  RouteSequence,
} from "@/types/route-analytics"
import { RouteCorrelationAnalyzer } from "@/lib/utils/route-correlation"
import { PerformancePredictionEngine } from "@/lib/utils/performance-prediction"
import { NavigationFlowAnalyzer } from "@/lib/utils/navigation-flow-analyzer"

export class RouteAnalyticsEngine {
  private correlationAnalyzer: RouteCorrelationAnalyzer
  private predictionEngine: PerformancePredictionEngine
  private flowAnalyzer: NavigationFlowAnalyzer

  constructor() {
    this.correlationAnalyzer = new RouteCorrelationAnalyzer()
    this.predictionEngine = new PerformancePredictionEngine()
    this.flowAnalyzer = new NavigationFlowAnalyzer()
  }

  /**
   * Generate comprehensive route analytics insights
   * Performance requirement: Process 1000+ sessions in < 500ms
   */
  async generateAdvancedInsights(
    routeData: RoutePerformanceAnalysis
  ): Promise<RouteAnalyticsReport> {
    const startTime = performance.now()

    // Parallel execution for performance optimization
    const [correlations, predictions, flows, patterns] = await Promise.all([
      this.analyzeRouteCorrelations(routeData),
      this.generatePerformancePredictions(routeData),
      this.analyzeNavigationFlows(routeData),
      this.detectCrossRoutePatterns(routeData),
    ])

    const processingTime = performance.now() - startTime

    // Generate seasonal patterns and proactive recommendations
    const seasonalPatterns = this.generateSeasonalPatterns(routeData)
    const proactiveRecommendations = this.generateProactiveRecommendations(
      correlations,
      predictions,
      patterns,
      routeData
    )

    return {
      id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      processing_time_ms: processingTime,
      route_correlations: correlations,
      performance_predictions: predictions,
      navigation_flows: flows,
      cross_route_patterns: patterns,
      insights: this.generateRouteInsights(
        correlations,
        predictions,
        flows,
        patterns
      ),
      performance_meta: {
        sessions_processed: routeData.summary.totalSessions,
        routes_analyzed: routeData.routes.length,
        meets_performance_target: processingTime < 500,
      },
      seasonal_patterns: seasonalPatterns,
      proactive_recommendations: proactiveRecommendations,
    }
  }

  /**
   * Analyze correlations between different routes
   */
  async analyzeRouteCorrelations(
    routeData: RoutePerformanceAnalysis
  ): Promise<RouteCorrelationAnalysis[]> {
    const correlations: RouteCorrelationAnalysis[] = []
    const routes = routeData.routes

    console.log(`🔍 Starting correlation analysis with ${routes.length} routes`)

    // Analyze all route pairs for correlations
    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        const sourceRoute = routes[i]
        const targetRoute = routes[j]

        console.log(`📊 Analyzing correlation between:`, {
          source: sourceRoute.routePattern,
          target: targetRoute.routePattern,
          sourceSessions: sourceRoute.sessions?.length || 0,
          targetSessions: targetRoute.sessions?.length || 0,
        })

        // Calculate correlation between routes
        const correlation =
          await this.correlationAnalyzer.analyzeRouteRelationship(
            sourceRoute,
            targetRoute,
            routeData.appAverages
          )

        console.log(`📈 Correlation result:`, {
          strength: correlation.correlation_strength,
          impact: correlation.performance_impact,
          threshold: 0.05,
          willInclude: correlation.correlation_strength > 0.05,
        })

        // Significantly lowered correlation threshold to 0.05 for maximum insights with limited data
        if (correlation.correlation_strength > 0.05) {
          correlations.push(correlation)
        }
      }
    }

    console.log(`✅ Found ${correlations.length} correlations above threshold`)

    return correlations.sort(
      (a, b) => b.correlation_strength - a.correlation_strength
    )
  }

  /**
   * Generate performance predictions for routes
   */
  async generatePerformancePredictions(
    routeData: RoutePerformanceAnalysis
  ): Promise<RoutePerformancePrediction[]> {
    const predictions: RoutePerformancePrediction[] = []

    for (const route of routeData.routes) {
      // Only predict for routes with sufficient historical data
      // Lowered threshold to 1 session for maximum coverage
      if (route.totalSessions >= 1) {
        const prediction = await this.predictionEngine.predictRoutePerformance(
          route,
          routeData.appAverages
        )
        predictions.push(prediction)
      }
    }

    return predictions.sort((a, b) => b.forecast_accuracy - a.forecast_accuracy)
  }

  /**
   * Analyze navigation flows between routes
   */
  async analyzeNavigationFlows(
    routeData: RoutePerformanceAnalysis
  ): Promise<NavigationFlowAnalysis[]> {
    // Extract route sequences from session data
    const routeSequences = this.extractRouteSequences(routeData)

    return this.flowAnalyzer.analyzeFlows(routeSequences, routeData.routes)
  }

  /**
   * Detect cross-route performance patterns
   */
  async detectCrossRoutePatterns(
    routeData: RoutePerformanceAnalysis
  ): Promise<CrossRoutePattern[]> {
    const patterns: CrossRoutePattern[] = []

    // Detect memory leak chains
    const memoryLeakChains = this.detectMemoryLeakChains(routeData.routes)
    patterns.push(...memoryLeakChains)

    // Detect CPU cascade patterns
    const cpuCascades = this.detectCpuCascadePatterns(routeData.routes)
    patterns.push(...cpuCascades)

    // Detect FPS recovery patterns
    const fpsRecoveryPatterns = this.detectFpsRecoveryPatterns(routeData.routes)
    patterns.push(...fpsRecoveryPatterns)

    return patterns.sort((a, b) => b.pattern_strength - a.pattern_strength)
  }

  /**
   * Generate actionable insights from all analytics
   */
  private generateRouteInsights(
    correlations: RouteCorrelationAnalysis[],
    predictions: RoutePerformancePrediction[],
    flows: NavigationFlowAnalysis[],
    patterns: CrossRoutePattern[]
  ): RoutePerformanceInsight[] {
    const insights: RoutePerformanceInsight[] = []

    // Generate insights from correlations
    correlations.slice(0, 3).forEach(correlation => {
      insights.push({
        route_pattern: correlation.source_route,
        route_name:
          correlation.source_route.split("/").pop() || correlation.source_route,
        insight_type: "correlation",
        insight_data: correlation,
        confidence: correlation.confidence_level,
        impact_assessment:
          correlation.performance_impact === "negative" ? "high" : "medium",
        actionable_recommendation:
          this.generateCorrelationRecommendation(correlation),
      })
    })

    // Generate insights from predictions
    predictions.slice(0, 3).forEach(prediction => {
      insights.push({
        route_pattern: prediction.route_pattern,
        route_name:
          prediction.route_pattern.split("/").pop() || prediction.route_pattern,
        insight_type: "prediction",
        insight_data: prediction,
        confidence: prediction.forecast_accuracy,
        impact_assessment:
          prediction.recommendation_priority === "high"
            ? "high"
            : prediction.recommendation_priority === "medium"
              ? "medium"
              : "low",
        actionable_recommendation:
          this.generatePredictionRecommendation(prediction),
      })
    })

    // Generate insights from navigation flows
    flows.slice(0, 2).forEach(flow => {
      insights.push({
        route_pattern: flow.route_sequence.join(" -> "),
        route_name: `Flow: ${flow.route_sequence.length} routes`,
        insight_type: "flow_analysis",
        insight_data: flow,
        confidence: 0.8,
        impact_assessment: flow.user_impact_score > 50 ? "high" : "medium",
        actionable_recommendation: this.generateFlowRecommendation(flow),
      })
    })

    // Generate insights from cross-route patterns
    patterns.slice(0, 2).forEach(pattern => {
      insights.push({
        route_pattern: pattern.affected_routes.join(", "),
        route_name: `Pattern: ${pattern.pattern_type}`,
        insight_type: "pattern_detection",
        insight_data: pattern,
        confidence: pattern.detection_confidence,
        impact_assessment: pattern.pattern_strength > 0.4 ? "high" : "medium",
        actionable_recommendation: this.generatePatternRecommendation(pattern),
      })
    })

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  private extractRouteSequences(
    routeData: RoutePerformanceAnalysis
  ): RouteSequence[] {
    // Group sessions by device and sort by timestamp to get navigation sequences
    const deviceSessions = new Map<string, RoutePerformanceSession[]>()

    routeData.routes.forEach(route => {
      route.sessions.forEach(session => {
        if (!deviceSessions.has(session.deviceId)) {
          deviceSessions.set(session.deviceId, [])
        }
        deviceSessions.get(session.deviceId)!.push(session)
      })
    })

    const sequences: RouteSequence[] = []

    deviceSessions.forEach((sessions, deviceId) => {
      const sortedSessions = sessions.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      // Create sequences of consecutive route navigation
      let currentSequence: RouteSequence | null = null

      sortedSessions.forEach(session => {
        if (!currentSequence) {
          currentSequence = {
            device_id: deviceId,
            routes: [session.routePattern],
            performance_scores: [
              this.calculateSessionPerformanceScore(session),
            ],
            timestamps: [session.timestamp],
          }
        } else {
          const timeDiff =
            new Date(session.timestamp).getTime() -
            new Date(
              currentSequence.timestamps[currentSequence.timestamps.length - 1]
            ).getTime()

          // If within 30 minutes, add to current sequence
          if (timeDiff <= 30 * 60 * 1000) {
            currentSequence.routes.push(session.routePattern)
            currentSequence.performance_scores.push(
              this.calculateSessionPerformanceScore(session)
            )
            currentSequence.timestamps.push(session.timestamp)
          } else {
            // End current sequence and start new one
            if (currentSequence.routes.length >= 2) {
              sequences.push(currentSequence)
            }
            currentSequence = {
              device_id: deviceId,
              routes: [session.routePattern],
              performance_scores: [
                this.calculateSessionPerformanceScore(session),
              ],
              timestamps: [session.timestamp],
            }
          }
        }
      })

      // Add final sequence if it has multiple routes
      if (
        currentSequence &&
        (currentSequence as RouteSequence).routes.length >= 2
      ) {
        sequences.push(currentSequence as RouteSequence)
      }
    })

    return sequences
  }

  private calculateSessionPerformanceScore(
    session: RoutePerformanceSession
  ): number {
    // Simple performance score calculation for session
    const fpsScore = Math.min(100, (session.avgFps / 60) * 100)
    const memoryScore = Math.max(0, 100 - (session.avgMemory / 1000) * 100)
    const cpuScore = Math.max(0, 100 - session.avgCpu)

    return (fpsScore + memoryScore + cpuScore) / 3
  }

  private detectMemoryLeakChains(
    routes: RoutePerformanceData[]
  ): CrossRoutePattern[] {
    const patterns: CrossRoutePattern[] = []

    // Look for routes with progressively increasing memory usage
    const sortedByMemory = routes.sort((a, b) => a.avgMemory - b.avgMemory)

    for (let i = 0; i < sortedByMemory.length - 2; i++) {
      const route1 = sortedByMemory[i]
      const route2 = sortedByMemory[i + 1]
      const route3 = sortedByMemory[i + 2]

      const memoryIncrease1 =
        (route2.avgMemory - route1.avgMemory) / route1.avgMemory
      const memoryIncrease2 =
        (route3.avgMemory - route2.avgMemory) / route2.avgMemory

      if (memoryIncrease1 > 0.2 && memoryIncrease2 > 0.2) {
        patterns.push({
          pattern_id: `memory_leak_${Date.now()}_${i}`,
          pattern_type: "memory_leak_chain",
          affected_routes: [
            route1.routePattern,
            route2.routePattern,
            route3.routePattern,
          ],
          pattern_strength: Math.min(memoryIncrease1 + memoryIncrease2, 1),
          detection_confidence: 0.8,
          suggested_mitigation: [
            "Implement memory profiling for these routes",
            "Check for object leaks and circular references",
            "Add memory cleanup in route transitions",
            "Consider implementing memory pressure monitoring",
          ],
        })
      }
    }

    return patterns
  }

  private detectCpuCascadePatterns(
    routes: RoutePerformanceData[]
  ): CrossRoutePattern[] {
    const patterns: CrossRoutePattern[] = []

    // Look for routes that consistently have high CPU usage together
    const highCpuRoutes = routes.filter(route => route.avgCpu > 60)

    if (highCpuRoutes.length >= 2) {
      patterns.push({
        pattern_id: `cpu_cascade_${Date.now()}`,
        pattern_type: "cpu_cascade",
        affected_routes: highCpuRoutes.map(route => route.routePattern),
        pattern_strength: Math.min(highCpuRoutes.length / routes.length, 1),
        detection_confidence: 0.7,
        suggested_mitigation: [
          "Optimize CPU-intensive operations in these routes",
          "Consider route-level performance budgeting",
          "Implement CPU throttling for background tasks",
          "Review component rendering optimizations",
        ],
      })
    }

    return patterns
  }

  private detectFpsRecoveryPatterns(
    routes: RoutePerformanceData[]
  ): CrossRoutePattern[] {
    const patterns: CrossRoutePattern[] = []

    // Look for routes that show FPS improvement trends
    const improvingRoutes = routes.filter(
      route => route.performanceTrend === "improving"
    )

    if (improvingRoutes.length >= 2) {
      patterns.push({
        pattern_id: `fps_recovery_${Date.now()}`,
        pattern_type: "fps_recovery",
        affected_routes: improvingRoutes.map(route => route.routePattern),
        pattern_strength: improvingRoutes.length / routes.length,
        detection_confidence: 0.8,
        suggested_mitigation: [
          "Analyze successful optimization strategies",
          "Apply similar improvements to other routes",
          "Document best practices for performance improvements",
          "Set up performance monitoring to maintain gains",
        ],
      })
    }

    return patterns
  }

  // Recommendation generation helpers
  private generateCorrelationRecommendation(
    correlation: RouteCorrelationAnalysis
  ): string {
    switch (correlation.correlation_type) {
      case "memory_leak":
        return `Address potential memory leak pattern between ${correlation.source_route} and ${correlation.target_route}. Consider implementing memory cleanup mechanisms.`
      case "cpu_spike":
        return `Optimize CPU usage correlation between routes. Consider load balancing or performance optimization strategies.`
      case "fps_degradation":
        return `Investigate FPS degradation pattern. Focus on rendering optimizations and frame rate stability.`
      case "performance_boost":
        return `Leverage positive performance correlation. Apply successful strategies from ${correlation.source_route} to other routes.`
      default:
        return `Monitor performance relationship between ${correlation.source_route} and ${correlation.target_route}.`
    }
  }

  private generatePredictionRecommendation(
    prediction: RoutePerformancePrediction
  ): string {
    if (prediction.recommendation_priority === "high") {
      return `High priority: Route ${prediction.route_pattern} predicted to have performance score ${prediction.predicted_performance_score.toFixed(1)} in ${prediction.prediction_horizon}. Immediate attention required.`
    } else if (prediction.trend_direction === "degrading") {
      return `Monitor route performance trend. Consider proactive optimization before performance degrades further.`
    } else {
      return `Route showing stable performance. Continue monitoring and maintain current optimization strategies.`
    }
  }

  private generateFlowRecommendation(flow: NavigationFlowAnalysis): string {
    if (flow.bottleneck_routes.length > 0) {
      return `Optimize bottleneck routes: ${flow.bottleneck_routes.join(", ")}. Focus on these routes to improve overall navigation flow performance.`
    } else {
      return `Navigation flow performing well. Monitor for any performance degradation in the route sequence: ${flow.route_sequence.join(" -> ")}.`
    }
  }

  private generatePatternRecommendation(pattern: CrossRoutePattern): string {
    return (
      pattern.suggested_mitigation[0] ||
      `Address ${pattern.pattern_type} pattern affecting ${pattern.affected_routes.length} routes.`
    )
  }

  /**
   * Generate seasonal patterns based on route data
   */
  private generateSeasonalPatterns(routeData: RoutePerformanceAnalysis): any[] {
    const patterns: any[] = []

    // Simple seasonal pattern detection for demo/testing
    if (routeData.routes.length > 0) {
      const currentDate = new Date()
      const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Generate a basic seasonal pattern for the worst performing route
      const worstRoute = routeData.routes.find(r => r.performanceScore < 80)
      if (worstRoute) {
        patterns.push({
          pattern_type: "performance_dip",
          metric_type: "fps",
          route_pattern: worstRoute.routePattern,
          confidence: 0.7,
          seasonal_strength: 0.6,
          next_predicted_peak: nextWeek.toISOString(),
          detection_method: "trend_analysis",
        })
      }
    }

    return patterns
  }

  /**
   * Generate proactive recommendations based on analytics
   */
  private generateProactiveRecommendations(
    correlations: any[],
    predictions: any[],
    patterns: any[],
    routeData: RoutePerformanceAnalysis
  ): any[] {
    const recommendations: any[] = []

    // Generate recommendations based on predictions (including medium priority)
    predictions.forEach(prediction => {
      if (
        prediction.recommendation_priority === "high" ||
        prediction.recommendation_priority === "medium"
      ) {
        recommendations.push({
          recommendation_id: `pred_${Date.now()}_${Math.random()}`,
          priority: prediction.recommendation_priority,
          category: "performance_optimization",
          title: `Optimize ${prediction.route_pattern} Route`,
          description: `Route predicted to have performance score ${prediction.predicted_performance_score.toFixed(1)} in ${prediction.prediction_horizon}. Immediate attention required.`,
          impact_estimate: "high",
          effort_estimate: "medium",
          implementation_steps: [
            "Profile route performance bottlenecks",
            "Optimize critical rendering path",
            "Implement performance monitoring",
            "Test improvements under load",
          ],
          expected_improvement: "15-25% performance boost",
          deadline: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      }
    })

    // Generate recommendations based on correlations
    correlations.forEach(correlation => {
      if (
        correlation.performance_impact === "negative" &&
        correlation.confidence_level > 0.5
      ) {
        recommendations.push({
          recommendation_id: `corr_${Date.now()}_${Math.random()}`,
          priority: "medium",
          category: "route_optimization",
          title: `Address Route Correlation Issue`,
          description: `Negative correlation detected between ${correlation.source_route} and ${correlation.target_route}. Impact: ${correlation.performance_impact}`,
          impact_estimate: "medium",
          effort_estimate: "low",
          implementation_steps: [
            "Investigate shared resources between routes",
            "Optimize route transition performance",
            "Consider route-specific caching strategies",
          ],
          expected_improvement: "10-15% correlation improvement",
          deadline: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      }
    })

    // Generate recommendations based on patterns
    patterns.forEach(pattern => {
      if (pattern.pattern_strength > 0.3) {
        recommendations.push({
          recommendation_id: `pattern_${Date.now()}_${Math.random()}`,
          priority: pattern.detection_confidence > 0.8 ? "high" : "medium",
          category: "system_optimization",
          title: `Address ${pattern.pattern_type} Pattern`,
          description: `${pattern.pattern_type} pattern detected affecting ${pattern.affected_routes.length} routes with ${Math.round(pattern.pattern_strength * 100)}% strength.`,
          impact_estimate: pattern.pattern_strength > 0.5 ? "high" : "medium",
          effort_estimate: "medium",
          implementation_steps: pattern.suggested_mitigation || [
            "Investigate pattern root cause",
            "Implement targeted optimizations",
            "Monitor pattern resolution",
          ],
          expected_improvement: "System-wide stability improvement",
          deadline: new Date(
            Date.now() + 21 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}
