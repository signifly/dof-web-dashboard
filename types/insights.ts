export interface PerformanceInsight {
  id: string
  type:
    | "trend_decline"
    | "trend_improvement"
    | "anomaly"
    | "opportunity"
    | "alert"
    | "route_performance_anomaly"
    | "route_vs_global_performance"
    | "route_performance_degradation"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  confidence: number // 0-1
  impact: "high" | "medium" | "low"
  category: "performance" | "memory" | "cpu" | "rendering"
  detected_at: string
  data_context: {
    metric_type: string
    value: number
    baseline: number
    deviation: number
    affected_sessions?: number
    affected_devices?: number
    time_window?: {
      start: string
      end: string
    }
    route_context?: {
      route_name: string
      route_pattern: string
      affected_routes: string[]
      route_specific_metrics: {
        sessions_count: number
        unique_devices: number
        avg_screen_duration: number
      }
    }
  }
}

export interface PerformanceRecommendation {
  id: string
  insight_id: string
  title: string
  description: string
  category:
    | "performance"
    | "memory"
    | "cpu"
    | "rendering"
    | "route_navigation"
    | "route_caching"
    | "route_device_optimization"
    | "route_performance_budget"
  impact: "high" | "medium" | "low"
  effort: "high" | "medium" | "low"
  priority_score: number // calculated based on impact, effort, confidence
  actionable_steps: string[]
  estimated_improvement: string
  related_metrics: string[]
  implementation_time: string

  // Tracking
  status: "pending" | "in_progress" | "completed" | "dismissed"
  effectiveness_score?: number // post-implementation tracking
  created_at: string
}

export interface PerformanceScore {
  overall: number // 0-100
  breakdown: {
    fps: number
    cpu: number
    memory: number
  }
  grade: "A" | "B" | "C" | "D" | "F"
  trend: "improving" | "stable" | "declining"
  last_calculated: string
  baseline_comparison?: {
    fps_vs_baseline: number
    cpu_vs_baseline: number
    memory_vs_baseline: number
  }
}

export interface TrendAnalysis {
  direction: "up" | "down" | "stable"
  slope: number
  confidence: number
  significance: "high" | "medium" | "low"
  r_squared: number
  forecast?: number
  data_points: number
  time_period: string
}

export interface AnomalyDetection {
  id: string
  metric_type: string
  value: number
  expected_value: number
  deviation: number
  z_score: number
  severity: "critical" | "high" | "medium" | "low"
  timestamp: string
  session_id?: string
  device_id?: string
  context?: Record<string, any>
}

export interface OptimizationOpportunity {
  id: string
  type: "memory_optimization" | "cpu_optimization" | "fps_improvement"
  potential_impact: "high" | "medium" | "low"
  affected_metric: string
  current_value: number
  target_value: number
  improvement_potential: number // percentage
  complexity: "simple" | "moderate" | "complex"
  description: string
}

export interface SeasonalPattern {
  pattern_type: "daily" | "weekly" | "monthly"
  confidence: number
  peak_times: string[]
  low_times: string[]
  amplitude: number
  significance: number
}

export interface InsightsReport {
  id: string
  generated_at: string
  time_range: {
    start: string
    end: string
  }
  performance_score: PerformanceScore
  insights: PerformanceInsight[]
  recommendations: PerformanceRecommendation[]
  summary: {
    total_insights: number
    critical_issues: number
    improvement_opportunities: number
    estimated_impact: string
    top_priority_recommendations: number
  }
  trends: {
    fps_trend: TrendAnalysis
    memory_trend: TrendAnalysis
    cpu_trend: TrendAnalysis
  }
  anomalies: AnomalyDetection[]
  optimization_opportunities: OptimizationOpportunity[]
  metadata: {
    analysis_duration_ms: number
    data_points_analyzed: number
    confidence_level: number
  }
}

export interface RecommendationRule {
  id: string
  name: string
  description: string
  condition: (insight: PerformanceInsight) => boolean
  recommendation: (
    insight: PerformanceInsight
  ) => Omit<
    PerformanceRecommendation,
    "id" | "insight_id" | "priority_score" | "status" | "created_at"
  >
  priority_weight: number
  category: string[]
}

export interface StatisticalResult {
  mean: number
  median: number
  standard_deviation: number
  min: number
  max: number
  percentile_25: number
  percentile_75: number
  percentile_90: number
  percentile_95: number
  outliers: number[]
}

export interface CorrelationAnalysis {
  metric_a: string
  metric_b: string
  correlation_coefficient: number
  p_value: number
  significance: "significant" | "not_significant"
  relationship: "positive" | "negative" | "none"
  strength: "strong" | "moderate" | "weak"
}

export interface PerformanceBenchmark {
  metric_type: string
  excellent_threshold: number
  good_threshold: number
  average_threshold: number
  poor_threshold: number
  device_specific?: boolean
  platform_specific?: boolean
}

export interface InsightsEngineConfig {
  anomaly_detection: {
    z_score_threshold: number
    minimum_data_points: number
    rolling_window_size: number
  }
  trend_analysis: {
    minimum_r_squared: number
    significance_threshold: number
    minimum_data_points: number
    forecast_periods: number
  }
  scoring: {
    weights: {
      fps: number
      cpu: number
      memory: number
    }
    performance_tiers: {
      excellent: number
      good: number
      average: number
      poor: number
    }
  }
  recommendations: {
    max_recommendations: number
    min_confidence_threshold: number
    priority_threshold: number
  }
}

export interface InsightsEngineState {
  last_analysis_time: string
  analysis_in_progress: boolean
  cached_baselines: Record<string, number>
  recommendation_history: PerformanceRecommendation[]
  configuration: InsightsEngineConfig
}

// Route-specific recommendation types for Issue #28
export interface DeviceRouteCompatibility {
  device_tier: "high_end" | "mid_range" | "low_end"
  route_pattern: string
  performance_score: number
  optimization_priority: number
}

export interface RouteRecommendation extends PerformanceRecommendation {
  route_context?: {
    affected_routes: string[]
    route_patterns: string[]
    navigation_impact: "high" | "medium" | "low"
    device_compatibility?: DeviceRouteCompatibility[]
    implementation_scope: "single_route" | "route_group" | "global_navigation"
  }
}
