/**
 * Test if anonymous client can read performance data
 */

import { createClient } from "@supabase/supabase-js"

async function testAnonAccess() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, anonKey)

  console.log("🔍 Testing anonymous client access...")
  console.log("=".repeat(60))

  // Try to fetch sessions
  console.log("\n📊 Fetching sessions...")
  const { data: sessions, error: sessionsError } = await supabase
    .from("performance_sessions")
    .select("*")
    .eq("app_version", "0.0.33")
    .limit(5)

  if (sessionsError) {
    console.error("❌ Error fetching sessions:", sessionsError)
  } else {
    console.log(`✅ Successfully fetched ${sessions?.length || 0} sessions`)
  }

  // Try to fetch metrics
  console.log("\n📈 Fetching metrics...")
  const { data: metrics, error: metricsError } = await supabase
    .from("performance_metrics")
    .select("*")
    .limit(5)

  if (metricsError) {
    console.error("❌ Error fetching metrics:", metricsError)
  } else {
    console.log(`✅ Successfully fetched ${metrics?.length || 0} metrics`)
    if (metrics && metrics.length > 0) {
      console.log("\nSample metric:")
      console.log(metrics[0])
    }
  }

  console.log("\n" + "=".repeat(60))
}

testAnonAccess()
