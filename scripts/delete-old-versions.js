// Script to delete old versions (0.0.32 and 0.0.33) from the database
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

async function deleteOldVersions() {
  const versionsToDelete = ["0.0.32", "0.0.33"]

  console.log("🗑️  Deleting old versions from database...\n")

  for (const version of versionsToDelete) {
    console.log(`\n📦 Processing version: ${version}`)
    console.log("=" .repeat(60))

    try {
      // Step 1: Get sessions for this version
      const { data: sessions, error: sessionsError } = await supabase
        .from("performance_sessions")
        .select("id")
        .eq("app_version", version)

      if (sessionsError) {
        console.error(`  ❌ Error fetching sessions: ${sessionsError.message}`)
        continue
      }

      const sessionCount = sessions?.length || 0
      console.log(`  Found ${sessionCount} sessions`)

      if (sessionCount === 0) {
        console.log(`  ✅ No sessions to delete for ${version}`)
        continue
      }

      const sessionIds = sessions.map(s => s.id)

      // Step 2: Count metrics for these sessions
      const { count: metricsCount, error: countError } = await supabase
        .from("performance_metrics")
        .select("*", { count: "exact", head: true })
        .in("session_id", sessionIds)

      if (countError) {
        console.error(`  ❌ Error counting metrics: ${countError.message}`)
        continue
      }

      console.log(`  Found ${metricsCount || 0} metrics`)

      // Step 3: Delete metrics first (foreign key constraint)
      console.log(`\n  🗑️  Deleting metrics...`)
      const { error: deleteMetricsError } = await supabase
        .from("performance_metrics")
        .delete()
        .in("session_id", sessionIds)

      if (deleteMetricsError) {
        console.error(`  ❌ Error deleting metrics: ${deleteMetricsError.message}`)
        continue
      }

      console.log(`  ✅ Deleted ${metricsCount || 0} metrics`)

      // Step 4: Delete sessions
      console.log(`  🗑️  Deleting sessions...`)
      const { error: deleteSessionsError } = await supabase
        .from("performance_sessions")
        .delete()
        .eq("app_version", version)

      if (deleteSessionsError) {
        console.error(`  ❌ Error deleting sessions: ${deleteSessionsError.message}`)
        continue
      }

      console.log(`  ✅ Deleted ${sessionCount} sessions`)
      console.log(`\n✅ Successfully deleted version ${version}`)

    } catch (error) {
      console.error(`  ❌ Error processing ${version}:`, error)
    }
  }

  // Summary
  console.log("\n" + "=" .repeat(60))
  console.log("📊 FINAL DATABASE STATE")
  console.log("=" .repeat(60))

  const { data: remainingSessions } = await supabase
    .from("performance_sessions")
    .select("app_version")

  const versionCounts = new Map()
  remainingSessions?.forEach(s => {
    versionCounts.set(s.app_version, (versionCounts.get(s.app_version) || 0) + 1)
  })

  console.log("\nRemaining versions:")
  Array.from(versionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([version, count]) => {
      console.log(`  ${version}: ${count} sessions`)
    })

  console.log("\n✅ Cleanup complete!")
}

deleteOldVersions()
