// Final verification that dashboard will show 0.0.35 metrics
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const METRIC_TYPE_FILTERS = {
  FPS: "fps",
  MEMORY: "memory_usage",
  LOAD_TIME: ["navigation_time", "screen_load", "load_time"],
  CPU: "cpu_usage",
  CACHE_SIZE: "cache_size",
}

function extractMetricsByType(metrics, metricType, defaultValue = 0) {
  let filteredMetrics = []

  switch (metricType) {
    case "FPS":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.FPS
      )
      break
    case "MEMORY":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.MEMORY
      )
      break
    case "LOAD_TIME":
      filteredMetrics = metrics.filter(m =>
        METRIC_TYPE_FILTERS.LOAD_TIME.includes(m.metric_type)
      )
      break
    case "CPU":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.CPU
      )
      break
    case "CACHE_SIZE":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.CACHE_SIZE
      )
      break
  }

  const values = filteredMetrics.map(m => m.metric_value)
  const average =
    values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : defaultValue

  return { values, average }
}

async function verifyDashboardFix() {
  console.log("=" .repeat(70))
  console.log("🎯 FINAL VERIFICATION - Dashboard Will Show:")
  console.log("=" .repeat(70))

  try {
    // EXACT query from getPerformanceSummary (with ALL fixes)
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (sessionsError) {
      console.error("❌ Session query error:", sessionsError.message)
      return
    }

    // EXACT metrics query with ALL fixes
    const sessionIds = sessions?.map(s => s.id) || []
    const { data: metrics, error: metricsError } = sessionIds.length > 0
      ? await supabase
          .from("performance_metrics")
          .select("*")
          .in("session_id", sessionIds)
          .order("timestamp", { ascending: false })
          .limit(5000)
      : { data: null, error: null }

    if (metricsError) {
      console.error("❌ Metrics query error:", metricsError.message)
      return
    }

    const totalSessions = sessions?.length || 0
    const totalMetrics = metrics?.length || 0

    // Calculate OVERALL dashboard metrics
    const { average: avgFps, values: fpsValues } = extractMetricsByType(metrics || [], "FPS", 0)
    const { average: avgMemory, values: memValues } = extractMetricsByType(metrics || [], "MEMORY", 0)
    const { average: avgCacheSize, values: cacheValues } = extractMetricsByType(metrics || [], "CACHE_SIZE", 0)

    console.log("\n📊 DASHBOARD WILL DISPLAY:")
    console.log("-" .repeat(70))
    console.log(`  Active Sessions:     ${totalSessions}`)
    console.log(`  Total Metrics:       ${totalMetrics}`)
    console.log(`  Average FPS:         ${avgFps.toFixed(2)} (from ${fpsValues.length} FPS metrics)`)
    console.log(`  Average Memory:      ${avgMemory.toFixed(2)} MB (from ${memValues.length} memory metrics)`)
    console.log(`  Average Cache Size:  ${avgCacheSize.toFixed(2)} MB (from ${cacheValues.length} cache metrics)`)
    console.log(`  Average CPU:         [INFERRED from FPS & Memory data]`)

    // Check 0.0.35 contribution
    console.log("\n📦 VERSION 0.0.35 BREAKDOWN:")
    console.log("-" .repeat(70))

    const sessions035 = sessions?.filter(s => s.app_version === "0.0.35") || []
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics?.filter(m => sessionIds035.has(m.session_id)) || []

    const { average: avgFps035, values: fpsValues035 } = extractMetricsByType(metrics035, "FPS", 0)
    const { average: avgMemory035, values: memValues035 } = extractMetricsByType(metrics035, "MEMORY", 0)

    console.log(`  Sessions:            ${sessions035.length}`)
    console.log(`  Total Metrics:       ${metrics035.length}`)
    console.log(`  FPS Metrics:         ${fpsValues035.length}`)
    console.log(`  Memory Metrics:      ${memValues035.length}`)
    console.log(`  Average FPS:         ${avgFps035.toFixed(2)}`)
    console.log(`  Average Memory:      ${avgMemory035.toFixed(2)} MB`)
    console.log(`  % of Dashboard:      ${((fpsValues035.length / fpsValues.length) * 100).toFixed(1)}%`)

    if (fpsValues035.length > 0 && memValues035.length > 0) {
      console.log("\n✅ ✅ ✅ SUCCESS!")
      console.log("=" .repeat(70))
      console.log("Version 0.0.35 WILL display on the dashboard with:")
      console.log(`  - FPS score: ${avgFps035.toFixed(2)}`)
      console.log(`  - Memory score: ${avgMemory035.toFixed(2)} MB`)
      console.log(`  - CPU score: [Inferred from performance metrics]`)
      console.log("=" .repeat(70))
    } else {
      console.log("\n❌ PROBLEM: Version 0.0.35 metrics are missing!")
    }

    // Version breakdown
    console.log("\n📊 ALL VERSIONS IN DASHBOARD:")
    console.log("-" .repeat(70))
    const versionCounts = new Map()
    sessions?.forEach(s => {
      versionCounts.set(s.app_version, (versionCounts.get(s.app_version) || 0) + 1)
    })

    Array.from(versionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([version, count]) => {
        const versionSessions = sessions.filter(s => s.app_version === version)
        const versionSessionIds = new Set(versionSessions.map(s => s.id))
        const versionMetrics = metrics?.filter(m => versionSessionIds.has(m.session_id)) || []
        const versionFps = versionMetrics.filter(m => m.metric_type === 'fps')
        const versionMem = versionMetrics.filter(m => m.metric_type === 'memory_usage')

        console.log(`  ${version}:`)
        console.log(`    ${count} sessions, ${versionMetrics.length} metrics (${versionFps.length} FPS, ${versionMem.length} Memory)`)
      })

    console.log("\n" + "=" .repeat(70))
    console.log("✅ Verification Complete")
    console.log("=" .repeat(70))

  } catch (error) {
    console.error("❌ Error:", error)
  }
}

verifyDashboardFix()
