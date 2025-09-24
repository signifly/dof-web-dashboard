import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"

// Base device profile interface (extends the existing one from device-profiling.tsx)
export interface BaseDeviceProfile {
  deviceId: string
  platform: string
  appVersion: string
  sessions: PerformanceSession[]
  totalSessions: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  lastSeen: string
  riskLevel: "low" | "medium" | "high"
}

// Enhanced device profile for detail pages
export interface DeviceProfile extends BaseDeviceProfile {
  healthScore: number
  performanceTrend: "improving" | "stable" | "declining"
  sessionHistory: DeviceSession[]
  metricsOverTime: DeviceMetricPoint[]
  performanceTier?: string
  osVersion?: string
  firstSeen: string
  activeDays: number
  sessionsToday: number
  sessionsThisWeek: number
}

// Individual device session with health snapshot
export interface DeviceSession {
  session: PerformanceSession
  sessionMetrics: PerformanceMetric[]
  healthSnapshot: {
    fps: number
    memory: number
    loadTime: number
    score: number
  }
  duration?: number // in minutes
  screenTransitions: number
  crashCount: number
}

// Time-series performance data point
export interface DeviceMetricPoint {
  timestamp: string
  fps: number
  memory: number
  loadTime: number
  screenName: string
  sessionId: string
  // Enhanced route information
  routePath?: string
  routePattern?: string
  segments?: string[]
  isDynamic?: boolean
  displayName?: string
}

// Device health calculation input
export interface DeviceHealthInput {
  recentSessions: PerformanceSession[]
  recentMetrics: PerformanceMetric[]
  totalSessions: number
  daysSinceFirstSeen: number
}

// Performance comparison data
export interface DeviceComparison {
  device: DeviceProfile
  compared: DeviceProfile
  metrics: {
    fpsImprovement: number
    memoryImprovement: number
    loadTimeImprovement: number
    healthScoreDiff: number
  }
}

// Device analytics summary
export interface DeviceAnalytics {
  performanceDistribution: {
    excellent: number // 80-100 health score
    good: number // 60-79 health score
    fair: number // 40-59 health score
    poor: number // 0-39 health score
  }
  sessionPatterns: {
    avgSessionLength: number
    peakUsageHour: number
    mostUsedScreens: { screen: string; count: number }[]
  }
  trendAnalysis: {
    performanceTrend: "improving" | "stable" | "declining"
    trendConfidence: number // 0-100
    keyMetricChanges: {
      fps: number
      memory: number
      loadTime: number
    }
  }
}

// Re-export performance constants from centralized constants folder
export { HEALTH_SCORE_WEIGHTS, PERFORMANCE_THRESHOLDS } from '@/constants/performance'
