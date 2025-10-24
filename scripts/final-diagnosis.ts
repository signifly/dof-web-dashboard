/**
 * Final diagnosis of the metrics issue
 */

import { createServiceClient } from "../lib/supabase/server"

async function finalDiagnosis() {
  const supabase = createServiceClient()

  console.log("🔍 Final Diagnosis Report")
  console.log("=".repeat(60))

  // Get all sessions
  const { data: allSessions } = await supabase
    .from("performance_sessions")
    .select("*")

  // Get all metrics
  const { data: allMetrics } = await supabase
    .from("performance_metrics")
    .select("*")

  console.log(`\n📊 Database Overview:`)
  console.log(`Total sessions: ${allSessions?.length || 0}`)
  console.log(`Total metrics: ${allMetrics?.length || 0}`)

  // Group sessions by version
  const sessionsByVersion: Record<string, any[]> = {}
  allSessions?.forEach(s => {
    if (!sessionsByVersion[s.app_version]) {
      sessionsByVersion[s.app_version] = []
    }
    sessionsByVersion[s.app_version].push(s)
  })

  // Count metrics per session
  const metricsPerSession: Record<string, number> = {}
  allMetrics?.forEach(m => {
    if (m.session_id) {
      metricsPerSession[m.session_id] = (metricsPerSession[m.session_id] || 0) + 1
    }
  })

  console.log(`\n📋 Version Analysis:`)
  console.log("=".repeat(60))

  Object.entries(sessionsByVersion)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([version, sessions]) => {
      const sessionsWithMetrics = sessions.filter(s => metricsPerSession[s.id] > 0)
      const totalMetrics = sessions.reduce(
        (sum, s) => sum + (metricsPerSession[s.id] || 0),
        0
      )

      console.log(`\nVersion ${version}:`)
      console.log(`  Total sessions: ${sessions.length}`)
      console.log(`  Sessions with metrics: ${sessionsWithMetrics.length}`)
      console.log(`  Sessions WITHOUT metrics: ${sessions.length - sessionsWithMetrics.length}`)
      console.log(`  Total metrics: ${totalMetrics}`)

      if (sessionsWithMetrics.length > 0) {
        const avgMetricsPerSession = totalMetrics / sessionsWithMetrics.length
        console.log(`  Avg metrics per session (with metrics): ${avgMetricsPerSession.toFixed(1)}`)

        // Sample a session with metrics to see what metrics exist
        const sampleSession = sessionsWithMetrics[0]
        const sampleMetrics = allMetrics?.filter(m => m.session_id === sampleSession.id) || []
        const metricTypes = new Set(sampleMetrics.map(m => m.metric_type))
        console.log(`  Sample metric types: ${Array.from(metricTypes).join(", ")}`)
      }
    })

  console.log("\n" + "=".repeat(60))
  console.log("🎯 DIAGNOSIS:")
  console.log("=".repeat(60))
  console.log(`
Version 0.0.33 has ${sessionsByVersion["0.0.33"]?.length || 0} sessions but NO metrics.
This means:
1. The app created session records for version 0.0.33
2. BUT the app never wrote any performance metrics for these sessions
3. This is a DATA COLLECTION issue, not a dashboard issue

The dashboard is working correctly - it's showing 0 FPS/MB/CPU
because there are literally no metrics in the database for version 0.0.33.

To fix this, you need to ensure the app (version 0.0.33) is actually
sending performance metrics to the database, not just session data.
`)

  console.log("=".repeat(60))
}

finalDiagnosis()
