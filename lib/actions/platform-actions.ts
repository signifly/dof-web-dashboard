"use server"

import { createClient } from "@/lib/supabase/server"
import { DeviceProfile } from "@/lib/performance-data"
import {
  calculateInferredCPU,
  extractMetricsByType,
} from "@/lib/utils/cpu-inference-helper"

export interface PlatformDetails {
  platform: string
  totalSessions: number
  totalDevices: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  avgLoadTime: number
  healthScore: number
  riskLevel: "low" | "medium" | "high"
  devices: DeviceProfile[]
  deviceMetrics: Array<{
    deviceId: string
    sessionId: string
    sessionNumber: number
    fps: number
    memory_usage: number
    cpu_usage: number
    load_time: number
    timestamp: string
  }>
  sessionHistory: Array<{
    id: string
    created_at: string
    app_version: string
    device_type: string
  }>
}

/**
 * Get comprehensive platform details with all devices and metrics
 */
export async function getPlatformDetails(
  platform: string
): Promise<PlatformDetails | null> {
  const supabase = createClient()

  try {
    // 1. Get all sessions for this platform
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("device_type", platform)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Sessions error:", sessionsError)
      return null
    }

    if (!sessions || sessions.length === 0) {
      return null
    }

    // 2. Get all metrics for these sessions
    const sessionIds = sessions.map(s => s.id)
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: false })
      .limit(5000)

    if (metricsError) {
      console.error("Metrics error:", metricsError)
    }

    // 3. Calculate platform-level averages
    const { average: avgFps } = extractMetricsByType(metrics || [], "FPS", 0)
    const { average: avgMemory } = extractMetricsByType(
      metrics || [],
      "MEMORY",
      0
    )
    const { average: avgLoadTime } = extractMetricsByType(
      metrics || [],
      "LOAD_TIME",
      0
    )

    // Calculate inferred CPU
    let avgCpu = 0
    if (sessions.length > 0 && metrics && metrics.length > 0) {
      const cpuValues: number[] = []
      sessions.forEach(session => {
        const sessionMetrics = metrics.filter(m => m.session_id === session.id)
        if (sessionMetrics.length > 0) {
          const inferredCpu = calculateInferredCPU(sessionMetrics, platform)
          cpuValues.push(inferredCpu)
        }
      })
      if (cpuValues.length > 0) {
        avgCpu = cpuValues.reduce((sum, cpu) => sum + cpu, 0) / cpuValues.length
      }
    }

    // 4. Group devices
    const deviceMap = new Map<string, any>()
    sessions.forEach(session => {
      const deviceId = session.anonymous_user_id
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          deviceId,
          platform: session.device_type || "Unknown",
          appVersion: session.app_version || "Unknown",
          sessions: [],
          totalSessions: 0,
          fpsMetrics: [],
          memoryMetrics: [],
          lastSeen: session.created_at,
        })
      }

      const device = deviceMap.get(deviceId)!
      device.sessions.push(session)
      device.totalSessions++

      if (new Date(session.created_at) > new Date(device.lastSeen)) {
        device.lastSeen = session.created_at
      }

      const sessionMetrics =
        metrics?.filter(m => m.session_id === session.id) || []
      sessionMetrics.forEach(metric => {
        if (metric.metric_type === "fps") {
          device.fpsMetrics.push(metric.metric_value)
        } else if (metric.metric_type === "memory_usage") {
          device.memoryMetrics.push(metric.metric_value)
        }
      })
    })

    // 5. Calculate device profiles
    const devices: DeviceProfile[] = Array.from(deviceMap.values()).map(
      device => {
        const deviceAvgFps =
          device.fpsMetrics.length > 0
            ? device.fpsMetrics.reduce((sum: number, fps: number) => sum + fps, 0) /
              device.fpsMetrics.length
            : 0

        const deviceAvgMemory =
          device.memoryMetrics.length > 0
            ? device.memoryMetrics.reduce((sum: number, mem: number) => sum + mem, 0) /
              device.memoryMetrics.length
            : 0

        const deviceAvgCpu = calculateInferredCPU(
          device.sessions.flatMap(
            (s: any) => metrics?.filter(m => m.session_id === s.id) || []
          ),
          platform
        )

        let riskLevel: "low" | "medium" | "high" = "low"
        if (
          deviceAvgFps < 20 ||
          deviceAvgMemory > 800 ||
          device.totalSessions < 2
        ) {
          riskLevel = "high"
        } else if (
          deviceAvgFps < 45 ||
          deviceAvgMemory > 400 ||
          device.totalSessions < 5
        ) {
          riskLevel = "medium"
        }

        return {
          deviceId: device.deviceId,
          platform: device.platform,
          appVersion: device.appVersion,
          sessions: device.sessions,
          totalSessions: device.totalSessions,
          avgFps: Math.round(deviceAvgFps * 10) / 10,
          avgMemory: Math.round(deviceAvgMemory),
          avgLoadTime: 0,
          avgCpu: Math.round(deviceAvgCpu * 10) / 10,
          lastSeen: device.lastSeen,
          riskLevel,
        }
      }
    )

    // 6. Create device-based metrics (each session as a data point)
    const deviceMetrics: Array<{
      deviceId: string
      sessionId: string
      sessionNumber: number
      fps: number
      memory_usage: number
      cpu_usage: number
      load_time: number
      timestamp: string
    }> = []

    // Group sessions by device to track session numbers
    const deviceSessionCounts = new Map<string, number>()

    sessions.forEach(session => {
      const deviceId = session.anonymous_user_id
      const sessionNumber = (deviceSessionCounts.get(deviceId) || 0) + 1
      deviceSessionCounts.set(deviceId, sessionNumber)

      // Get metrics for this session
      const sessionMetrics = metrics?.filter(m => m.session_id === session.id) || []

      // Only include sessions that have metrics
      if (sessionMetrics.length > 0) {
        // Calculate averages for this session
        const { average: avgFps } = extractMetricsByType(sessionMetrics, "FPS", 0)
        const { average: avgMemory } = extractMetricsByType(sessionMetrics, "MEMORY", 0)
        const { average: avgLoadTime } = extractMetricsByType(sessionMetrics, "LOAD_TIME", 0)
        const avgCpu = calculateInferredCPU(sessionMetrics, platform)

        deviceMetrics.push({
          deviceId,
          sessionId: session.id,
          sessionNumber,
          fps: Math.round(avgFps * 10) / 10,
          memory_usage: Math.round(avgMemory),
          cpu_usage: Math.round(avgCpu * 10) / 10,
          load_time: Math.round(avgLoadTime),
          timestamp: session.created_at,
        })
      }
    })

    // Sort by timestamp (oldest to newest)
    deviceMetrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // 7. Calculate health score
    const fpsScore = avgFps >= 50 ? 90 : avgFps >= 30 ? 70 : avgFps >= 20 ? 50 : 30
    const memoryScore =
      avgMemory <= 200 ? 90 : avgMemory <= 400 ? 70 : avgMemory <= 600 ? 50 : 30
    const loadTimeScore =
      avgLoadTime <= 500
        ? 90
        : avgLoadTime <= 1000
          ? 70
          : avgLoadTime <= 2000
            ? 50
            : 30
    const healthScore = Math.round((fpsScore + memoryScore + loadTimeScore) / 3)

    // 8. Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low"
    if (healthScore < 50) {
      riskLevel = "high"
    } else if (healthScore < 70) {
      riskLevel = "medium"
    }

    return {
      platform,
      totalSessions: sessions.length,
      totalDevices: devices.length,
      avgFps: Math.round(avgFps * 10) / 10,
      avgMemory: Math.round(avgMemory),
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgLoadTime: Math.round(avgLoadTime),
      healthScore,
      riskLevel,
      devices,
      deviceMetrics,
      sessionHistory: sessions.slice(0, 50),
    }
  } catch (error) {
    console.error("Error fetching platform details:", error)
    return null
  }
}
