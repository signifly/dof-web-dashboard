// Script to check data for a specific version
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVersionData(version) {
  console.log(`🔍 Checking data for version: ${version}\n`)

  try {
    // Get sessions for this version
    const { data: sessions, error: sessionsError } = await supabase
      .from("performance_sessions")
      .select("*")
      .eq("app_version", version)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      return
    }

    console.log(`📦 Sessions found: ${sessions?.length || 0}`)

    if (!sessions || sessions.length === 0) {
      console.log("❌ No sessions found for this version")
      return
    }

    console.log("\n📊 Session Details:")
    sessions.slice(0, 5).forEach((session, i) => {
      console.log(`\n  Session ${i + 1}:`)
      console.log(`    ID: ${session.id}`)
      console.log(`    Device: ${session.device_type}`)
      console.log(`    Created: ${session.created_at}`)
    })

    // Get metrics for these sessions
    const sessionIds = sessions.map(s => s.id)
    const { data: metrics, error: metricsError } = await supabase
      .from("performance_metrics")
      .select("*")
      .in("session_id", sessionIds)

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError)
      return
    }

    console.log(`\n📈 Total metrics: ${metrics?.length || 0}`)

    if (!metrics || metrics.length === 0) {
      console.log("❌ No metrics found for these sessions")
      return
    }

    // Count metric types
    const typeCounts = new Map()
    const typeExamples = new Map()

    metrics.forEach(metric => {
      const type = metric.metric_type
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1)

      if (!typeExamples.has(type)) {
        typeExamples.set(type, [])
      }
      const examples = typeExamples.get(type)
      if (examples.length < 5) {
        examples.push(metric.metric_value)
      }
    })

    console.log("\n📊 Metric Types Distribution:")
    console.log("=" .repeat(50))

    Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const examples = typeExamples.get(type) || []
        console.log(`\n  ${type}:`)
        console.log(`    Count: ${count}`)
        console.log(`    Examples: [${examples.join(", ")}]`)
      })

    // Check for critical metrics
    console.log("\n🎯 Critical Metrics Check:")
    console.log("=" .repeat(50))

    const criticalMetrics = ["fps", "memory_usage", "cpu_usage", "memory", "cpu"]
    criticalMetrics.forEach(metricType => {
      const count = typeCounts.get(metricType) || 0
      const status = count > 0 ? "✅" : "❌"
      console.log(`  ${status} ${metricType}: ${count} metrics`)
    })

    // Calculate averages
    console.log("\n📊 Average Values:")
    console.log("=" .repeat(50))

    const fpsMetrics = metrics.filter(m => m.metric_type === "fps")
    const avgFps = fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) / fpsMetrics.length
      : 0

    const memoryMetrics = metrics.filter(m => m.metric_type === "memory_usage" || m.metric_type === "memory")
    const avgMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) / memoryMetrics.length
      : 0

    const cpuMetrics = metrics.filter(m => m.metric_type === "cpu_usage" || m.metric_type === "cpu")
    const avgCpu = cpuMetrics.length > 0
      ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) / cpuMetrics.length
      : 0

    console.log(`  Average FPS: ${avgFps.toFixed(2)}`)
    console.log(`  Average Memory: ${avgMemory.toFixed(2)} MB`)
    console.log(`  Average CPU: ${avgCpu.toFixed(2)}%`)

  } catch (error) {
    console.error("Script error:", error)
  }
}

const version = process.argv[2] || "0.0.35"
checkVersionData(version)
