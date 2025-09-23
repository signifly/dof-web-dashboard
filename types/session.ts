import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"

export interface SessionDetails extends PerformanceSession {
  isActive: boolean
  duration: number | null
  totalMetrics: number
  uniqueScreens: string[]
  performanceScore: number
  riskLevel: "low" | "medium" | "high"
  healthIndicators: {
    avgFps: number
    avgMemory: number
    avgCpu: number
    avgLoadTime: number
  }
}

export interface SessionMetricsTimeline {
  timestamp: string
  fps: number
  memory_usage: number
  cpu_usage: number
  load_time: number
  screen_name: string
  metric_count: number
}

export interface PerformanceIssue {
  type: "fps_drop" | "memory_spike" | "slow_load" | "cpu_high"
  timestamp: string
  severity: "low" | "medium" | "high"
  description: string
  affectedScreen: string
  value: number
  threshold: number
}

export interface SessionPerformanceAnalysis {
  performanceIssues: PerformanceIssue[]
  performanceTrends: {
    overall: "improving" | "stable" | "declining"
    fps: "improving" | "stable" | "declining"
    memory: "improving" | "stable" | "declining"
    loadTime: "improving" | "stable" | "declining"
  }
  screenPerformance: {
    screenName: string
    visitCount: number
    avgFps: number
    avgMemory: number
    avgLoadTime: number
    issueCount: number
  }[]
}

export interface SessionWithMetrics {
  session: SessionDetails
  metrics: SessionMetricsTimeline[]
  analysis: SessionPerformanceAnalysis
}