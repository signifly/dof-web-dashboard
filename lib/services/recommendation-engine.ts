import {
  PerformanceInsight,
  PerformanceRecommendation,
  RecommendationRule,
  OptimizationOpportunity,
  ProactiveRecommendation,
  PerformancePrediction,
  SeasonalPattern,
  EarlyWarningAlert,
} from "@/types/insights"
import { PerformanceSummary } from "@/lib/performance-data"
import { RoutePerformanceAnalysis } from "@/types/route-performance"
import {
  analyzeRouteOptimizationOpportunities,
  RouteOptimizationAnalysis,
  RouteOptimizationRecommendation,
} from "@/lib/utils/route-recommendations"

export class RecommendationEngine {
  private rules: RecommendationRule[]

  constructor() {
    this.rules = this.initializeRecommendationRules()
  }

  /**
   * Generate prioritized recommendations based on insights
   */
  async generateRecommendations(
    insights: PerformanceInsight[],
    context: PerformanceSummary,
    opportunities?: OptimizationOpportunity[],
    routeData?: RoutePerformanceAnalysis
  ): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = []

    // Generate recommendations from insights
    for (const insight of insights) {
      const applicableRules = this.rules.filter(rule => rule.condition(insight))

      console.log(
        `🔍 Insight "${insight.title}" (${insight.type}/${insight.category}/${insight.severity}) matched ${applicableRules.length} rules`
      )

      for (const rule of applicableRules) {
        const baseRecommendation = rule.recommendation(insight)
        const priorityScore = this.calculatePriorityScore(
          baseRecommendation,
          insight,
          context,
          rule
        )

        console.log(`   Rule "${rule.name}" priority score: ${priorityScore}`)

        if (priorityScore >= 1.5) {
          // Minimum priority threshold
          recommendations.push({
            id: crypto.randomUUID(),
            insight_id: insight.id,
            ...baseRecommendation,
            priority_score: priorityScore,
            status: "pending",
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    // Generate recommendations from optimization opportunities
    if (opportunities) {
      for (const opportunity of opportunities) {
        const opportunityRecommendation = this.createOpportunityRecommendation(
          opportunity,
          context
        )
        if (opportunityRecommendation) {
          recommendations.push(opportunityRecommendation)
        }
      }
    }

    // Generate route-specific recommendations
    if (routeData) {
      const routeOptimizations =
        analyzeRouteOptimizationOpportunities(routeData)
      const routeRecommendations =
        this.generateRouteOptimizationRecommendations(
          routeOptimizations,
          context
        )
      recommendations.push(...routeRecommendations)
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations =
      this.deduplicateRecommendations(recommendations)
    return uniqueRecommendations
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 10) // Limit to top 10 recommendations
  }

  /**
   * Initialize recommendation rules
   */
  private initializeRecommendationRules(): RecommendationRule[] {
    return [
      // FPS Performance Rules
      {
        id: "fps_trend_decline",
        name: "FPS Declining Trend",
        description: "Recommendations for declining FPS performance",
        condition: insight =>
          insight.type === "trend_decline" &&
          insight.category === "performance",
        recommendation: insight => ({
          title: "Optimize Rendering Pipeline",
          description:
            "FPS performance is declining. Focus on rendering optimizations to restore smooth performance.",
          category: "rendering",
          impact: insight.severity === "critical" ? "high" : "medium",
          effort: "medium",
          actionable_steps: [
            "Profile GPU usage during heavy scenes to identify bottlenecks",
            "Implement object pooling for frequently spawned game objects",
            "Review and optimize texture compression settings",
            "Reduce particle effects complexity or implement LOD system",
            "Optimize shader complexity, especially fragment shaders",
            "Consider implementing frame rate limiting for battery savings",
          ],
          estimated_improvement: "15-25% FPS improvement",
          related_metrics: ["fps", "gpu_usage"],
          implementation_time: "2-3 development days",
        }),
        priority_weight: 1.2,
        category: ["performance", "rendering"],
      },

      {
        id: "fps_anomaly_critical",
        name: "Critical FPS Anomaly",
        description: "Immediate action for critical FPS drops",
        condition: insight =>
          insight.type === "anomaly" &&
          insight.category === "performance" &&
          insight.severity === "critical",
        recommendation: insight => ({
          title: "Address Critical FPS Drop",
          description: `Critical FPS anomaly detected (${insight.data_context.value.toFixed(1)} FPS). Immediate investigation required.`,
          category: "performance",
          impact: "high",
          effort: "high",
          actionable_steps: [
            "Immediately profile the affected session or device",
            "Check for memory leaks causing performance degradation",
            "Review recent code changes that might impact rendering",
            "Implement emergency frame rate monitoring and alerts",
            "Consider rolling back recent changes if performance regression identified",
          ],
          estimated_improvement: "Restore normal FPS performance",
          related_metrics: ["fps", "memory_usage", "cpu_usage"],
          implementation_time: "1-2 days (urgent)",
        }),
        priority_weight: 2.0,
        category: ["performance", "critical"],
      },

      {
        id: "fps_anomaly_high",
        name: "High FPS Anomaly",
        description: "Investigation needed for significant FPS drops",
        condition: insight =>
          insight.type === "anomaly" &&
          insight.category === "performance" &&
          insight.severity === "high",
        recommendation: insight => ({
          title: "Investigate FPS Performance Anomaly",
          description: `High FPS anomaly detected (${insight.data_context.value.toFixed(1)} FPS). Performance investigation recommended.`,
          category: "performance",
          impact: "medium",
          effort: "medium",
          actionable_steps: [
            "Profile the affected session to identify performance bottlenecks",
            "Check for memory pressure during the anomaly period",
            "Review GPU and CPU usage patterns",
            "Implement additional monitoring for similar anomalies",
            "Consider performance optimization based on findings",
          ],
          estimated_improvement: "10-15% FPS stability improvement",
          related_metrics: ["fps", "memory_usage", "cpu_usage"],
          implementation_time: "2-3 hours",
        }),
        priority_weight: 1.5,
        category: ["performance"],
      },

      // Memory Optimization Rules
      {
        id: "memory_high_usage",
        name: "High Memory Usage",
        description: "Recommendations for excessive memory consumption",
        condition: insight =>
          insight.category === "memory" &&
          (insight.type === "alert" || insight.type === "trend_decline"),
        recommendation: insight => ({
          title: "Implement Memory Optimization Strategy",
          description: `High memory usage detected (${insight.data_context.value.toFixed(0)}MB). Optimize memory allocation and usage patterns.`,
          category: "memory",
          impact: insight.data_context.value > 600 ? "high" : "medium",
          effort: "medium",
          actionable_steps: [
            "Profile memory allocation patterns to identify hotspots",
            "Implement texture streaming to reduce memory footprint",
            "Review asset loading logic and implement proper unloading",
            "Optimize data structures and reduce redundant data storage",
            "Implement memory pooling for frequently allocated objects",
            "Consider asset compression and format optimization",
          ],
          estimated_improvement: "20-40% memory reduction",
          related_metrics: ["memory_usage", "fps"],
          implementation_time: "3-5 development days",
        }),
        priority_weight: 1.1,
        category: ["memory", "optimization"],
      },

      {
        id: "memory_trend_increase",
        name: "Memory Usage Trending Up",
        description: "Proactive memory optimization for increasing usage",
        condition: insight =>
          insight.type === "trend_decline" && insight.category === "memory",
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Proactive Memory Leak Prevention",
          description:
            "Memory usage is trending upward. Implement preventive measures to avoid future memory issues.",
          category: "memory",
          impact: "medium",
          effort: "low",
          actionable_steps: [
            "Set up automated memory monitoring and alerting",
            "Implement memory usage logging for trend analysis",
            "Review code for potential memory leaks in recent changes",
            "Add memory pressure handling for low-memory devices",
            "Implement background memory cleanup routines",
          ],
          estimated_improvement: "Prevent future memory issues",
          related_metrics: ["memory_usage"],
          implementation_time: "1-2 development days",
        }),
        priority_weight: 0.8,
        category: ["memory", "preventive"],
      },

      // CPU Optimization Rules
      {
        id: "cpu_high_usage",
        name: "High CPU Usage",
        description: "Recommendations for excessive CPU consumption",
        condition: insight =>
          insight.category === "cpu" && insight.data_context.value > 70,
        recommendation: insight => ({
          title: "Optimize CPU-Intensive Operations",
          description: `High CPU usage detected (${insight.data_context.value.toFixed(1)}%). Optimize computational efficiency.`,
          category: "cpu",
          impact: insight.data_context.value > 90 ? "high" : "medium",
          effort: "medium",
          actionable_steps: [
            "Profile CPU usage to identify computational hotspots",
            "Optimize algorithms and data processing loops",
            "Implement multithreading for CPU-intensive tasks",
            "Consider moving heavy computations to background threads",
            "Optimize update loops and reduce unnecessary calculations",
            "Implement frame rate adaptive processing",
          ],
          estimated_improvement: "15-30% CPU usage reduction",
          related_metrics: ["cpu_usage", "battery_life"],
          implementation_time: "2-4 development days",
        }),
        priority_weight: 1.0,
        category: ["cpu", "performance"],
      },

      // General Optimization Rules
      {
        id: "multiple_issues",
        name: "Multiple Performance Issues",
        description: "Holistic approach for multiple performance problems",
        condition: insight =>
          insight.type === "alert" && insight.impact === "high",
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Comprehensive Performance Audit",
          description:
            "Multiple performance issues detected. Conduct comprehensive optimization review.",
          category: "performance",
          impact: "high",
          effort: "high",
          actionable_steps: [
            "Conduct full performance profiling session",
            "Create performance optimization roadmap",
            "Prioritize fixes by user impact and implementation effort",
            "Implement performance monitoring and alerting",
            "Set up automated performance testing pipeline",
            "Consider performance budgets for future development",
          ],
          estimated_improvement: "Comprehensive performance improvement",
          related_metrics: ["fps", "memory_usage", "cpu_usage"],
          implementation_time: "1-2 weeks",
        }),
        priority_weight: 1.5,
        category: ["performance", "comprehensive"],
      },

      // Device-Specific Rules
      {
        id: "low_end_device_optimization",
        name: "Low-End Device Optimization",
        description: "Specific optimizations for lower-end devices",
        condition: insight =>
          (insight.category === "performance" ||
            insight.category === "memory") &&
          insight.data_context.value !== undefined &&
          insight.confidence > 0.7,
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Low-End Device Compatibility",
          description:
            "Optimize performance for lower-end devices to ensure broad compatibility.",
          category: "performance",
          impact: "medium",
          effort: "medium",
          actionable_steps: [
            "Implement device-tier based quality settings",
            "Add automatic graphics quality adjustment",
            "Reduce asset quality on lower-end devices",
            "Implement aggressive memory management for limited RAM",
            "Consider feature reduction for very low-end devices",
          ],
          estimated_improvement: "Improved compatibility across device tiers",
          related_metrics: ["fps", "memory_usage"],
          implementation_time: "3-5 development days",
        }),
        priority_weight: 0.7,
        category: ["compatibility", "optimization"],
      },

