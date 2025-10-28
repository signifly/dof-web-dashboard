// Test getBuildPerformanceData with the fix
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBuildPerformance() {
  console.log("🔍 Testing getBuildPerformanceData (with fixes)...\n")

  try {
    // Simulate the FIXED function
    const { data: sessions } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    console.log(`✅ Sessions fetched: ${sessions?.length || 0}`)

    const sessionIds = sessions?.map(s => s.id) || []

    const { data: metrics } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: false })

    console.log(`✅ Metrics fetched: ${metrics?.length || 0}`)

    // Group by version
    const versionGroups = new Map()
    sessions?.forEach(s => {
      if (!versionGroups.has(s.app_version)) {
        versionGroups.set(s.app_version, { sessions: [], metrics: [] })
      }
      versionGroups.get(s.app_version).sessions.push(s)
    })

    // Add metrics to each version
    metrics?.forEach(m => {
      const session = sessions?.find(s => s.id === m.session_id)
      if (session) {
        const group = versionGroups.get(session.app_version)
        if (group) group.metrics.push(m)
      }
    })

    console.log("\n📊 BUILD PERFORMANCE BY VERSION:")
    console.log("=" .repeat(70))

    Array.from(versionGroups.entries())
      .sort((a, b) => {
        const aLast = Math.max(...a[1].sessions.map(s => new Date(s.created_at).getTime()))
        const bLast = Math.max(...b[1].sessions.map(s => new Date(s.created_at).getTime()))
        return bLast - aLast
      })
      .forEach(([version, data]) => {
        const fpsMetrics = data.metrics.filter(m => m.metric_type === 'fps')
        const memMetrics = data.metrics.filter(m => m.metric_type === 'memory_usage')

        const avgFps = fpsMetrics.length > 0
          ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) / fpsMetrics.length
          : 0

        const avgMem = memMetrics.length > 0
          ? memMetrics.reduce((sum, m) => sum + m.metric_value, 0) / memMetrics.length
          : 0

        console.log(`\n  Version ${version}:`)
        console.log(`    Sessions: ${data.sessions.length}`)
        console.log(`    Total Metrics: ${data.metrics.length}`)
        console.log(`    FPS Metrics: ${fpsMetrics.length} (avg: ${avgFps.toFixed(2)})`)
        console.log(`    Memory Metrics: ${memMetrics.length} (avg: ${avgMem.toFixed(2)} MB)`)

        if (fpsMetrics.length === 0 && memMetrics.length === 0) {
          console.log(`    ❌ NO PERFORMANCE METRICS!`)
        } else {
          console.log(`    ✅ Has performance metrics`)
        }
      })

    console.log("\n" + "=" .repeat(70))

    // Check 0.0.35 specifically
    const version035 = versionGroups.get("0.0.35")
    if (version035) {
      const fpsCount = version035.metrics.filter(m => m.metric_type === 'fps').length
      const memCount = version035.metrics.filter(m => m.metric_type === 'memory_usage').length

      if (fpsCount > 0 && memCount > 0) {
        console.log("\n✅ ✅ ✅ SUCCESS!")
        console.log("Version 0.0.35 WILL display in 'Recent App Version Performance':")
        console.log(`  - ${fpsCount} FPS metrics`)
        console.log(`  - ${memCount} Memory metrics`)
      } else {
        console.log("\n❌ Version 0.0.35 still has no metrics")
      }
    } else {
      console.log("\n❌ Version 0.0.35 not found in results")
    }

  } catch (error) {
    console.error("Error:", error)
  }
}

testBuildPerformance()
