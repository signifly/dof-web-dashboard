// Test Supabase limits
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLimits() {
  console.log("🔍 Testing Supabase Query Limits...\n")

  try {
    // Test 1: No limit
    console.log("Test 1: No explicit limit")
    const { data: data1, error: error1 } = await supabase
      .from("performance_metrics")
      .select("id")
    console.log(`  Returned: ${data1?.length || 0} rows`)

    // Test 2: Limit 10000
    console.log("\nTest 2: .limit(10000)")
    const { data: data2, error: error2 } = await supabase
      .from("performance_metrics")
      .select("id")
      .limit(10000)
    console.log(`  Returned: ${data2?.length || 0} rows`)

    // Test 3: Limit 5000
    console.log("\nTest 3: .limit(5000)")
    const { data: data3, error: error3 } = await supabase
      .from("performance_metrics")
      .select("id")
      .limit(5000)
    console.log(`  Returned: ${data3?.length || 0} rows`)

    // Test 4: Order by timestamp descending with limit
    console.log("\nTest 4: Order by timestamp DESC, limit 2000")
    const { data: data4, error: error4 } = await supabase
      .from("performance_metrics")
      .select("id, timestamp, session_id")
      .order("timestamp", { ascending: false })
      .limit(2000)
    console.log(`  Returned: ${data4?.length || 0} rows`)

    if (data4 && data4.length > 0) {
      console.log(`  Newest: ${data4[0].timestamp}`)
      console.log(`  Oldest: ${data4[data4.length - 1].timestamp}`)
    }

    // Test 5: Check total count
    console.log("\nTest 5: Get total count")
    const { count, error: countError } = await supabase
      .from("performance_metrics")
      .select("*", { count: "exact", head: true })
    console.log(`  Total metrics in DB: ${count}`)

    // Get 0.0.35 session IDs
    const { data: sessions035 } = await supabase
      .from("performance_sessions")
      .select("id")
      .eq("app_version", "0.0.35")

    const sessionIds035 = sessions035?.map(s => s.id) || []
    console.log(`\n📊 Version 0.0.35 has ${sessionIds035.length} sessions`)

    // Test 6: Filter by session_id IN
    console.log("\nTest 6: Filter by session_id IN (for 0.0.35)")
    const { data: data6, error: error6 } = await supabase
      .from("performance_metrics")
      .select("id, metric_type, session_id")
      .in("session_id", sessionIds035)
    console.log(`  Returned: ${data6?.length || 0} metrics for 0.0.35`)

  } catch (error) {
    console.error("Script error:", error)
  }
}

testLimits()
