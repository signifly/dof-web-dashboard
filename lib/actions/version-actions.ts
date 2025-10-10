"use server"

import { createClient } from "@/lib/supabase/server"
import {
  VersionDetails,
  VersionPlatform,
  VersionDevice,
  VersionSessionMetric,
  VersionSummary,
  VersionChanges,
} from "@/lib/types/version"
import {
  calculateInferredCPU,
  extractMetricsByType,
} from "@/lib/utils/cpu-inference-helper"
import { Tables } from "@/types/database"

type PerformanceSession = Tables<"performance_sessions">
type PerformanceMetric = Tables<"performance_metrics">

/**
 * Get comprehensive version details with all performance data
 * Following the pattern from platform-actions.ts
 */
export async function getVersionDetails(
  version: string
): Promise<VersionDetails | null> {
  const supabase = createClient()

  try {
    // 1. Get all sessions for this version
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("app_version", version)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Sessions error:", sessionsError)
      return null
    }

    if (!sessions || sessions.length === 0) {
      return null
    }

    // Type assert for TypeScript
    const typedSessions = sessions as PerformanceSession[]

    // 2. Get all metrics for these sessions (limit 5000 like platform page)
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

    const typedMetrics = (metrics || []) as PerformanceMetric[]

    // 3. Calculate aggregate metrics (reuse extraction helpers)
    const { average: avgFps } = extractMetricsByType(typedMetrics, "FPS", 0)
    const { average: avgMemory } = extractMetricsByType(
      typedMetrics,
      "MEMORY",
      0
    )
    const { average: avgLoadTime } = extractMetricsByType(
      typedMetrics,
      "LOAD_TIME",
      0
    )

    // Calculate inferred CPU (follow pattern from platform-actions.ts lines 91-104)
    let avgCpu = 0
    if (typedSessions.length > 0 && typedMetrics.length > 0) {
      const cpuValues: number[] = []
      typedSessions.forEach(session => {
        const sessionMetrics = typedMetrics.filter(
          m => m.session_id === session.id
        )
        if (sessionMetrics.length > 0) {
          const inferredCpu = calculateInferredCPU(
            sessionMetrics,
            session.device_type || "Unknown"
          )
          cpuValues.push(inferredCpu)
        }
      })
      if (cpuValues.length > 0) {
        avgCpu = cpuValues.reduce((sum, cpu) => sum + cpu, 0) / cpuValues.length
      }
    }

    // 4. Group by platform
    const platformMap = new Map<string, {
      platform: string
      sessions: PerformanceSession[]
      sessionCount: number
      deviceCount: number
      fpsValues: number[]
      memoryValues: number[]
      cpuValues: number[]
    }>()

    typedSessions.forEach(session => {
      const platform = session.device_type || "Unknown"
      if (!platformMap.has(platform)) {
        platformMap.set(platform, {
          platform,
          sessions: [],
          sessionCount: 0,
          deviceCount: 0,
          fpsValues: [],
          memoryValues: [],
          cpuValues: [],
        })
      }

      const platformGroup = platformMap.get(platform)!
      platformGroup.sessions.push(session)
      platformGroup.sessionCount++
    })

    // Calculate platform metrics
    const platforms: VersionPlatform[] = Array.from(platformMap.values()).map(
      group => {
        // Get unique device count for this platform
        const uniqueDevices = new Set(
          group.sessions.map(s => s.anonymous_user_id)
        )

        // Calculate metrics for this platform's sessions
        const platformSessionIds = group.sessions.map(s => s.id)
        const platformMetrics = typedMetrics.filter(m =>
          platformSessionIds.includes(m.session_id || "")
        )

        const { average: platformFps } = extractMetricsByType(
          platformMetrics,
          "FPS",
          0
        )
        const { average: platformMemory } = extractMetricsByType(
          platformMetrics,
          "MEMORY",
          0
        )

        // Calculate platform CPU
        let platformCpu = 0
        const platformCpuValues: number[] = []
        group.sessions.forEach(session => {
          const sessionMetrics = typedMetrics.filter(
            m => m.session_id === session.id
          )
          if (sessionMetrics.length > 0) {
            const cpu = calculateInferredCPU(sessionMetrics, group.platform)
            platformCpuValues.push(cpu)
          }
        })
        if (platformCpuValues.length > 0) {
          platformCpu =
            platformCpuValues.reduce((sum, cpu) => sum + cpu, 0) /
            platformCpuValues.length
        }

        // Calculate health score for platform
        const fpsScore =
          platformFps >= 50 ? 90 : platformFps >= 30 ? 70 : platformFps >= 20 ? 50 : 30
        const memoryScore =
          platformMemory <= 200
            ? 90
            : platformMemory <= 400
              ? 70
              : platformMemory <= 600
                ? 50
                : 30
        const healthScore = Math.round((fpsScore + memoryScore) / 2)

        return {
          platform: group.platform,
          sessionCount: group.sessionCount,
          deviceCount: uniqueDevices.size,
          avgFps: Math.round(platformFps * 10) / 10,
          avgMemory: Math.round(platformMemory),
          avgCpu: Math.round(platformCpu * 10) / 10,
          healthScore,
        }
      }
    )

    // 5. Group by device (follow pattern from platform-actions.ts)
    const deviceMap = new Map<string, {
      deviceId: string
      platform: string
      sessions: PerformanceSession[]
      totalSessions: number
      fpsMetrics: number[]
      memoryMetrics: number[]
      lastSeen: string
    }>()

    typedSessions.forEach(session => {
      const deviceId = session.anonymous_user_id
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          deviceId,
          platform: session.device_type || "Unknown",
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

      const sessionMetrics = typedMetrics.filter(
        m => m.session_id === session.id
      )
      sessionMetrics.forEach(metric => {
        if (metric.metric_type === "fps") {
          device.fpsMetrics.push(metric.metric_value)
        } else if (metric.metric_type === "memory_usage") {
          device.memoryMetrics.push(metric.metric_value)
        }
      })
    })

    // Calculate device profiles
    const devices: VersionDevice[] = Array.from(deviceMap.values()).map(
      device => {
        const deviceAvgFps =
          device.fpsMetrics.length > 0
            ? device.fpsMetrics.reduce((sum, fps) => sum + fps, 0) /
              device.fpsMetrics.length
            : 0

        const deviceAvgMemory =
          device.memoryMetrics.length > 0
            ? device.memoryMetrics.reduce((sum, mem) => sum + mem, 0) /
              device.memoryMetrics.length
            : 0

        const deviceAvgCpu = calculateInferredCPU(
          device.sessions.flatMap(
            s => typedMetrics.filter(m => m.session_id === s.id) || []
          ),
          device.platform
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
          totalSessions: device.totalSessions,
          avgFps: Math.round(deviceAvgFps * 10) / 10,
          avgMemory: Math.round(deviceAvgMemory),
          avgCpu: Math.round(deviceAvgCpu * 10) / 10,
          lastSeen: device.lastSeen,
          riskLevel,
        }
      }
    )

    // 6. Build session timeline for charts
    const sessionMetrics: VersionSessionMetric[] = typedSessions.map(
      session => {
        const sessionMetrics = typedMetrics.filter(
          m => m.session_id === session.id
        )
        const { average: fps } = extractMetricsByType(sessionMetrics, "FPS", 0)
        const { average: memory } = extractMetricsByType(
          sessionMetrics,
          "MEMORY",
          0
        )
        const { average: loadTime } = extractMetricsByType(
          sessionMetrics,
          "LOAD_TIME",
          0
        )
        const cpu = calculateInferredCPU(
          sessionMetrics,
          session.device_type || "Unknown"
        )

        return {
          sessionId: session.id,
          deviceId: session.anonymous_user_id,
          platform: session.device_type || "Unknown",
          timestamp: session.created_at,
          fps: Math.round(fps * 10) / 10,
          memory_usage: Math.round(memory),
          cpu_usage: Math.round(cpu * 10) / 10,
          load_time: Math.round(loadTime),
        }
      }
    )

    // Sort by timestamp (oldest to newest for charts)
    sessionMetrics.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // 7. Calculate health score and risk level
    const fpsScore =
      avgFps >= 50 ? 90 : avgFps >= 30 ? 70 : avgFps >= 20 ? 50 : 30
    const memoryScore =
      avgMemory <= 200
        ? 90
        : avgMemory <= 400
          ? 70
          : avgMemory <= 600
            ? 50
            : 30
    const loadTimeScore =
      avgLoadTime <= 500
        ? 90
        : avgLoadTime <= 1000
          ? 70
          : avgLoadTime <= 2000
            ? 50
            : 30
    const healthScore = Math.round(
      (fpsScore + memoryScore + loadTimeScore) / 3
    )

    // Calculate regression score
    const regressionScore = Math.round(
      (fpsScore + memoryScore + loadTimeScore) / 3
    )

    // Determine status based on regression score
    let status: "passed" | "failed" | "warning" = "passed"
    if (regressionScore < 50) {
      status = "failed"
    } else if (regressionScore < 70) {
      status = "warning"
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low"
    if (healthScore < 50) {
      riskLevel = "high"
    } else if (healthScore < 70) {
      riskLevel = "medium"
    }

    // 8. Get previous version for regression comparison
    const previousVersion = await getPreviousVersion(version, supabase)
    const changes = previousVersion
      ? calculateChanges(
          {
            avgFps,
            avgMemory,
            avgCpu,
            avgLoadTime,
            regressionScore,
          },
          previousVersion
        )
      : null

    return {
      version,
      commit: "N/A", // Not available in current schema
      branch: "main", // Default - not tracked in current schema
      firstSeen: typedSessions[typedSessions.length - 1].created_at,
      lastSeen: typedSessions[0].created_at,
      totalSessions: typedSessions.length,
      totalDevices: deviceMap.size,
      avgFps: Math.round(avgFps * 10) / 10,
      avgMemory: Math.round(avgMemory),
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgLoadTime: Math.round(avgLoadTime),
      regressionScore,
      status,
      healthScore,
      riskLevel,
      platforms,
      devices,
      sessionMetrics,
      previousVersion,
      changes,
    }
  } catch (error) {
    console.error("Error fetching version details:", error)
    return null
  }
}

