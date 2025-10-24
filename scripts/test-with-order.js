// Test query with ordering
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithOrder() {
  console.log("🔍 Testing Query WITH .order() clause...\n")

  try {
    const { data: sessions } = await supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    console.log(`Sessions: ${sessions?.length || 0}`)

    const sessionIds = sessions?.map(s => s.id) || []

    // Test WITH .order()
    console.log(`\nTest 1: WITH .order("timestamp", { ascending: false }) and .limit(5000)`)
    const { data: metrics1, error: error1 } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)
      .order("timestamp", { ascending: false })
      .limit(5000)

    console.log(`  Fetched: ${metrics1?.length || 0} metrics`)
    if (error1) console.error(`  Error: ${error1.message}`)

    // Analyze 0.0.35
    const sessions035 = sessions?.filter(s => s.app_version === "0.0.35") || []
    const sessionIds035 = new Set(sessions035.map(s => s.id))
    const metrics035 = metrics1?.filter(m => sessionIds035.has(m.session_id)) || []

    console.log(`\n  0.0.35 Analysis:`)
    console.log(`    Sessions: ${sessions035.length}`)
    console.log(`    Metrics: ${metrics035.length}`)

    const fps035 = metrics035.filter(m => m.metric_type === 'fps')
    const mem035 = metrics035.filter(m => m.metric_type === 'memory_usage')

    console.log(`    FPS metrics: ${fps035.length}`)
    console.log(`    Memory metrics: ${mem035.length}`)

    if (fps035.length > 0) {
      const avgFps = fps035.reduce((sum, m) => sum + m.metric_value, 0) / fps035.length
      console.log(`    Average FPS: ${avgFps.toFixed(2)}`)
    }

    if (mem035.length > 0) {
      const avgMem = mem035.reduce((sum, m) => sum + m.metric_value, 0) / mem035.length
      console.log(`    Average Memory: ${avgMem.toFixed(2)} MB`)
    }

    // Check limit
    if (metrics1?.length === 1000) {
      console.log(`\n  ❌ STILL hitting 1000-row limit`)
    } else {
      console.log(`\n  ✅ NOT hitting 1000-row limit!`)
    }

  } catch (error) {
    console.error("Error:", error)
  }
}

testWithOrder()
