/**
 * Script to delete all performance data from app versions 0.0.31 and below
 * This will keep only versions 0.0.32 and 0.0.33
 */

import { createServiceClient } from "../lib/supabase/server"

async function deleteOldVersions() {
  const supabase = createServiceClient()

  console.log("🔍 Starting database cleanup...")
  console.log("=" .repeat(60))

  try {
    // Step 1: Verification queries
    console.log("\n📊 STEP 1: Verifying what will be deleted...")
    console.log("-".repeat(60))

    // Count sessions to be deleted
    const { data: sessionsToDelete, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("app_version", { count: "exact" })
      .lte("app_version", "0.0.31")

    if (sessionsError) throw sessionsError

    console.log(
      `\n✓ Sessions to delete (version <= 0.0.31): ${sessionsToDelete?.length || 0}`
    )

    // Get breakdown by version
    const { data: versionBreakdown } = await supabase.rpc("get_sessions_count", {
      max_version: "0.0.31",
    })

    // Count metrics to be deleted
    const { data: sessionIds } = await supabase
      .from("performance_sessions")
      .select("id")
      .lte("app_version", "0.0.31")

    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((s) => s.id)
      const { count: metricsCount } = await supabase
        .from("performance_metrics")
        .select("*", { count: "exact", head: true })
        .in("session_id", ids)

      console.log(`✓ Metrics to delete: ${metricsCount || 0}`)
    } else {
      console.log(`✓ Metrics to delete: 0`)
    }

    // Show versions that will remain
    const { data: remainingSessions } = await supabase
      .from("performance_sessions")
      .select("app_version")
      .gt("app_version", "0.0.31")

    const remainingVersions = [
      ...new Set(remainingSessions?.map((s) => s.app_version) || []),
    ].sort()

    console.log(
      `✓ Versions that will remain: ${remainingVersions.join(", ") || "none"}`
    )
    console.log(
      `✓ Remaining sessions: ${remainingSessions?.length || 0}`
    )

    // Prompt for confirmation
    console.log("\n" + "=".repeat(60))
    console.log("⚠️  WARNING: This will permanently delete the above records!")
    console.log("=".repeat(60))

    // Step 2: Perform deletion in transaction
    console.log("\n🗑️  STEP 2: Deleting records...")
    console.log("-".repeat(60))

    // First, delete metrics (child records)
    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((s) => s.id)

      console.log("\nDeleting performance_metrics...")
      const { error: metricsDeleteError } = await supabase
        .from("performance_metrics")
        .delete()
        .in("session_id", ids)

      if (metricsDeleteError) {
        throw new Error(`Failed to delete metrics: ${metricsDeleteError.message}`)
      }
      console.log("✓ Metrics deleted successfully")
    }

    // Then, delete sessions (parent records)
    console.log("\nDeleting performance_sessions...")
    const { error: sessionsDeleteError } = await supabase
      .from("performance_sessions")
      .delete()
      .lte("app_version", "0.0.31")

    if (sessionsDeleteError) {
      throw new Error(
        `Failed to delete sessions: ${sessionsDeleteError.message}`
      )
    }
    console.log("✓ Sessions deleted successfully")

    // Step 3: Post-deletion verification
    console.log("\n✅ STEP 3: Verifying deletion...")
    console.log("-".repeat(60))

    // Verify no old sessions remain
    const { data: oldSessions, count: oldSessionsCount } = await supabase
      .from("performance_sessions")
      .select("*", { count: "exact", head: true })
      .lte("app_version", "0.0.31")

    console.log(`\n✓ Old sessions remaining (should be 0): ${oldSessionsCount || 0}`)

    // Show remaining versions
    const { data: finalSessions } = await supabase
      .from("performance_sessions")
      .select("app_version")

    const finalVersions = [
      ...new Set(finalSessions?.map((s) => s.app_version) || []),
    ].sort()

    console.log(`✓ Versions in database: ${finalVersions.join(", ") || "none"}`)

    // Count remaining records
    const { count: finalSessionsCount } = await supabase
      .from("performance_sessions")
      .select("*", { count: "exact", head: true })

    const { count: finalMetricsCount } = await supabase
      .from("performance_metrics")
      .select("*", { count: "exact", head: true })

    console.log(`✓ Total remaining sessions: ${finalSessionsCount || 0}`)
    console.log(`✓ Total remaining metrics: ${finalMetricsCount || 0}`)

    console.log("\n" + "=".repeat(60))
    console.log("🎉 Database cleanup completed successfully!")
    console.log("=".repeat(60))
  } catch (error) {
    console.error("\n❌ Error during database cleanup:")
    console.error(error)
    process.exit(1)
  }
}

// Run the script
deleteOldVersions()
