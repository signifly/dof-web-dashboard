// Test the exact query being used by getPerformanceSummary after our fix
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugActualQuery() {
  console.log("🔍 Testing ACTUAL Query from getPerformanceSummary...\n")

  try {
    // EXACT query from our fixed code
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    console.log(`Step 1: Sessions query`)
    console.log(`  ✅ Fetched: ${sessions?.length || 0} sessions`)
    if (sessionsError) {
      console.error(`  ❌ Error: ${sessionsError.message}`)
      return
    }

    // Count by version
    const versionCounts = new Map()
    sessions?.forEach(s => {
      versionCounts.set(s.app_version, (versionCounts.get(s.app_version) || 0) + 1)
    })

    console.log(`\n  Versions in result:`)
    Array.from(versionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([version, count]) => {
        console.log(`    ${version}: ${count} sessions`)
      })

    // EXACT metrics query from our fixed code
    const sessionIds = sessions?.map(s => s.id) || []
    console.log(`\nStep 2: Metrics query with .in(${sessionIds.length} session IDs)`)

    const { data: metrics, error: metricsError } = sessionIds.length > 0
      ? await supabase
          .from("performance_metrics")
          .select("*")
          .in("session_id", sessionIds)
      : { data: null, error: null }

    console.log(`  ✅ Fetched: ${metrics?.length || 0} metrics`)
    if (metricsError) {
      console.error(`  ❌ Error: ${metricsError.message}`)
    }

    // Analyze what we got
    const metricsByType = new Map()
    metrics?.forEach(m => {
      metricsByType.set(m.metric_type, (metricsByType.get(m.metric_type) || 0) + 1)
    })

    console.log(`\n  Metrics by type:`)
    Array.from(metricsByType.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`)
      })

    // Check 0.0.35 specifically
    const sessions035 = sessions?.filter(s => s.app_version === "0.0.35") || []
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics?.filter(m => sessionIds035.has(m.session_id)) || []

    console.log(`\nStep 3: 0.0.35 Analysis`)
    console.log(`  Sessions: ${sessions035.length}`)
    console.log(`  Metrics: ${metrics035.length}`)

    const fps035 = metrics035.filter(m => m.metric_type === 'fps')
    const mem035 = metrics035.filter(m => m.metric_type === 'memory_usage')

    console.log(`  FPS metrics: ${fps035.length}`)
    console.log(`  Memory metrics: ${mem035.length}`)

    if (fps035.length > 0) {
      const avgFps = fps035.reduce((sum, m) => sum + m.metric_value, 0) / fps035.length
      console.log(`  Average FPS: ${avgFps.toFixed(2)}`)
    }

    if (mem035.length > 0) {
      const avgMem = mem035.reduce((sum, m) => sum + m.metric_value, 0) / mem035.length
      console.log(`  Average Memory: ${avgMem.toFixed(2)} MB`)
    }

    // Check if we're hitting the 1000 limit
    console.log(`\n🚨 Limit Check:`)
    if (metrics?.length === 1000) {
      console.log(`  ❌ HITTING 1000-ROW LIMIT!`)
      console.log(`  This means there are more metrics but Supabase is truncating them.`)
      console.log(`  Solution: We need to fetch metrics in batches or use a different approach.`)
    } else {
      console.log(`  ✅ NOT hitting limit (${metrics?.length || 0} < 1000)`)
    }

  } catch (error) {
    console.error("Script error:", error)
  }
}

debugActualQuery()
