import {
  PerformanceInsight,
  PerformanceRecommendation,
  RecommendationRule,
  OptimizationOpportunity,
} from "@/types/insights"
import { PerformanceSummary } from "@/lib/performance-data"

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
    opportunities?: OptimizationOpportunity[]
  ): Promise<PerformanceRecommendation[]> {
    const recommendations: PerformanceRecommendation[] = []

    // Generate recommendations from insights
    for (const insight of insights) {
      const applicableRules = this.rules.filter(rule => rule.condition(insight))

      for (const rule of applicableRules) {
        const baseRecommendation = rule.recommendation(insight)
        const priorityScore = this.calculatePriorityScore(
          baseRecommendation,
          insight,
          context,
          rule
        )

        if (priorityScore >= 2.0) {
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
        recommendation: insight => ({
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
        recommendation: insight => ({
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
        recommendation: insight => ({
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
    context: PerformanceSummary
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
}
