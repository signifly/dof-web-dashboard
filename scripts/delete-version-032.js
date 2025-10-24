// Script to delete version 0.0.32 in batches
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  console.error("Need SUPABASE_SERVICE_ROLE_KEY for delete operations")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteVersion032InBatches() {
  const version = "0.0.32"
  const batchSize = 50 // Process 50 sessions at a time

  console.log(`🗑️  Deleting version ${version} in batches...\n`)

  try {
    // Get all sessions for this version
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("id")
      .eq("app_version", version)

    if (sessionsError) {
      console.error(`❌ Error fetching sessions: ${sessionsError.message}`)
      return
    }

    const totalSessions = sessions?.length || 0
    console.log(`📦 Found ${totalSessions} sessions for version ${version}`)

    if (totalSessions === 0) {
      console.log("✅ No sessions to delete")
      return
    }

    // Process in batches
    const batches = Math.ceil(totalSessions / batchSize)
    console.log(`📊 Processing in ${batches} batches of ${batchSize} sessions each\n`)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, totalSessions)
      const batchSessions = sessions.slice(start, end)
      const batchSessionIds = batchSessions.map(s => s.id)

      console.log(`\nBatch ${i + 1}/${batches}: Processing sessions ${start + 1}-${end}`)

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

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`\n✅ Successfully deleted version ${version}`)

    // Show final state
    const { data: remainingSessions } = await supabase
      .from("performance_sessions")
      .select("app_version")

    const versionCounts = new Map()
    remainingSessions?.forEach(s => {
      versionCounts.set(s.app_version, (versionCounts.get(s.app_version) || 0) + 1)
    })

    console.log("\n📊 Remaining versions:")
    Array.from(versionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([version, count]) => {
        console.log(`  ${version}: ${count} sessions`)
      })

  } catch (error) {
    console.error("Error:", error)
  }
}

deleteVersion032InBatches()
