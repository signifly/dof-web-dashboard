// Script to debug session-metric relationship
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSessionMetrics() {
  console.log("🔍 Debugging Session-Metric Relationship...\n")

  try {
    // Get 0.0.35 sessions
    const { data: sessions035, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("app_version", "0.0.35")
      .order("created_at", { ascending: false })

    console.log(`📦 Sessions for 0.0.35: ${sessions035?.length || 0}`)

    if (!sessions035 || sessions035.length === 0) {
      console.log("❌ No sessions found")
      return
    }

    // Get first session ID
    const firstSessionId = sessions035[0].id
    console.log(`\n🔍 Testing with session ID: ${firstSessionId}`)

    // Try to get metrics for this specific session
    const { data: metricsForSession, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("session_id", firstSessionId)

    console.log(`📈 Metrics for session ${firstSessionId}: ${metricsForSession?.length || 0}`)

    if (metricsForSession && metricsForSession.length > 0) {
      console.log("\n📊 Sample metrics:")
      metricsForSession.slice(0, 3).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.metric_type} = ${m.metric_value}`)
      })
    }

    // Now get ALL metrics and see what we get
    const { data: allMetrics, error: allError } = await supabase
      .from("performance_metrics")
      .select("session_id, metric_type, metric_value, timestamp")
      .order("timestamp", { ascending: false })
      .limit(2000) // Increase limit

    console.log(`\n📈 Total metrics retrieved (limit 2000): ${allMetrics?.length || 0}`)

    // Check how many are from 0.0.35 sessions
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = allMetrics?.filter(m => sessionIds035.has(m.session_id)) || []

    console.log(`📊 Metrics from 0.0.35 sessions: ${metrics035.length}`)

    if (metrics035.length > 0) {
      console.log("\n✅ Found 0.0.35 metrics in broader query")
      console.log("📊 Sample:")
      metrics035.slice(0, 3).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.metric_type} = ${m.metric_value}`)
      })
    } else {
      console.log("\n❌ Still no 0.0.35 metrics found even with limit 2000")
    }

    // Check date ranges
    if (allMetrics && allMetrics.length > 0) {
      const oldestMetric = allMetrics[allMetrics.length - 1]
      const newestMetric = allMetrics[0]
      console.log(`\n📅 Date range of retrieved metrics:`)
      console.log(`  Newest: ${newestMetric.timestamp}`)
      console.log(`  Oldest: ${oldestMetric.timestamp}`)
    }

    console.log(`\n📅 Date range of 0.0.35 sessions:`)
    console.log(`  Newest: ${sessions035[0].created_at}`)
    console.log(`  Oldest: ${sessions035[sessions035.length - 1].created_at}`)

  } catch (error) {
    console.error("Script error:", error)
  }
}

debugSessionMetrics()