      // Route-Specific Recommendation Rules for Issue #28

      // Route Navigation Optimization Rules
      {
        id: "route_preloading_optimization",
        name: "Route Preloading Optimization",
        description: "Implement preloading for heavy routes",
        condition: insight =>
          insight.type === "route_performance_anomaly" &&
          !!(
            insight.data_context.route_context?.route_specific_metrics
              ?.avg_screen_duration &&
            insight.data_context.route_context.route_specific_metrics
              .avg_screen_duration > 3000
          ),
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Implement Route Preloading",
          description:
            "Long-duration route detected. Implement preloading for better UX.",
          category: "route_navigation",
          impact: "medium",
          effort: "medium",
          actionable_steps: [
            "Implement route component preloading for heavy screens",
            "Add skeleton loaders for route transitions",
            "Cache route data during idle time",
            "Implement progressive loading for route assets",
          ],
          estimated_improvement: "30-50% reduction in perceived load time",
          related_metrics: ["screen_duration", "user_experience"],
          implementation_time: "2-3 development days",
        }),
        priority_weight: 1.3,
        category: ["route_navigation", "performance"],
      },

      // Device-Route Compatibility Rules
      {
        id: "low_end_device_route_optimization",
        name: "Low-End Device Route Optimization",
        description: "Optimize routes for low-end devices",
        condition: insight =>
          insight.type === "route_performance_anomaly" &&
          !!(
            insight.data_context.route_context?.route_specific_metrics
              ?.avg_screen_duration &&
            insight.data_context.route_context.route_specific_metrics
              .avg_screen_duration > 5000
          ),
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Optimize Route for Low-End Devices",
          description:
            "Route performs poorly on low-end devices. Implement device-specific optimizations.",
          category: "route_device_optimization",
          impact: "high",
          effort: "medium",
          actionable_steps: [
            "Reduce asset quality on low-end devices for this route",
            "Implement simplified UI components for resource-constrained devices",
            "Add device-specific route loading strategies",
            "Consider alternative route flows for low-end devices",
          ],
          estimated_improvement: "Route-specific improvements: 40-60%",
          related_metrics: ["fps", "memory_usage", "device_compatibility"],
          implementation_time: "3-5 development days",
        }),
        priority_weight: 1.4,
        category: ["route_device_optimization", "compatibility"],
      },

      // Route Performance Budget Rules
      {
        id: "route_performance_budget_exceeded",
        name: "Route Performance Budget Exceeded",
        description: "Route exceeds performance budget thresholds",
        condition: insight =>
          insight.type === "route_performance_degradation" ||
          (insight.type === "route_performance_anomaly" &&
            !!(
              insight.data_context.route_context?.route_specific_metrics
                ?.avg_screen_duration &&
              insight.data_context.route_context.route_specific_metrics
                .avg_screen_duration > 5000
            )),
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Route Exceeds Performance Budget",
          description:
            "Route loading time exceeds performance budget. Optimization required.",
          category: "route_performance_budget",
          impact: "high",
          effort: "medium",
          actionable_steps: [
            "Set performance budget targets for this route",
            "Implement route performance monitoring",
            "Add automated alerts for budget violations",
            "Create route performance regression testing",
          ],
          estimated_improvement: "Restore within performance budget",
          related_metrics: ["screen_duration", "performance_budget"],
          implementation_time: "1-2 development days",
        }),
        priority_weight: 1.6,
        category: ["route_performance_budget", "monitoring"],
      },

      // Route Caching Optimization Rules
      {
        id: "route_caching_opportunity",
        name: "Route Caching Opportunity",
        description:
          "Implement caching strategies for frequently accessed routes",
        condition: insight =>
          insight.type === "route_vs_global_performance" &&
          !!(
            insight.data_context.route_context?.route_specific_metrics
              ?.sessions_count &&
            insight.data_context.route_context.route_specific_metrics
              .sessions_count > 50
          ),
        recommendation: insight => ({ // TODO: Fix unused variable insight
          title: "Implement Route Caching Strategy",
          description:
            "High-traffic route detected. Implement caching for improved performance.",
          category: "route_caching",
          impact: "medium",
          effort: "low",
          actionable_steps: [
            "Implement route-level data caching",
            "Add component-level memoization for route components",
            "Cache route transition animations",
            "Implement intelligent cache invalidation strategies",
          ],
          estimated_improvement:
            "20-35% performance improvement for repeat visits",
          related_metrics: ["screen_duration", "memory_usage"],
          implementation_time: "1-2 development days",
        }),
        priority_weight: 1.1,
        category: ["route_caching", "optimization"],
      },
    ]
  }

  /**
   * Calculate priority score for a recommendation
   */
  private calculatePriorityScore(
    recommendation: Omit<
      PerformanceRecommendation,
      "id" | "insight_id" | "priority_score" | "status" | "created_at"
    >,
    insight: PerformanceInsight,
    context: PerformanceSummary,
    rule: RecommendationRule
  ): number {
    // Base scoring factors
    const impactWeight =
      { high: 3, medium: 2, low: 1 }[recommendation.impact] || 1
    const effortWeight =
      { low: 3, medium: 2, high: 1 }[recommendation.effort] || 1 // Inverse - lower effort = higher score
    const confidenceWeight = insight.confidence
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 }[
      insight.severity
    ]

    // Context-based adjustments
    let contextMultiplier = 1.0

    // Adjust based on overall performance context
    if (context.avgFps < 30 && recommendation.category === "rendering") {
      contextMultiplier += 0.5 // Boost rendering recommendations when FPS is very low
    }

    if (context.avgMemory > 600 && recommendation.category === "memory") {
      contextMultiplier += 0.3 // Boost memory recommendations when usage is high
    }

    // Device count factor - more affected devices = higher priority
    const deviceFactor = Math.min(1.5, 1 + context.deviceCount / 100)

    // Route-specific priority adjustments
    if (insight.data_context.route_context) {
      const routeContext = insight.data_context.route_context

      // Boost priority for routes with many affected sessions
      if (routeContext.route_specific_metrics.sessions_count > 100) {
        contextMultiplier += 0.3
      }

      // Boost priority for routes with poor performance vs others
      if (routeContext.route_specific_metrics.avg_screen_duration > 4000) {
        contextMultiplier += 0.4
      }

      // Boost priority for routes affecting many devices
      if (routeContext.route_specific_metrics.unique_devices > 20) {
        contextMultiplier += 0.2
      }
    }

    // Route-specific category adjustments
    if (recommendation.category.toString().startsWith("route_")) {
      // Route-specific recommendations get priority boost
      contextMultiplier += 0.25
    }

    // Calculate final priority score
    const baseScore =
      impactWeight * 0.3 +
      effortWeight * 0.2 +
      confidenceWeight * 0.2 +
      severityWeight * 0.2 +
      rule.priority_weight * 0.1

    return baseScore * contextMultiplier * deviceFactor
  }

  /**
   * Generate recommendations from route optimization analysis
   */
  private generateRouteOptimizationRecommendations(
    routeOptimizations: RouteOptimizationAnalysis[],
    context: PerformanceSummary
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []

    for (const routeAnalysis of routeOptimizations) {
      for (const optimization of routeAnalysis.optimization_recommendations) {
        const priorityScore = this.calculateRouteOptimizationPriorityScore(
          optimization,
          routeAnalysis,
          context
        )

        if (priorityScore >= 2.0) {
          const recommendation: PerformanceRecommendation = {
            id: crypto.randomUUID(),
            insight_id: `route-optimization-${routeAnalysis.route_pattern}`,
            title: this.getRouteOptimizationTitle(optimization, routeAnalysis),
            description: optimization.description,
            category: this.getRouteOptimizationCategory(optimization.type),
            impact: this.mapPriorityToImpact(optimization.priority),
            effort: this.mapComplexityToEffort(
              optimization.implementation_complexity
            ),
            priority_score: priorityScore,
            actionable_steps: this.getRouteOptimizationActionSteps(
              optimization,
              routeAnalysis
            ),
            estimated_improvement: optimization.estimated_impact,
            related_metrics: this.getRouteOptimizationMetrics(
              optimization.type
            ),
            implementation_time: this.getRouteOptimizationTimeEstimate(
              optimization.implementation_complexity
            ),
            status: "pending",
            created_at: new Date().toISOString(),
          }

          recommendations.push(recommendation)
        }
      }
    }

    return recommendations
  }

  /**
   * Calculate priority score for route optimization recommendations
   */
  private calculateRouteOptimizationPriorityScore(
    optimization: RouteOptimizationRecommendation,
    routeAnalysis: RouteOptimizationAnalysis,
    context: PerformanceSummary // TODO: Fix unused variable context
  ): number {
    const priorityWeight = { high: 3, medium: 2, low: 1 }[optimization.priority]
    const complexityWeight = { simple: 3, moderate: 2, complex: 1 }[
      optimization.implementation_complexity
    ]

    let baseScore = (priorityWeight + complexityWeight) / 2

    // Route-specific adjustments
    if (routeAnalysis.performance_budget_status === "exceeded") {
      baseScore += 1.0
    } else if (routeAnalysis.performance_budget_status === "approaching") {
      baseScore += 0.5
    }

    if (routeAnalysis.device_compatibility_issues.length > 0) {
      baseScore += 0.5
    }

    if (
      routeAnalysis.preloading_opportunity &&
      optimization.type === "preloading"
    ) {
      baseScore += 0.7
    }

    if (
      routeAnalysis.caching_potential === "high" &&
      optimization.type === "caching"
    ) {
      baseScore += 0.6
    }

    return baseScore
  }

  /**
   * Get title for route optimization recommendation
   */
  private getRouteOptimizationTitle(
    optimization: RouteOptimizationRecommendation,
    routeAnalysis: RouteOptimizationAnalysis
  ): string {
    const routePattern =
      routeAnalysis.route_pattern.replace(/^\//, "").replace(/\//g, " ") ||
      "route"

    switch (optimization.type) {
      case "preloading":
        return `Implement Preloading for ${routePattern}`
      case "caching":
        return `Optimize Caching for ${routePattern}`
      case "device_optimization":
        return `Device Compatibility for ${routePattern}`
      case "performance_budget":
        return `Performance Budget for ${routePattern}`
      default:
        return `Route Optimization for ${routePattern}`
    }
  }

  /**
   * Get category for route optimization type
   */
  private getRouteOptimizationCategory(
    type:
      | "preloading"
      | "caching"
      | "device_optimization"
      | "performance_budget"
  ):
    | "route_navigation"
    | "route_caching"
    | "route_device_optimization"
    | "route_performance_budget" {
    switch (type) {
      case "preloading":
        return "route_navigation"
      case "caching":
        return "route_caching"
      case "device_optimization":
        return "route_device_optimization"
      case "performance_budget":
        return "route_performance_budget"
    }
  }

  /**
   * Get action steps for route optimization
   */
  private getRouteOptimizationActionSteps(
    optimization: RouteOptimizationRecommendation,
    routeAnalysis: RouteOptimizationAnalysis // TODO: Fix unused variable routeAnalysis
  ): string[] {
    const baseSteps: Record<string, string[]> = {
      preloading: [
        "Implement route component preloading",
        "Add skeleton loaders for route transitions",
        "Cache critical route data during idle time",
        "Implement progressive loading for route assets",
      ],
      caching: [
        "Implement route-level data caching",
        "Add component-level memoization",
        "Cache route transition animations",
        "Implement intelligent cache invalidation",
      ],
      device_optimization: [
        "Analyze device-specific performance issues",
        "Implement device-tier based optimizations",
        "Add simplified UI for resource-constrained devices",
        "Consider alternative flows for low-end devices",
      ],
      performance_budget: [
        "Set performance budget targets for route",
        "Implement route performance monitoring",
        "Add automated alerts for budget violations",
        "Create performance regression testing",
      ],
    }

    return baseSteps[optimization.type] || ["Implement route optimization"]
  }

  /**
   * Get related metrics for route optimization type
   */
  private getRouteOptimizationMetrics(
    type:
      | "preloading"
      | "caching"
      | "device_optimization"
      | "performance_budget"
  ): string[] {
    switch (type) {
      case "preloading":
        return ["screen_duration", "user_experience", "perceived_performance"]
      case "caching":
        return ["screen_duration", "memory_usage", "repeat_visit_performance"]
      case "device_optimization":
        return ["fps", "memory_usage", "device_compatibility", "cpu_usage"]
      case "performance_budget":
        return ["screen_duration", "performance_budget", "user_experience"]
    }
  }

  /**
   * Get time estimate for route optimization complexity
   */
  private getRouteOptimizationTimeEstimate(
    complexity: "simple" | "moderate" | "complex"
  ): string {
    switch (complexity) {
      case "simple":
        return "1-2 development days"
      case "moderate":
        return "2-4 development days"
      case "complex":
        return "1-2 weeks"
    }
  }

  /**
   * Map priority to impact
   */
  private mapPriorityToImpact(
    priority: "high" | "medium" | "low"
  ): "high" | "medium" | "low" {
    return priority
  }

  /**
   * Map complexity to effort
   */
  private mapComplexityToEffort(
    complexity: "simple" | "moderate" | "complex"
  ): "high" | "medium" | "low" {
    switch (complexity) {
      case "simple":
        return "low"
      case "moderate":
        return "medium"
      case "complex":
        return "high"
    }
  }

  /**
   * Create recommendation from optimization opportunity
   */
  private createOpportunityRecommendation(
    opportunity: OptimizationOpportunity,
    context: PerformanceSummary
  ): PerformanceRecommendation | null {
    const impactMap = { high: "high", medium: "medium", low: "low" } as const
    const complexityToEffort = {
      simple: "low",
      moderate: "medium",
      complex: "high",
    } as const

    const baseRecommendation = {
      title: `${opportunity.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Optimization`,
      description: opportunity.description,
      category: this.mapOpportunityTypeToCategory(opportunity.type),
      impact: impactMap[opportunity.potential_impact],
      effort: complexityToEffort[opportunity.complexity],
      actionable_steps: this.getOpportunityActionSteps(opportunity),
      estimated_improvement: `${opportunity.improvement_potential.toFixed(0)}% improvement potential`,
      related_metrics: [opportunity.affected_metric],
      implementation_time: this.getImplementationTimeEstimate(
        opportunity.complexity
      ),
    }

    // Calculate priority score based on opportunity characteristics
    const priorityScore = this.calculateOpportunityPriorityScore(
      opportunity,
      context
    )

    if (priorityScore >= 2.0) {
      return {
        id: crypto.randomUUID(),
        insight_id: opportunity.id,
        ...baseRecommendation,
        priority_score: priorityScore,
        status: "pending",
        created_at: new Date().toISOString(),
      }
    }

    return null
  }

  /**
   * Calculate priority score for optimization opportunities
   */
  private calculateOpportunityPriorityScore(
    opportunity: OptimizationOpportunity,
    context: PerformanceSummary // TODO: Fix unused variable context
  ): number {
    const impactWeight = { high: 3, medium: 2, low: 1 }[
      opportunity.potential_impact
    ]
    const complexityWeight = { simple: 3, moderate: 2, complex: 1 }[
      opportunity.complexity
    ]
    const improvementWeight = Math.min(
      3,
      opportunity.improvement_potential / 20
    ) // Cap at 3

    return (impactWeight + complexityWeight + improvementWeight) / 3
  }

  /**
   * Get action steps for optimization opportunities
   */
  private getOpportunityActionSteps(
    opportunity: OptimizationOpportunity
  ): string[] {
    switch (opportunity.type) {
      case "memory_optimization":
        return [
          "Profile memory allocation patterns",
          "Implement object pooling where appropriate",
          "Optimize texture and asset loading",
          "Review data structure efficiency",
        ]
      case "cpu_optimization":
        return [
          "Profile CPU usage hotspots",
          "Optimize computational algorithms",
          "Consider background processing for heavy tasks",
          "Implement frame rate adaptive processing",
        ]
      case "fps_improvement":
        return [
          "Analyze rendering pipeline bottlenecks",
          "Optimize draw calls and batching",
          "Review particle systems and effects",
          "Implement level-of-detail (LOD) systems",
        ]
      default:
        return [
          "Analyze the performance issue",
          "Implement appropriate optimizations",
        ]
    }
  }

  /**
   * Get implementation time estimate
   */
  private getImplementationTimeEstimate(
    complexity: "simple" | "moderate" | "complex"
  ): string {
    switch (complexity) {
      case "simple":
        return "1-2 development days"
      case "moderate":
        return "3-5 development days"
      case "complex":
        return "1-2 weeks"
    }
  }

  /**
   * Map opportunity type to category
   */
  private mapOpportunityTypeToCategory(
    type: string
  ): "performance" | "memory" | "cpu" | "rendering" {
    if (type.includes("memory")) return "memory"
    if (type.includes("cpu")) return "cpu"
    if (type.includes("fps")) return "rendering"
    return "performance"
  }

  /**
   * Remove duplicate recommendations
   */
  private deduplicateRecommendations(
    recommendations: PerformanceRecommendation[]
  ): PerformanceRecommendation[] {
    const seen = new Set<string>()
    return recommendations.filter(rec => {
      const key = `${rec.category}_${rec.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Enhanced Proactive Recommendations for Issue #30
   * Generate recommendations based on predictions and early warnings
   */

  /**
   * Generate proactive recommendations based on predictions and seasonal patterns
   */
  async generateProactiveRecommendations(
    predictions: PerformancePrediction[],
    seasonalPatterns: SeasonalPattern[],
    earlyWarnings: EarlyWarningAlert[]
  ): Promise<ProactiveRecommendation[]> {
    const proactiveRecommendations: ProactiveRecommendation[] = []

    // 1. Generate prediction-based recommendations
    const predictionRecommendations =
      this.generatePredictionBasedRecommendations(predictions)
    proactiveRecommendations.push(...predictionRecommendations)

    // 2. Generate seasonal preparation recommendations
    const seasonalRecommendations =
      this.generateSeasonalPreparationRecommendations(seasonalPatterns)
    proactiveRecommendations.push(...seasonalRecommendations)

    // 3. Generate early warning recommendations
    const earlyWarningRecommendations =
      this.generateEarlyWarningRecommendations(earlyWarnings)
    proactiveRecommendations.push(...earlyWarningRecommendations)

    // Sort by prevention priority and confidence
    return proactiveRecommendations
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
        const priorityDiff =
          priorityWeight[b.prevention_priority] -
          priorityWeight[a.prevention_priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.priority_score - a.priority_score
      })
      .slice(0, 8) // Limit to top 8 proactive recommendations
  }

  /**
   * Generate recommendations based on performance predictions
   */
  private generatePredictionBasedRecommendations(
    predictions: PerformancePrediction[]
  ): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = []

    predictions.forEach(prediction => {
      if (prediction.probability_of_issue > 0.5) {
        const preventionPriority = this.calculatePreventionPriority(
          prediction.probability_of_issue,
          prediction.predicted_value
        )

        // Memory spike prediction
        if (
          prediction.metric_type.includes("memory") &&
          prediction.predicted_value > 400
        ) {
          recommendations.push({
            id: crypto.randomUUID(),
            insight_id: `prediction_${prediction.prediction_id}`,
            title: "Proactive Memory Optimization",
            description: `Prediction models indicate potential memory issues. Current trend suggests memory usage will reach ${prediction.predicted_value.toFixed(0)}MB. Implement preventive measures now.`,
            category: "memory",
            impact: "high",
            effort: "medium",
            priority_score: this.calculateProactivePriorityScore(prediction),
            actionable_steps: [
              "Implement memory cleanup routines for predicted problem areas",
              "Add memory usage monitoring with alerts at 75% of predicted spike",
              "Review and optimize data structures in memory-intensive operations",
              "Implement progressive loading to reduce memory pressure during peak times",
            ],
            estimated_improvement: "Prevent predicted memory issues entirely",
            related_metrics: ["memory_usage", "performance_score"],
            implementation_time: "4-6 hours",
            status: "pending",
            created_at: new Date().toISOString(),
            prediction_based: true,
            predicted_impact_date: this.calculatePredictedImpactDate(
              prediction.time_horizon
            ),
            prevention_priority: preventionPriority,
            early_warning_threshold: prediction.predicted_value * 0.8,
            monitoring_recommendations: [
              "Set up memory usage alerts at 80% of predicted peak",
              "Monitor memory allocation patterns hourly",
              "Track memory cleanup effectiveness",
              "Review memory-intensive operations during predicted timeframe",
            ],
          })
        }

        // FPS degradation prediction
        if (
          prediction.metric_type.includes("fps") &&
          prediction.predicted_value < 45
        ) {
          recommendations.push({
            id: crypto.randomUUID(),
            insight_id: `prediction_${prediction.prediction_id}`,
            title: "Proactive FPS Optimization",
            description: `Frame rate prediction indicates potential performance degradation. FPS may drop to ${prediction.predicted_value.toFixed(1)}. Take preventive action now.`,
            category: "performance",
            impact: prediction.predicted_value < 30 ? "high" : "medium",
            effort: "medium",
            priority_score: this.calculateProactivePriorityScore(prediction),
            actionable_steps: [
              "Optimize rendering pipeline before predicted degradation occurs",
              "Implement frame rate monitoring with early warning alerts",
              "Review and optimize draw calls and GPU-intensive operations",
              "Prepare adaptive quality settings for predicted low-performance periods",
            ],
            estimated_improvement: `Maintain FPS above ${Math.max(45, prediction.predicted_value + 15)}`,
            related_metrics: ["fps", "rendering_performance"],
            implementation_time: "2-4 hours",
            status: "pending",
            created_at: new Date().toISOString(),
            prediction_based: true,
            predicted_impact_date: this.calculatePredictedImpactDate(
              prediction.time_horizon
            ),
            prevention_priority: preventionPriority,
            early_warning_threshold: prediction.predicted_value + 10,
            monitoring_recommendations: [
              "Monitor FPS metrics every 15 minutes during predicted timeframe",
              "Set up automated alerts for FPS drops below 50",
              "Track rendering performance optimization effectiveness",
              "Monitor GPU usage patterns leading up to predicted issue",
            ],
          })
        }

        // Route-specific performance prediction
        if (prediction.route_pattern && prediction.predicted_value < 60) {
          recommendations.push({
            id: crypto.randomUUID(),
            insight_id: `prediction_${prediction.prediction_id}`,
            title: `Proactive Route Optimization: ${prediction.route_pattern}`,
            description: `Route performance prediction indicates potential issues for ${prediction.route_pattern}. Performance score may drop to ${prediction.predicted_value.toFixed(0)}. Optimize before impact occurs.`,
            category: "performance",
            impact: "medium",
            effort: "medium",
            priority_score: this.calculateProactivePriorityScore(prediction),
            actionable_steps: [
              `Implement preloading for ${prediction.route_pattern} route`,
              "Add route-specific performance monitoring",
              "Optimize critical path for this route",
              "Consider caching strategies for route-specific data",
            ],
            estimated_improvement: "Prevent route performance degradation",
            related_metrics: ["route_performance", "screen_duration"],
            implementation_time: "3-5 hours",
            status: "pending",
            created_at: new Date().toISOString(),
            prediction_based: true,
            predicted_impact_date: this.calculatePredictedImpactDate(
              prediction.time_horizon
            ),
            prevention_priority: preventionPriority,
            early_warning_threshold: prediction.predicted_value + 15,
            monitoring_recommendations: [
              `Monitor ${prediction.route_pattern} route performance closely`,
              "Set up route-specific performance alerts",
              "Track user experience metrics for this route",
              "Monitor resource usage patterns specific to this route",
            ],
          })
        }
      }
    })

    return recommendations
  }

  /**
   * Generate seasonal preparation recommendations
   */
  private generateSeasonalPreparationRecommendations(
    seasonalPatterns: SeasonalPattern[]
  ): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = []

    seasonalPatterns.forEach(pattern => {
      if (pattern.confidence > 0.7 && pattern.seasonal_strength > 0.3) {
        const nextPeakDate = new Date(pattern.next_predicted_peak)
        const now = new Date()
        const hoursToNextPeak =
          (nextPeakDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Only recommend preparation if peak is within 72 hours
        if (hoursToNextPeak > 0 && hoursToNextPeak <= 72) {
          recommendations.push({
            id: crypto.randomUUID(),
            insight_id: `seasonal_${pattern.pattern_id}`,
            title: `Prepare for Seasonal ${pattern.pattern_type} Peak`,
            description: `Seasonal analysis predicts ${pattern.metric_type} peak ${pattern.pattern_type === "daily" ? "today" : pattern.pattern_type === "weekly" ? "this week" : "this month"}. Prepare optimization strategies now.`,
            category: "performance",
            impact: pattern.seasonal_strength > 0.5 ? "high" : "medium",
            effort: "low",
            priority_score: 3.5 + pattern.confidence,
            actionable_steps: [
              `Prepare for increased ${pattern.metric_type} during ${pattern.pattern_type} peak`,
              "Review server capacity for predicted peak period",
              "Pre-optimize high-traffic areas identified in seasonal patterns",
              "Set up enhanced monitoring during predicted peak times",
            ],
            estimated_improvement:
              "Prevent 20-30% performance degradation during seasonal peaks",
            related_metrics: [pattern.metric_type],
            implementation_time: "1-2 hours",
            status: "pending",
            created_at: new Date().toISOString(),
            prediction_based: true,
            predicted_impact_date: pattern.next_predicted_peak,
            prevention_priority: "medium",
            early_warning_threshold: pattern.amplitude * 0.7,
            monitoring_recommendations: [
              `Monitor ${pattern.metric_type} closely during predicted peak period`,
              "Set up automated scaling during peak windows",
              "Track seasonal optimization effectiveness",
              "Monitor user experience during seasonal variations",
            ],
            seasonal_context: {
              pattern_type:
                pattern.pattern_type === "hourly"
                  ? "daily"
                  : pattern.pattern_type,
              next_occurrence: pattern.next_predicted_peak,
              historical_impact: pattern.amplitude,
            },
          })
        }
      }
    })

    return recommendations
  }

  /**
   * Generate early warning-based recommendations
   */
  private generateEarlyWarningRecommendations(
    earlyWarnings: EarlyWarningAlert[]
  ): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = []

    earlyWarnings.forEach(warning => {
      if (warning.confidence > 0.6) {
        recommendations.push({
          id: crypto.randomUUID(),
          insight_id: `early_warning_${warning.id}`,
          title: `Early Warning: ${warning.type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}`,
          description: `Early warning system detected potential ${warning.type.replace("_", " ")} in ${warning.time_to_issue}. Take preventive action now.`,
          category: this.mapAlertTypeToCategory(warning.type),
          impact: warning.severity === "critical" ? "high" : "medium",
          effort: "medium",
          priority_score: this.calculateEarlyWarningPriorityScore(warning),
          actionable_steps: warning.prevention_recommendations,
          estimated_improvement: "Prevent predicted performance issues",
          related_metrics: this.getRelatedMetricsForAlertType(warning.type),
          implementation_time:
            warning.severity === "critical" ? "Immediate" : "2-4 hours",
          status: "pending",
          created_at: new Date().toISOString(),
          prediction_based: true,
          predicted_impact_date: warning.predicted_issue_date,
          prevention_priority:
            warning.severity === "critical" ? "critical" : "high",
          early_warning_threshold: 0.8, // Generic threshold
          monitoring_recommendations: warning.monitoring_suggestions,
        })
      }
    })

    return recommendations
  }

  /**
   * Helper methods for proactive recommendations
   */
  private calculatePreventionPriority(
    probabilityOfIssue: number,
    predictedValue: number
  ): "critical" | "high" | "medium" | "low" {
    if (probabilityOfIssue > 0.8 && predictedValue < 30) return "critical"
    if (probabilityOfIssue > 0.6 && predictedValue < 50) return "high"
    if (probabilityOfIssue > 0.4) return "medium"
    return "low"
  }

  private calculateProactivePriorityScore(
    prediction: PerformancePrediction
  ): number {
    const baseScore = 3.0
    const probabilityWeight = prediction.probability_of_issue * 2
    const severityWeight =
      prediction.predicted_value < 30
        ? 2
        : prediction.predicted_value < 50
          ? 1.5
          : 1
    const timeUrgencyWeight = this.calculateTimeUrgencyWeight(
      prediction.time_horizon
    )

    return baseScore + probabilityWeight + severityWeight + timeUrgencyWeight
  }

  private calculateEarlyWarningPriorityScore(
    warning: EarlyWarningAlert
  ): number {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 }[
      warning.severity
    ]
    const confidenceWeight = warning.confidence * 2
    const timeUrgencyWeight = this.calculateTimeUrgencyFromString(
      warning.time_to_issue
    )

    return 2.0 + severityWeight + confidenceWeight + timeUrgencyWeight
  }

  private calculateTimeUrgencyWeight(timeHorizon: string): number {
    switch (timeHorizon) {
      case "1h":
        return 2.0
      case "24h":
        return 1.5
      case "7d":
        return 1.0
      case "30d":
        return 0.5
      default:
        return 1.0
    }
  }

  private calculateTimeUrgencyFromString(timeToIssue: string): number {
    if (timeToIssue.includes("hour")) {
      const hours = parseInt(timeToIssue)
      if (hours <= 2) return 2.0
      if (hours <= 12) return 1.5
      if (hours <= 24) return 1.0
      return 0.5
    }
    if (timeToIssue.includes("day")) {
      const days = parseInt(timeToIssue)
      if (days <= 1) return 1.0
      if (days <= 3) return 0.5
      return 0.2
    }
    return 0.5
  }

  private calculatePredictedImpactDate(timeHorizon: string): string {
    const now = new Date()
    const hours = this.parseTimeHorizon(timeHorizon)
    const impactDate = new Date(now.getTime() + hours * 60 * 60 * 1000)
    return impactDate.toISOString()
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

  private mapAlertTypeToCategory(
    alertType: string
  ): "performance" | "memory" | "cpu" | "rendering" {
    if (alertType.includes("memory")) return "memory"
    if (alertType.includes("fps")) return "rendering"
    if (alertType.includes("cpu")) return "cpu"
    return "performance"
  }

  private getRelatedMetricsForAlertType(alertType: string): string[] {
    const metricMap: { [key: string]: string[] } = {
      performance_degradation: ["performance_score", "overall_health"],
      memory_spike: ["memory_usage", "heap_size"],
      fps_drop: ["fps", "frame_time", "rendering_performance"],
      seasonal_peak: ["seasonal_metrics", "traffic_patterns"],
    }

    return metricMap[alertType] || ["performance_score"]
  }
}
