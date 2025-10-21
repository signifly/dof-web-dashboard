/**
 * Script to check metrics data for version 0.0.33
 */

import { createServiceClient } from "../lib/supabase/server"

async function checkVersionData() {
  const supabase = createServiceClient()

  console.log("🔍 Checking data for version 0.0.33...")
  console.log("=" .repeat(60))

  try {
    // Get sessions for version 0.0.33
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("app_version", "0.0.33")

    if (sessionsError) throw sessionsError

    console.log(`\n📊 Sessions for version 0.0.33: ${sessions?.length || 0}`)

    if (sessions && sessions.length > 0) {
      console.log(`\nSession IDs:`)
      sessions.forEach((s, i) => {
        console.log(
          `  ${i + 1}. ${s.id} - ${s.device_type} - ${new Date(s.created_at).toLocaleString()}`
        )
      })

      // Get all metrics for these sessions
      const sessionIds = sessions.map((s) => s.id)
      const { data: metrics, error: metricsError } = await supabase
        .from("performance_metrics")
        .select("*")
        .in("session_id", sessionIds)

      if (metricsError) throw metricsError

      console.log(`\n📈 Total metrics for version 0.0.33: ${metrics?.length || 0}`)

      if (metrics && metrics.length > 0) {
        // Group by metric type
        const metricsByType = metrics.reduce(
          (acc, m) => {
            if (!acc[m.metric_type]) {
              acc[m.metric_type] = []
            }
            acc[m.metric_type].push(m.metric_value)
            return acc
          },
          {} as Record<string, number[]>
        )

        console.log(`\nMetrics breakdown:`)
        Object.entries(metricsByType).forEach(([type, values]) => {
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length
          const min = Math.min(...values)
          const max = Math.max(...values)
          console.log(`  ${type}: ${values.length} records`)
          console.log(`    Average: ${avg.toFixed(2)}`)
          console.log(`    Min: ${min}, Max: ${max}`)
        })
      } else {
        console.log(`\n⚠️  No metrics found for version 0.0.33 sessions!`)
      }
    }

    // Compare with version 0.0.32
    console.log("\n" + "=".repeat(60))
    console.log("📊 Comparing with version 0.0.32...")
    console.log("-".repeat(60))

    const { data: sessions32, error: sessions32Error } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("app_version", "0.0.32")

    if (sessions32Error) throw sessions32Error

    console.log(`\nSessions for version 0.0.32: ${sessions32?.length || 0}`)

    if (sessions32 && sessions32.length > 0) {
      const sessionIds32 = sessions32.map((s) => s.id)
      const { data: metrics32, error: metrics32Error } = await supabase
        .from("performance_metrics")
        .select("*")
        .in("session_id", sessionIds32)

      if (metrics32Error) throw metrics32Error

      console.log(`Total metrics for version 0.0.32: ${metrics32?.length || 0}`)

      if (metrics32 && metrics32.length > 0) {
        const metricsByType32 = metrics32.reduce(
          (acc, m) => {
            if (!acc[m.metric_type]) {
              acc[m.metric_type] = []
            }
            acc[m.metric_type].push(m.metric_value)
            return acc
          },
          {} as Record<string, number[]>
        )

        console.log(`\nMetrics breakdown:`)
        Object.entries(metricsByType32).forEach(([type, values]) => {
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length
          console.log(`  ${type}: ${values.length} records (avg: ${avg.toFixed(2)})`)
        })
      }
    }

    console.log("\n" + "=".repeat(60))
  } catch (error) {
    console.error("\n❌ Error checking version data:")
    console.error(error)
    process.exit(1)
  }
}

// Run the script
checkVersionData()
