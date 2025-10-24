/**
 * Debug the filtering logic
 */

import { createClient } from "@supabase/supabase-js"

async function debugFilter() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, anonKey)

  console.log("🔍 Debugging filter logic...")
  console.log("=".repeat(60))

  // Get sessions for version 0.0.33
  const { data: sessions, error: sessionsError } = await supabase
    .from("performance_sessions")
    .select("*")
    .eq("app_version", "0.0.33")

  if (sessionsError || !sessions) {
    console.error("Error fetching sessions:", sessionsError)
    return
  }

  console.log(`\nSessions for 0.0.33: ${sessions.length}`)

  // Get all metrics
  const { data: allMetrics, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("*")

  if (metricsError || !allMetrics) {
    console.error("Error fetching metrics:", metricsError)
    return
  }

  console.log(`Total metrics in database: ${allMetrics.length}`)

  // Create a Set of session IDs
  const sessionIds = new Set(sessions.map(s => s.id))
  console.log(`\nSession IDs Set size: ${sessionIds.size}`)
  console.log(`First 5 session IDs:`)
  Array.from(sessionIds).slice(0, 5).forEach(id => console.log(`  ${id}`))

  // Filter metrics - THIS IS THE LOGIC FROM THE CLIENT FUNCTION
  const versionMetrics = allMetrics.filter(
    m => m.session_id && sessionIds.has(m.session_id)
  )

  console.log(`\nFiltered metrics for 0.0.33: ${versionMetrics.length}`)

  if (versionMetrics.length > 0) {
    console.log(`\nFirst metric:`)
    console.log(versionMetrics[0])

    // Group by type
    const metricsByType = versionMetrics.reduce(
      (acc, m) => {
        if (!acc[m.metric_type]) {
          acc[m.metric_type] = 0
        }
        acc[m.metric_type]++
        return acc
      },
      {} as Record<string, number>
    )

    console.log(`\nMetrics by type:`)
    Object.entries(metricsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  } else {
    console.log(`\n❌ No metrics found after filtering!`)
    console.log(`\nLet's check a sample metric to see its session_id:`)
    const sampleMetric = allMetrics[0]
    console.log(`Sample metric session_id: ${sampleMetric.session_id}`)
    console.log(`Is it in the session IDs set? ${sessionIds.has(sampleMetric.session_id!)}`)

    // Check what sessions these metrics belong to
    const metricSessionIds = new Set(
      allMetrics.filter(m => m.session_id).map(m => m.session_id!)
    )
    console.log(`\nUnique session IDs in metrics: ${metricSessionIds.size}`)

    // Find sessions for these metrics
    const { data: metricSessions } = await supabase
      .from("performance_sessions")
      .select("*")
      .in("id", Array.from(metricSessionIds))

    console.log(`\nSessions found for metric session IDs: ${metricSessions?.length || 0}`)

    if (metricSessions && metricSessions.length > 0) {
      const versionCounts: Record<string, number> = {}
      metricSessions.forEach(s => {
        versionCounts[s.app_version] = (versionCounts[s.app_version] || 0) + 1
      })

      console.log(`\nVersion distribution of sessions with metrics:`)
      Object.entries(versionCounts).forEach(([version, count]) => {
        console.log(`  ${version}: ${count} sessions`)
      })
    }
  }

  console.log("\n" + "=".repeat(60))
}

debugFilter()
