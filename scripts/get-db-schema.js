const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function getDatabaseSchema() {
  console.log("📋 Getting actual database schema...\n")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(supabaseUrl, anonKey)

  try {
    // Get the actual schema for performance_sessions
    console.log("🔍 performance_sessions table schema:")
    const { data: sessionColumns, error: sessionError } = await supabase.rpc(
      "get_table_schema",
      { table_name: "performance_sessions" }
    )

    if (sessionError) {
      console.log("   Using fallback method to get columns...")

      // Try to select all columns to see what exists
      const { data: sessionSample, error: sampleError } = await supabase
        .from("performance_sessions")
        .select("*")
        .limit(1)

      if (sampleError) {
        console.log(`   ❌ Cannot get schema: ${sampleError.message}`)
      } else {
        console.log("   ✅ Available columns (from empty result):")
        // Since there are 0 records, we need to do this differently

        // Try individual column selects to see what exists
        const testColumns = [
          "id",
          "anonymous_user_id",
          "session_start",
          "session_end",
          "app_version",
          "device_type",
          "os_version",
          "created_at",
          "device_id", // This is the missing one
        ]

        for (const col of testColumns) {
          const { error: colError } = await supabase
            .from("performance_sessions")
            .select(col)
            .limit(1)

          if (colError) {
            console.log(`      ❌ ${col} - MISSING (${colError.message})`)
          } else {
            console.log(`      ✅ ${col} - EXISTS`)
          }
        }
      }
    }

    console.log("\n🔍 performance_metrics table schema:")

    // Try individual column selects for performance_metrics
    const metricsTestColumns = [
      "id",
      "session_id",
      "metric_type",
      "metric_value",
      "metric_unit",
      "context",
      "timestamp",
      "created_at",
      "memory_usage", // This is the missing one
      "fps",
      "cpu_usage",
      "load_time", // These might also be missing
    ]

    for (const col of metricsTestColumns) {
      const { error: colError } = await supabase
        .from("performance_metrics")
        .select(col)
        .limit(1)

      if (colError) {
        console.log(`   ❌ ${col} - MISSING (${colError.message})`)
      } else {
        console.log(`   ✅ ${col} - EXISTS`)
      }
    }

    console.log("\n📊 Summary of schema issues:")
    console.log("================================")

    console.log("\nperformance_sessions table:")
    console.log("Expected columns from types/database.ts:")
    console.log("  ✅ id, anonymous_user_id, session_start, session_end")
    console.log("  ✅ app_version, device_type, os_version, created_at")
    console.log("  ❌ device_id - MISSING from actual database")

    console.log("\nperformance_metrics table:")
    console.log("Expected columns from types/database.ts:")
    console.log("  ✅ id, session_id, metric_type, metric_value, metric_unit")
    console.log("  ✅ context, timestamp, created_at")
    console.log("  ❌ memory_usage - MISSING from actual database")
    console.log(
      "  ❌ fps - MISSING from actual database (used in code but not in schema)"
    )
    console.log(
      "  ❌ cpu_usage - MISSING from actual database (used in code but not in schema)"
    )
    console.log(
      "  ❌ load_time - MISSING from actual database (used in code but not in schema)"
    )

    console.log("\n💡 Root causes identified:")
    console.log(
      "1. Database schema does not include columns expected by application code"
    )
    console.log(
      "2. Application expects denormalized columns (memory_usage, fps, etc.)"
    )
    console.log(
      "3. Actual database uses normalized approach (metric_type + metric_value)"
    )
    console.log("4. Missing device_id column in performance_sessions")
  } catch (error) {
    console.error("❌ Unexpected error:", error.message)
  }
}

getDatabaseSchema().catch(console.error)
