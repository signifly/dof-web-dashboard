export interface UserJourney {
  journey_id: string
  session_id: string
  device_id: string
  anonymous_user_id: string
  route_sequence: RouteVisit[]
  journey_duration: number
  performance_trajectory: PerformancePoint[]
  bottleneck_points: BottleneckPoint[]
  journey_score: number
  completion_status: "completed" | "abandoned" | "in_progress"
  journey_start: string
  journey_end: string | null
}

export interface RouteVisit {
  route_pattern: string
  route_name: string
  entry_timestamp: string
  exit_timestamp: string | null
  duration: number
  performance_metrics: {
    avg_fps: number
    avg_memory: number
    avg_cpu: number
    avg_load_time: number
  }
  transition_performance: {
    transition_time: number
    memory_spike: number
    cpu_spike: number
  }
}

export interface PerformancePoint {
  timestamp: string
  fps: number
  memory_usage: number
  cpu_usage: number
  route_pattern: string
}

export interface BottleneckPoint {
  route_pattern: string
  timestamp: string
  bottleneck_type:
    | "performance_drop"
    | "high_cpu"
    | "memory_spike"
    | "slow_transition"
  severity: "critical" | "high" | "medium" | "low"
  impact_score: number
  description: string
}

export interface JourneyPattern {
  pattern_id: string
  route_sequence: string[]
  frequency: number
  avg_performance_score: number
  common_bottlenecks: string[]
  optimization_potential: number
  user_impact_score: number
  avg_journey_duration: number
  completion_rate: number
}

export interface JourneyPerformanceInsight {
  journey_id: string
  insight_type:
    | "bottleneck_detection"
    | "abandonment_analysis"
    | "optimization_opportunity"
    | "pattern_recognition"
  journey_context: {
    affected_journey_patterns: string[]
    bottleneck_routes: string[]
    performance_drop_percentage: number
    user_abandonment_correlation: number
    optimization_priority: "critical" | "high" | "medium" | "low"
  }
  actionable_recommendation: string
  confidence: number
  impact_assessment: "high" | "medium" | "low"
}

export interface JourneyAbandonmentPattern {
  abandonment_point: string
  frequency: number
  avg_time_to_abandonment: number
  common_preceding_routes: string[]
}

export interface JourneyPerformanceRegression {
  route_pattern: string
  performance_change: number
  significance: "high" | "medium" | "low"
  sample_size: number
}
