/**
 * Check for orphaned metrics (metrics with session_id that don't exist)
 */

import { createServiceClient } from "../lib/supabase/server"

async function checkOrphanedMetrics() {
  const supabase = createServiceClient()

  console.log("🔍 Checking for orphaned metrics...")
  console.log("=".repeat(60))

  // Get all metrics
  const { data: allMetrics, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("session_id")

  if (metricsError) {
    console.error("Error fetching metrics:", metricsError)
    return
  }

  console.log(`\nTotal metrics in database: ${allMetrics?.length || 0}`)

  // Get unique session IDs from metrics
  const sessionIdsInMetrics = new Set(
    allMetrics?.filter(m => m.session_id).map(m => m.session_id!) || []
  )

  console.log(`Unique session IDs in metrics: ${sessionIdsInMetrics.size}`)

  // Get all session IDs that actually exist
  const { data: allSessions, error: sessionsError } = await supabase
    .from("performance_sessions")
    .select("id, app_version")

  if (sessionsError) {
    console.error("Error fetching sessions:", sessionsError)
    return
  }

  console.log(`Total sessions in database: ${allSessions?.length || 0}`)

  const validSessionIds = new Set(allSessions?.map(s => s.id) || [])

  // Find orphaned metrics
  const orphanedSessionIds = Array.from(sessionIdsInMetrics).filter(
    id => !validSessionIds.has(id)
  )

  console.log(`\n⚠️  Orphaned session IDs (no matching session): ${orphanedSessionIds.length}`)

  if (orphanedSessionIds.length > 0) {
    // Count how many metrics are orphaned
    const orphanedMetrics = allMetrics?.filter(m =>
      orphanedSessionIds.includes(m.session_id!)
    )

    console.log(`❌ Total orphaned metrics: ${orphanedMetrics?.length || 0}`)
    console.log(`\nThese metrics reference sessions that were deleted.`)
    console.log(`This is why version 0.0.33 shows 0 metrics!`)
  }

  // Check which versions have valid metrics
  console.log("\n" + "=".repeat(60))
  console.log("📊 Metrics by version:")
  console.log("=".repeat(60))

  const versionMetricCounts: Record<string, number> = {}

  allSessions?.forEach(session => {
    const sessionMetrics = allMetrics?.filter(
      m => m.session_id === session.id
    ).length || 0

    if (!versionMetricCounts[session.app_version]) {
      versionMetricCounts[session.app_version] = 0
    }
    versionMetricCounts[session.app_version] += sessionMetrics
  })

  Object.entries(versionMetricCounts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([version, count]) => {
      console.log(`${version}: ${count} metrics`)
    })

  console.log("\n" + "=".repeat(60))
}

checkOrphanedMetrics()
