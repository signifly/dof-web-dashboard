const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function testDatabaseSchema() {
  console.log("🔍 Testing database connection and schema...\n")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("Environment check:")
  console.log("- SUPABASE_URL:", supabaseUrl ? "Set" : "Missing")
  console.log(
    "- SERVICE_ROLE_KEY:",
    serviceKey
      ? serviceKey.includes("placeholder")
        ? "Placeholder"
        : "Set"
      : "Missing"
  )
  console.log("")

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing required environment variables")
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // Test basic connection
    console.log("🔗 Testing connection...")
    const { data: connectionTest, error: connectionError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(1)

    if (connectionError) {
      console.error("❌ Connection failed:", connectionError.message)
      return
    }

    console.log("✅ Connection successful\n")

    // Get all tables in public schema
    console.log("📋 Checking available tables...")
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE")

    if (tablesError) {
      console.error("❌ Failed to fetch tables:", tablesError.message)
      return
    }

    console.log(
      "Available tables:",
      tables?.map(t => t.table_name).join(", ") || "None"
    )
    console.log("")

    // Check if our expected tables exist
    const expectedTables = ["performance_metrics", "performance_sessions"]
    const existingTables = tables?.map(t => t.table_name) || []

    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`)

        // Get column information for this table
        const { data: columns, error: columnsError } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable")
          .eq("table_schema", "public")
          .eq("table_name", table)
          .order("ordinal_position")

        if (columnsError) {
          console.error(
            `❌ Failed to get columns for ${table}:`,
            columnsError.message
          )
        } else {
          console.log(`  Columns in ${table}:`)
          columns?.forEach(col => {
            console.log(
              `    - ${col.column_name} (${col.data_type}${col.is_nullable === "YES" ? ", nullable" : ""})`
            )
          })
        }

        // Test basic read access
        const { data: testData, error: testError } = await supabase
          .from(table)
          .select("*")
          .limit(1)

        if (testError) {
          console.error(`❌ Failed to read from ${table}:`, testError.message)
        } else {
          console.log(`  ✅ Can read from ${table}`)
        }

        // Get count of records
        const { count, error: countError } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })

        if (countError) {
          console.error(`❌ Failed to count ${table}:`, countError.message)
        } else {
          console.log(`  📊 Records: ${count || 0}`)
        }

        console.log("")
      } else {
        console.log(`❌ Table '${table}' missing`)
      }
    }

    // Test specific columns that are causing issues
    console.log("🔍 Testing problematic columns...")

    // Test memory_usage column
    try {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("memory_usage")
        .limit(1)

      if (error) {
        console.log(
          `❌ Column 'memory_usage' does not exist in performance_metrics: ${error.message}`
        )
      } else {
        console.log(`✅ Column 'memory_usage' exists in performance_metrics`)
      }
    } catch (e) {
      console.log(`❌ Error testing memory_usage: ${e.message}`)
    }

    // Test device_id column
    try {
      const { data, error } = await supabase
        .from("performance_sessions")
        .select("device_id")
        .limit(1)

      if (error) {
        console.log(
          `❌ Column 'device_id' does not exist in performance_sessions: ${error.message}`
        )
      } else {
        console.log(`✅ Column 'device_id' exists in performance_sessions`)
      }
    } catch (e) {
      console.log(`❌ Error testing device_id: ${e.message}`)
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message)
  }
}

testDatabaseSchema().catch(console.error)
