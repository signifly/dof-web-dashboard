/**
 * Type definitions for version detail pages
 * Provides comprehensive type safety for version-specific performance data
 */

export interface VersionDetails {
  version: string
  commit: string
  branch: string
  firstSeen: string
  lastSeen: string
  totalSessions: number
  totalDevices: number

  // Aggregate metrics
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  regressionScore: number
  status: "passed" | "failed" | "warning"
  healthScore: number
  riskLevel: "low" | "medium" | "high"

  // Platform breakdown
  platforms: VersionPlatform[]

  // Device list
  devices: VersionDevice[]

  // Session timeline (for charts)
  sessionMetrics: VersionSessionMetric[]

  // Regression comparison
  previousVersion: VersionSummary | null
  changes: VersionChanges | null
}

export interface VersionPlatform {
  platform: string
  sessionCount: number
  deviceCount: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  healthScore: number
}

export interface VersionDevice {
  deviceId: string
  platform: string
  totalSessions: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  lastSeen: string
  riskLevel: "low" | "medium" | "high"
}

export interface VersionSessionMetric {
  sessionId: string
  deviceId: string
  platform: string
  timestamp: string
  fps: number
  memory_usage: number
  cpu_usage: number
  load_time: number
}

export interface VersionSummary {
  version: string
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  regressionScore: number
}

export interface VersionChanges {
  fps: { delta: number; percentChange: number }
  memory: { delta: number; percentChange: number }
  cpu: { delta: number; percentChange: number }
  regressionScore: { delta: number }
}
