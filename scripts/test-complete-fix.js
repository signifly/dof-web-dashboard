// Test the complete fix with session limit
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

async function testCompleteFix() {
  console.log("✅ Testing COMPLETE FIX (Limited Sessions + Session Filtering)...\n")

  try {
    // Step 1: Get LIMITED sessions (exactly as in FIXED getPerformanceSummary)
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200) // FIXED: Limit to 200 to avoid .in() clause limits

    console.log(`✅ Total sessions fetched: ${sessions?.length || 0}`)

    const sessions035 = sessions.filter(s => s.app_version === "0.0.35")
    console.log(`✅ Sessions for 0.0.35 in result: ${sessions035.length}`)

    // Step 2: Get metrics using session-based filtering
    const sessionIds = sessions?.map(s => s.id) || []
    const { data: metrics, error: metricsError } = sessionIds.length > 0
      ? await supabase
          .from("performance_metrics")
          .select("*")
          .in("session_id", sessionIds)
      : { data: null, error: null }

    console.log(`✅ Total metrics fetched: ${metrics?.length || 0}`)

    if (metricsError) {
      console.error(`❌ Metrics error: ${metricsError.message}`)
    }

    // Filter to 0.0.35 sessions
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics?.filter(m => sessionIds035.has(m.session_id)) || []
    console.log(`✅ Metrics for 0.0.35: ${metrics035.length}`)

    // Calculate averages for ALL data
    const { average: avgFps, values: fpsValues } = extractMetricsByType(
      metrics || [],
      "FPS",
      0
    )
    const { average: avgMemory, values: memValues } = extractMetricsByType(
      metrics || [],
      "MEMORY",
      0
    )

    console.log("\n📊 OVERALL DASHBOARD (Recent 200 Sessions):")
    console.log("=" .repeat(60))
    console.log(`  Average FPS: ${avgFps.toFixed(2)} (${fpsValues.length} values)`)
    console.log(`  Average Memory: ${avgMemory.toFixed(2)} MB (${memValues.length} values)`)

    // Calculate for 0.0.35 only
    const { average: avgFps035, values: fpsValues035 } = extractMetricsByType(
      metrics035 || [],
      "FPS",
      0
    )
    const { average: avgMemory035, values: memValues035 } = extractMetricsByType(
      metrics035 || [],
      "MEMORY",
      0
    )

    console.log("\n📊 VERSION 0.0.35 CONTRIBUTION:")
    console.log("=" .repeat(60))
    console.log(`  FPS metrics: ${fpsValues035.length} (${fpsValues.length > 0 ? ((fpsValues035.length / fpsValues.length) * 100).toFixed(1) : 0}% of total)`)
    console.log(`  Average FPS: ${avgFps035.toFixed(2)}`)
    console.log(`  Memory metrics: ${memValues035.length} (${memValues.length > 0 ? ((memValues035.length / memValues.length) * 100).toFixed(1) : 0}% of total)`)
    console.log(`  Average Memory: ${avgMemory035.toFixed(2)} MB`)

    if (fpsValues035.length > 0 && memValues035.length > 0) {
      console.log("\n✅ ✅ ✅ SUCCESS! Version 0.0.35 metrics are now included!")
      console.log("   The dashboard WILL NOW show FPS, Memory, and CPU scores for 0.0.35!")
    } else {
      console.log("\n❌ FAILED! Version 0.0.35 metrics still missing!")
    }

    // Show breakdown by version
    console.log("\n📊 BREAKDOWN BY VERSION (in recent 200 sessions):")
    console.log("=" .repeat(60))
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
        const fpsMetrics = versionMetrics.filter(m => m.metric_type === 'fps')
        console.log(`  ${version}: ${count} sessions, ${versionMetrics.length} metrics (${fpsMetrics.length} FPS)`)
      })

  } catch (error) {
    console.error("Script error:", error)
  }
}

testCompleteFix()