/**
 * Helper: Get previous version for regression comparison
 */
async function getPreviousVersion(
  currentVersion: string,
  supabase: ReturnType<typeof createClient>
): Promise<VersionSummary | null> {
  try {
    // Get all versions sorted by timestamp
    const { data: sessions, error } = await supabase
      .from("performance_sessions")
      .select("app_version, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error || !sessions) {
      return null
    }

    // Find unique versions and get the one before current
    const versionTimestamps = new Map<string, string>()
    sessions.forEach(session => {
      if (
        !versionTimestamps.has(session.app_version) ||
        new Date(session.created_at) >
          new Date(versionTimestamps.get(session.app_version)!)
      ) {
        versionTimestamps.set(session.app_version, session.created_at)
      }
    })

    // Sort versions by their latest timestamp
    const sortedVersions = Array.from(versionTimestamps.entries()).sort(
      (a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime()
    )

    const currentIndex = sortedVersions.findIndex(
      ([ver]) => ver === currentVersion
    )

    if (currentIndex === -1 || currentIndex === sortedVersions.length - 1) {
      return null
    }

    const prevVersion = sortedVersions[currentIndex + 1][0]

    // Fetch metrics for previous version
    const { data: prevSessions, error: prevSessionsError } = await supabase
      .from("performance_sessions")
      .select("id")
      .eq("app_version", prevVersion)

    if (prevSessionsError || !prevSessions || prevSessions.length === 0) {
      return null
    }

    const prevSessionIds = prevSessions.map(s => s.id)
    const { data: prevMetrics, error: prevMetricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", prevSessionIds)
      .limit(5000)

    if (prevMetricsError || !prevMetrics) {
      return null
    }

    const typedPrevMetrics = prevMetrics as PerformanceMetric[]

    // Calculate averages for previous version
    const { average: prevFps } = extractMetricsByType(
      typedPrevMetrics,
      "FPS",
      0
    )
    const { average: prevMemory } = extractMetricsByType(
      typedPrevMetrics,
      "MEMORY",
      0
    )
    const { average: prevLoadTime } = extractMetricsByType(
      typedPrevMetrics,
      "LOAD_TIME",
      0
    )

    // Calculate CPU for previous version
    let prevCpu = 0
    if (prevSessions.length > 0) {
      const { data: prevSessionsDetail } = await supabase
        .from("performance_sessions")
        .select("*")
        .eq("app_version", prevVersion)

      if (prevSessionsDetail) {
        const cpuValues: number[] = []
        prevSessionsDetail.forEach((session: PerformanceSession) => {
          const sessionMetrics = typedPrevMetrics.filter(
            m => m.session_id === session.id
          )
          if (sessionMetrics.length > 0) {
            const cpu = calculateInferredCPU(
              sessionMetrics,
              session.device_type || "Unknown"
            )
            cpuValues.push(cpu)
          }
        })
        if (cpuValues.length > 0) {
          prevCpu = cpuValues.reduce((sum, cpu) => sum + cpu, 0) / cpuValues.length
        }
      }
    }

    // Calculate regression score
    const fpsScore =
      prevFps >= 50 ? 90 : prevFps >= 30 ? 70 : prevFps >= 20 ? 50 : 30
    const memoryScore =
      prevMemory <= 200
        ? 90
        : prevMemory <= 400
          ? 70
          : prevMemory <= 600
            ? 50
            : 30
    const loadTimeScore =
      prevLoadTime <= 500
        ? 90
        : prevLoadTime <= 1000
          ? 70
          : prevLoadTime <= 2000
            ? 50
            : 30
    const prevRegressionScore = Math.round(
      (fpsScore + memoryScore + loadTimeScore) / 3
    )

    return {
      version: prevVersion,
      avgFps: Math.round(prevFps * 10) / 10,
      avgMemory: Math.round(prevMemory),
      avgCpu: Math.round(prevCpu * 10) / 10,
      avgLoadTime: Math.round(prevLoadTime),
      regressionScore: prevRegressionScore,
    }
  } catch (error) {
    console.error("Error fetching previous version:", error)
    return null
  }
}

/**
 * Helper: Calculate metric changes between versions
 */
function calculateChanges(
  current: {
    avgFps: number
    avgMemory: number
    avgCpu: number
    avgLoadTime: number
    regressionScore: number
  },
  previous: VersionSummary
): VersionChanges {
  return {
    fps: {
      delta: current.avgFps - previous.avgFps,
      percentChange:
        previous.avgFps !== 0
          ? ((current.avgFps - previous.avgFps) / previous.avgFps) * 100
          : 0,
    },
    memory: {
      delta: current.avgMemory - previous.avgMemory,
      percentChange:
        previous.avgMemory !== 0
          ? ((current.avgMemory - previous.avgMemory) / previous.avgMemory) *
            100
          : 0,
    },
    cpu: {
      delta: current.avgCpu - previous.avgCpu,
      percentChange:
        previous.avgCpu !== 0
          ? ((current.avgCpu - previous.avgCpu) / previous.avgCpu) * 100
          : 0,
    },
    regressionScore: {
      delta: current.regressionScore - previous.regressionScore,
    },
  }
}
