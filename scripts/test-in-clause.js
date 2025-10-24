// Test .in() clause limits
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInClause() {
  console.log("🔍 Testing .in() Clause Limits...\n")

  try {
    // Get sessions
    const { data: sessions } = await supabase
      .from("performance_sessions")
      .select("id, app_version")
      .order("created_at", { ascending: false })

    console.log(`Total sessions: ${sessions?.length || 0}`)

    // Test 1: Small .in() with just 0.0.35 sessions
    const sessions035 = sessions.filter(s => s.app_version === "0.0.35")
    const sessionIds035 = sessions035.map(s => s.id)

    console.log(`\nTest 1: .in() with ${sessionIds035.length} session IDs (0.0.35 only)`)
    const { data: metrics1, error: error1 } = await supabase
      .from("performance_metrics")
      .select("id, session_id, metric_type")
      .in("session_id", sessionIds035)

    console.log(`  Returned: ${metrics1?.length || 0} metrics`)
    if (error1) console.error(`  Error: ${error1.message}`)

    // Test 2: Large .in() with all sessions
    const allSessionIds = sessions.map(s => s.id)
    console.log(`\nTest 2: .in() with ${allSessionIds.length} session IDs (all)`)
    const { data: metrics2, error: error2 } = await supabase
      .from("performance_metrics")
      .select("id, session_id, metric_type")
      .in("session_id", allSessionIds)

    console.log(`  Returned: ${metrics2?.length || 0} metrics`)
    if (error2) console.error(`  Error: ${error2.message}`)

    // Test 3: Recent 100 sessions
    const recent100Ids = sessions.slice(0, 100).map(s => s.id)
    console.log(`\nTest 3: .in() with ${recent100Ids.length} session IDs (recent 100)`)
    const { data: metrics3, error: error3 } = await supabase
      .from("performance_metrics")
      .select("id, session_id, metric_type")
      .in("session_id", recent100Ids)

    console.log(`  Returned: ${metrics3?.length || 0} metrics`)
    if (error3) console.error(`  Error: ${error3.message}`)

    // Test 4: Direct query for one specific session
    if (sessions035.length > 0) {
      console.log(`\nTest 4: Direct .eq() for one session ID`)
      const { data: metrics4, error: error4 } = await supabase
        .from("performance_metrics")
        .select("id, session_id, metric_type")
        .eq("session_id", sessionIds035[0])

      console.log(`  Returned: ${metrics4?.length || 0} metrics`)
      if (error4) console.error(`  Error: ${error4.message}`)

      if (metrics4 && metrics4.length > 0) {
        console.log(`  Sample: ${metrics4[0].metric_type}`)
      }
    }

  } catch (error) {
    console.error("Script error:", error)
  }
}

testInClause()
