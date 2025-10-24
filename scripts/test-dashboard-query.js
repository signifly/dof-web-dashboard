// Script to test the exact query the dashboard uses
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function from cpu-inference-helper.ts
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

async function testDashboardQuery() {
  console.log("🔍 Testing Dashboard Query (same as getPerformanceSummary)...\n")

  try {
    // Step 1: Get session summary data (exactly as in getPerformanceSummary)
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Sessions table error:", sessionsError.message)
      return
    }

    console.log(`✅ Total sessions: ${sessions?.length || 0}`)

    // Filter to 0.0.35
    const sessions035 = sessions.filter(s => s.app_version === "0.0.35")
    console.log(`✅ Sessions for 0.0.35: ${sessions035.length}`)

    // Step 2: Get all performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")

    if (metricsError) {
      console.error("Metrics table error:", metricsError.message)
      return
    }

    console.log(`✅ Total metrics: ${metrics?.length || 0}`)

    // Filter to 0.0.35 sessions
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics.filter(m => sessionIds035.has(m.session_id))
    console.log(`✅ Metrics for 0.0.35: ${metrics035.length}`)

    // Step 3: Calculate averages using helper functions (exactly as in code)
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
    const { average: avgLoadTime, values: loadValues } = extractMetricsByType(
      metrics || [],
      "LOAD_TIME",
      0
    )
    const { average: avgCacheSize, values: cacheValues } = extractMetricsByType(
      metrics || [],
      "CACHE_SIZE",
      0
    )

    console.log("\n📊 OVERALL DASHBOARD (ALL VERSIONS):")
    console.log("=" .repeat(50))
    console.log(`  Average FPS: ${avgFps.toFixed(2)} (${fpsValues.length} values)`)
    console.log(`  Average Memory: ${avgMemory.toFixed(2)} (${memValues.length} values)`)
    console.log(`  Average Load Time: ${avgLoadTime.toFixed(2)} (${loadValues.length} values)`)
    console.log(`  Average Cache Size: ${avgCacheSize.toFixed(2)} (${cacheValues.length} values)`)

    // Step 4: Calculate for 0.0.35 only
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
    const { average: avgLoadTime035, values: loadValues035 } = extractMetricsByType(
      metrics035 || [],
      "LOAD_TIME",
      0
    )

    console.log("\n📊 VERSION 0.0.35 ONLY:")
    console.log("=" .repeat(50))
    console.log(`  Average FPS: ${avgFps035.toFixed(2)} (${fpsValues035.length} values)`)
    console.log(`  Average Memory: ${avgMemory035.toFixed(2)} (${memValues035.length} values)`)
    console.log(`  Average Load Time: ${avgLoadTime035.toFixed(2)} (${loadValues035.length} values)`)

    // Check if 0.0.35 metrics are included in overall
    console.log("\n🔍 Diagnostic:")
    console.log("=" .repeat(50))
    console.log(`  Total FPS metrics: ${fpsValues.length}`)
    console.log(`  FPS metrics for 0.0.35: ${fpsValues035.length}`)
    console.log(`  Percentage: ${((fpsValues035.length / fpsValues.length) * 100).toFixed(1)}%`)

  } catch (error) {
    console.error("Script error:", error)
  }
}

testDashboardQuery()
