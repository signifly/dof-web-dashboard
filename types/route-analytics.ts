import {
  // RoutePerformanceData, // Reserved for future route analytics features
  // RoutePerformanceSession, // Reserved for future session-level analytics
  RoutePerformanceAnalysis,
} from "./route-performance"

// Re-export for convenience
export type { RoutePerformanceAnalysis }

// Core advanced analytics interfaces
export interface RouteCorrelationAnalysis {
  source_route: string
  target_route: string
  correlation_strength: number
  performance_impact: "positive" | "negative" | "neutral"
  confidence_level: number
  sample_size: number
  correlation_type:
    | "memory_leak"
    | "cpu_spike"
    | "fps_degradation"
    | "performance_boost"
  statistical_significance: number
}

export interface RoutePerformancePrediction {
  route_pattern: string
  predicted_performance_score: number
  confidence_interval: [number, number]
  prediction_horizon: "1d" | "7d" | "30d"
  contributing_factors: string[]
  recommendation_priority: "high" | "medium" | "low"
  forecast_accuracy: number
  trend_direction: "improving" | "stable" | "degrading"
  prediction_model:
    | "linear_regression"
    | "exponential_smoothing"
    | "seasonal_decomposition"
}

export interface NavigationFlowAnalysis {
  flow_id: string
  route_sequence: string[]
  performance_trajectory: number[]
  bottleneck_routes: string[]
  optimization_potential: number
  user_impact_score: number
  flow_frequency: number
  avg_transition_time: number
  performance_degradation_points: Array<{
    from_route: string
    to_route: string
    performance_drop: number
    severity: "critical" | "high" | "medium" | "low"
  }>
}

export interface RoutePerformanceInsight {
  route_pattern: string
  route_name: string
  insight_type:
    | "correlation"
    | "prediction"
    | "flow_analysis"
    | "pattern_detection"
  insight_data:
    | RouteCorrelationAnalysis
    | RoutePerformancePrediction
    | NavigationFlowAnalysis
    | CrossRoutePattern
  confidence: number
  impact_assessment: "high" | "medium" | "low"
  actionable_recommendation: string
}

export interface CrossRoutePattern {
  pattern_id: string
  pattern_type:
    | "memory_leak_chain"
    | "cpu_cascade"
    | "fps_recovery"
    | "performance_spiral"
  affected_routes: string[]
  pattern_strength: number
  detection_confidence: number
  suggested_mitigation: string[]
}

export interface RouteSequence {
  device_id: string
  routes: string[]
  performance_scores: number[]
  timestamps: string[]
}

export interface RouteAnalyticsReport {
  id: string
  generated_at: string
  processing_time_ms: number
  route_correlations: RouteCorrelationAnalysis[]
  performance_predictions: RoutePerformancePrediction[]
  navigation_flows: NavigationFlowAnalysis[]
  cross_route_patterns: CrossRoutePattern[]
  insights: RoutePerformanceInsight[]
  performance_meta: {
    sessions_processed: number
    routes_analyzed: number
    meets_performance_target: boolean
  }
}

export interface PredictionResult {
  predictedScore: number
  confidenceInterval: [number, number]
  model: string
  rSquared?: number
}

export interface LinearRegressionResult {
  slope: number
  intercept: number
  rSquared: number
}
