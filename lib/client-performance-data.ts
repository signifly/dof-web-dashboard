import { createClient } from "@/lib/supabase/client"

/**
 * Get build performance data grouped by app version (client-side version)
 */
export async function getBuildPerformanceDataClient(): Promise<any[]> {
  const supabase = createClient()

  try {
    // Get all sessions with their app versions
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (sessionsError || !sessions?.length) {
      return []
    }

    // Get all metrics for calculating averages
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")

    if (metricsError || !metrics) {
      return []
    }

    // Available metric types: fps, memory_usage, navigation_time, screen_load
    // Note: cpu_usage is not available in current database schema

    // Group sessions by app version
    const versionGroups = new Map<string, any>()

    sessions.forEach(session => {
      const version = session.app_version
      if (!versionGroups.has(version)) {
        versionGroups.set(version, {
          version,
          sessions: [],
          totalSessions: 0,
          firstSeen: session.created_at,
          lastSeen: session.created_at,
          platforms: new Set(),
        })
      }

      const group = versionGroups.get(version)!
      group.sessions.push(session)
      group.totalSessions++
      group.platforms.add(session.device_type)

      // Update date ranges
      if (new Date(session.created_at) < new Date(group.firstSeen)) {
        group.firstSeen = session.created_at
      }
      if (new Date(session.created_at) > new Date(group.lastSeen)) {
        group.lastSeen = session.created_at
      }
    })

    // Calculate performance metrics for each version
    const buildPerformance = Array.from(versionGroups.values()).map(group => {
      const sessionIds = new Set(group.sessions.map((s: any) => s.id))
      const versionMetrics = metrics.filter(
        m => m.session_id && sessionIds.has(m.session_id)
      )

      // Calculate averages
      const fpsMetrics = versionMetrics.filter(m => m.metric_type === "fps")
      const memoryMetrics = versionMetrics.filter(
        m => m.metric_type === "memory_usage"
      )
      const loadTimeMetrics = versionMetrics.filter(
        m =>
          m.metric_type === "navigation_time" || m.metric_type === "screen_load"
      )
      const cpuMetrics = versionMetrics.filter(
        m => m.metric_type === "cpu_usage"
      )

      const avgFps =
        fpsMetrics.length > 0
          ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            fpsMetrics.length
          : 0
      const avgMemory =
        memoryMetrics.length > 0
          ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            memoryMetrics.length
          : 0
      const avgLoadTime =
        loadTimeMetrics.length > 0
          ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            loadTimeMetrics.length
          : 0
      const avgCpu =
        cpuMetrics.length > 0
          ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
            cpuMetrics.length
          : 0

      // Calculate regression score (performance composite)
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
      const regressionScore = Math.round(
        (fpsScore + memoryScore + loadTimeScore) / 3
      )

      // Determine status based on regression score
      let status = "passed"
      if (regressionScore < 50) status = "failed"
      else if (regressionScore < 70) status = "warning"

      return {
        version: group.version,
        commit: "N/A", // Not available in current schema
        branch: "main", // Default - not tracked
        timestamp: group.lastSeen,
        avgFps: Math.round(avgFps * 10) / 10,
        avgMemory: Math.round(avgMemory),
        avgLoadTime: Math.round(avgLoadTime),
        avgCpu: Math.round(avgCpu),
        regressionScore,
        status,
        totalSessions: group.totalSessions,
        platforms: Array.from(group.platforms),
        dateRange: {
          first: group.firstSeen,
          last: group.lastSeen,
        },
      }
    })

    // Sort by timestamp (newest first) and limit to last 10 versions
    return buildPerformance
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10)
  } catch (error) {
    console.error("Error fetching build performance data:", error)
    return []
  }
}
