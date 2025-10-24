/**
 * Simulate the client-side calculation
 */

import { createClient } from "@supabase/supabase-js"
import {
  inferCPUUsage,
  PerformanceMetricsForInference,
} from "../lib/utils/cpu-inference"

async function simulateClientCalculation() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, anonKey)

  console.log("🔍 Simulating client-side build performance calculation...")
  console.log("=".repeat(60))

  try {
    // Get all sessions with their app versions
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (sessionsError || !sessions?.length) {
      console.log("❌ No sessions found or error:", sessionsError)
      return []
    }

    console.log(`✅ Fetched ${sessions.length} sessions`)

    // Get all metrics for calculating averages
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")

    if (metricsError || !metrics || metrics.length === 0) {
      console.log("❌ No metrics found or error:", metricsError)
      return []
    }

    console.log(`✅ Fetched ${metrics.length} metrics`)

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

    console.log(`\n📊 Version groups: ${versionGroups.size}`)
    console.log("Versions:", Array.from(versionGroups.keys()).join(", "))

    // Calculate performance metrics for each version
    const buildPerformance = Array.from(versionGroups.values()).map(group => {
      const sessionIds = new Set(group.sessions.map((s: any) => s.id))
      const versionMetrics = metrics.filter(
        m => m.session_id && sessionIds.has(m.session_id)
      )

      console.log(`\n--- Version ${group.version} ---`)
      console.log(`Sessions: ${group.sessions.length}`)
      console.log(`Total metrics: ${versionMetrics.length}`)

      // Calculate averages
      const fpsMetrics = versionMetrics.filter(m => m.metric_type === "fps")
      const memoryMetrics = versionMetrics.filter(
        m => m.metric_type === "memory_usage"
      )
      const loadTimeMetrics = versionMetrics.filter(
        m =>
          m.metric_type === "navigation_time" || m.metric_type === "screen_load"
      )

      console.log(`FPS metrics: ${fpsMetrics.length}`)
      console.log(`Memory metrics: ${memoryMetrics.length}`)
      console.log(`Load time metrics: ${loadTimeMetrics.length}`)

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

      console.log(`avgFps (raw): ${avgFps}`)
      console.log(`avgMemory (raw): ${avgMemory}`)
      console.log(`avgLoadTime (raw): ${avgLoadTime}`)

      // Calculate regression score
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

      const result = {
        version: group.version,
        avgFps: Math.round(avgFps * 10) / 10,
        avgMemory: Math.round(avgMemory),
        avgLoadTime: Math.round(avgLoadTime),
        regressionScore,
        status,
        totalSessions: group.totalSessions,
      }

      console.log(`avgFps (final): ${result.avgFps}`)
      console.log(`avgMemory (final): ${result.avgMemory}`)
      console.log(`regressionScore: ${result.regressionScore}`)
      console.log(`status: ${result.status}`)

      return result
    })

    // Sort by version and show top 10
    const sortedBuilds = buildPerformance
      .sort((a, b) => b.version.localeCompare(a.version))
      .slice(0, 10)

    console.log("\n" + "=".repeat(60))
    console.log("📈 Final Build Performance (Top 10):")
    console.log("=".repeat(60))

    sortedBuilds.forEach((build, index) => {
      console.log(`\n${index + 1}. Version: ${build.version}`)
      console.log(`   FPS: ${build.avgFps}`)
      console.log(`   Memory: ${build.avgMemory} MB`)
      console.log(`   Score: ${build.regressionScore}`)
      console.log(`   Status: ${build.status}`)
      console.log(`   Sessions: ${build.totalSessions}`)
    })

    return sortedBuilds
  } catch (error) {
    console.error("\n❌ Error:", error)
    return []
  }
}

simulateClientCalculation()
