// Test the fix with increased limit
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

async function testFix() {
  console.log("🔧 Testing Fix with Increased Limit...\n")

  try {
    // Get sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    console.log(`✅ Total sessions: ${sessions?.length || 0}`)

    const sessions035 = sessions.filter(s => s.app_version === "0.0.35")
    console.log(`✅ Sessions for 0.0.35: ${sessions035.length}`)

    // Get metrics with INCREASED LIMIT (like our fix)
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .limit(10000) // FIXED: Increased limit

    console.log(`✅ Total metrics fetched: ${metrics?.length || 0}`)

    // Filter to 0.0.35 sessions
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics.filter(m => sessionIds035.has(m.session_id))
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

    console.log("\n📊 OVERALL DASHBOARD (ALL VERSIONS):")
    console.log("=" .repeat(50))
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
    console.log("=" .repeat(50))
    console.log(`  FPS metrics: ${fpsValues035.length} (${((fpsValues035.length / fpsValues.length) * 100).toFixed(1)}% of total)`)
    console.log(`  Average FPS: ${avgFps035.toFixed(2)}`)
    console.log(`  Memory metrics: ${memValues035.length} (${((memValues035.length / memValues.length) * 100).toFixed(1)}% of total)`)
    console.log(`  Average Memory: ${avgMemory035.toFixed(2)} MB`)

    if (fpsValues035.length > 0 && memValues035.length > 0) {
      console.log("\n✅ SUCCESS! Version 0.0.35 metrics are now included!")
    } else {
      console.log("\n❌ FAILED! Version 0.0.35 metrics still missing!")
    }

  } catch (error) {
    console.error("Script error:", error)
  }
}

testFix()
