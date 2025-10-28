// Script to delete specific versions from the database
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  console.error("Need SUPABASE_SERVICE_ROLE_KEY for delete operations")
  process.exit(1)
}

// Use service role key for delete operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteVersionInBatches(version, batchSize = 50) {
  console.log(`\n${"=".repeat(70)}`)
  console.log(`🗑️  Deleting version ${version}`)
  console.log("=".repeat(70))

  try {
    // Get all sessions for this version
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("id")
      .eq("app_version", version)

    if (sessionsError) {
      console.error(`❌ Error fetching sessions: ${sessionsError.message}`)
      return { success: false, deleted: 0 }
    }

    const totalSessions = sessions?.length || 0
    console.log(`📦 Found ${totalSessions} sessions`)

    if (totalSessions === 0) {
      console.log("✅ No sessions to delete")
      return { success: true, deleted: 0 }
    }

    // Process in batches
    const batches = Math.ceil(totalSessions / batchSize)
    console.log(`📊 Processing in ${batches} batches of ${batchSize} sessions each\n`)

    let totalDeleted = 0

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, totalSessions)
      const batchSessions = sessions.slice(start, end)
      const batchSessionIds = batchSessions.map(s => s.id)

      console.log(`Batch ${i + 1}/${batches}: Processing sessions ${start + 1}-${end}`)

      // Delete metrics for this batch
      const { error: deleteMetricsError } = await supabase
        .from("performance_metrics")
        .delete()
        .in("session_id", batchSessionIds)

      if (deleteMetricsError) {
        console.error(`  ❌ Error deleting metrics: ${deleteMetricsError.message}`)
        continue
      }

      console.log(`  ✅ Deleted metrics`)

      // Delete sessions for this batch
      const { error: deleteSessionsError } = await supabase
        .from("performance_sessions")
        .delete()
        .in("id", batchSessionIds)

      if (deleteSessionsError) {
        console.error(`  ❌ Error deleting sessions: ${deleteSessionsError.message}`)
        continue
      }

      console.log(`  ✅ Deleted ${batchSessionIds.length} sessions`)
      totalDeleted += batchSessionIds.length

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`\n✅ Successfully deleted version ${version} (${totalDeleted} sessions)`)
    return { success: true, deleted: totalDeleted }

  } catch (error) {
    console.error(`❌ Error processing ${version}:`, error)
    return { success: false, deleted: 0 }
  }
}

async function deleteMultipleVersions() {
  const versionsToDelete = ["0.0.33", "0.0.34", "0.0.35"]

  console.log("🗑️  Deleting Multiple Versions from Database")
  console.log("=".repeat(70))
  console.log(`Versions to delete: ${versionsToDelete.join(", ")}`)
  console.log("=".repeat(70))

  const results = {}

  for (const version of versionsToDelete) {
    const result = await deleteVersionInBatches(version)
    results[version] = result
  }

  // Show final summary
  console.log("\n" + "=".repeat(70))
  console.log("📊 DELETION SUMMARY")
  console.log("=".repeat(70))

  let totalSessionsDeleted = 0
  versionsToDelete.forEach(version => {
    const result = results[version]
    const status = result.success ? "✅" : "❌"
    console.log(`  ${status} ${version}: ${result.deleted} sessions deleted`)
    totalSessionsDeleted += result.deleted
  })

  console.log(`\n  Total sessions deleted: ${totalSessionsDeleted}`)

  // Show remaining versions
  console.log("\n" + "=".repeat(70))
  console.log("📊 REMAINING VERSIONS IN DATABASE")
  console.log("=".repeat(70))

  const { data: remainingSessions } = await supabase
    .from("performance_sessions")
    .select("app_version")

  const versionCounts = new Map()
  remainingSessions?.forEach(s => {
    versionCounts.set(s.app_version, (versionCounts.get(s.app_version) || 0) + 1)
  })

  if (versionCounts.size === 0) {
    console.log("  No sessions remaining in database")
  } else {
    console.log("\nRemaining versions:")
    Array.from(versionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([version, count]) => {
        console.log(`  ${version}: ${count} sessions`)
      })
  }

  console.log("\n" + "=".repeat(70))
  console.log("✅ Cleanup complete!")
  console.log("=".repeat(70))
}

deleteMultipleVersions()
