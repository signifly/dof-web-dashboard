/**
 * Test the build performance calculation for version 0.0.33
 */

import { createServiceClient } from "../lib/supabase/server"

async function testBuildCalculation() {
  const supabase = createServiceClient()

  console.log("🔍 Testing build calculation for version 0.0.33...")
  console.log("=".repeat(60))

  const version = "0.0.33"

  // Get sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("performance_sessions")
    .select("*")
    .eq("app_version", version)

  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError)
    return
  }

  console.log(`\nSessions for ${version}: ${sessions?.length || 0}`)

  if (!sessions || sessions.length === 0) {
    console.log("No sessions found!")
    return
  }

  // Get metrics
  const sessionIds = sessions.map(s => s.id)
  const { data: metrics, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("*")
    .in("session_id", sessionIds)

  if (metricsError) {
    console.error("Error fetching metrics:", metricsError)
    return
  }

  console.log(`Metrics for ${version}: ${metrics?.length || 0}`)

  if (!metrics || metrics.length === 0) {
    console.log("No metrics found!")
    return
  }

  // Filter metrics by type
  const fpsMetrics = metrics.filter(m => m.metric_type === "fps")
  const memoryMetrics = metrics.filter(m => m.metric_type === "memory_usage")
  const loadTimeMetrics = metrics.filter(
    m => m.metric_type === "navigation_time" || m.metric_type === "screen_load"
  )

  console.log(`\nFPS metrics: ${fpsMetrics.length}`)
  console.log(`Memory metrics: ${memoryMetrics.length}`)
  console.log(`Load time metrics: ${loadTimeMetrics.length}`)

  // Calculate averages
  const avgFps =
    fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) / fpsMetrics.length
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

  console.log(`\nCalculated values:`)
  console.log(`avgFps (raw): ${avgFps}`)
  console.log(`avgFps (rounded): ${Math.round(avgFps * 10) / 10}`)
  console.log(`avgMemory (raw): ${avgMemory}`)
  console.log(`avgMemory (rounded): ${Math.round(avgMemory)}`)
  console.log(`avgLoadTime: ${avgLoadTime}`)

  // Calculate regression score
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

  const regressionScore = Math.round((fpsScore + memoryScore + loadTimeScore) / 3)

  let status = "passed"
  if (regressionScore < 50) status = "failed"
  else if (regressionScore < 70) status = "warning"

  console.log(`\nScores:`)
  console.log(`fpsScore: ${fpsScore}`)
  console.log(`memoryScore: ${memoryScore}`)
  console.log(`loadTimeScore: ${loadTimeScore}`)
  console.log(`regressionScore: ${regressionScore}`)
  console.log(`status: ${status}`)

  console.log("\n" + "=".repeat(60))
}

testBuildCalculation()
