const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testDatabaseWithAnon() {
  console.log('🔍 Testing database connection with anonymous key...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('Environment check:')
  console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('- ANON_KEY:', anonKey ? 'Set' : 'Missing')
  console.log('')

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing required environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, anonKey)

  try {
    // Test basic connection by trying to read from expected tables
    console.log('🔗 Testing connection with anonymous key...')

    // Test performance_sessions table
    console.log('📋 Testing performance_sessions table...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('performance_sessions')
      .select('*')
      .limit(5)

    if (sessionsError) {
      console.log(`❌ Error accessing performance_sessions: ${sessionsError.message}`)

      // Check if it's a missing table or schema issue
      if (sessionsError.message.includes('does not exist')) {
        console.log('   → This suggests the table does not exist in the database')
      } else if (sessionsError.message.includes('permission')) {
        console.log('   → This suggests a permissions issue with anonymous access')
      }
    } else {
      console.log(`✅ performance_sessions accessible, found ${sessions?.length || 0} records`)
      if (sessions && sessions.length > 0) {
        console.log('   Sample record columns:', Object.keys(sessions[0]).join(', '))
      }
    }

    // Test performance_metrics table
    console.log('\n📊 Testing performance_metrics table...')
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .limit(5)

    if (metricsError) {
      console.log(`❌ Error accessing performance_metrics: ${metricsError.message}`)

      if (metricsError.message.includes('does not exist')) {
        console.log('   → This suggests the table does not exist in the database')
      } else if (metricsError.message.includes('permission')) {
        console.log('   → This suggests a permissions issue with anonymous access')
      }
    } else {
      console.log(`✅ performance_metrics accessible, found ${metrics?.length || 0} records`)
      if (metrics && metrics.length > 0) {
        console.log('   Sample record columns:', Object.keys(metrics[0]).join(', '))
      }
    }

    // Try to get table information using a different approach
    console.log('\n🔍 Testing alternative schema detection...')

    // Try to select with specific columns to see what fails
    const { data: testColumns, error: columnError } = await supabase
      .from('performance_metrics')
      .select('id, metric_type, metric_value, created_at')
      .limit(1)

    if (columnError) {
      console.log(`❌ Error with basic columns: ${columnError.message}`)
    } else {
      console.log('✅ Basic columns accessible')
    }

    // Test the problematic memory_usage column
    const { data: memoryTest, error: memoryError } = await supabase
      .from('performance_metrics')
      .select('memory_usage')
      .limit(1)

    if (memoryError) {
      console.log(`❌ memory_usage column issue: ${memoryError.message}`)
    } else {
      console.log('✅ memory_usage column accessible')
    }

    // Test the problematic device_id column
    const { data: deviceTest, error: deviceError } = await supabase
      .from('performance_sessions')
      .select('device_id')
      .limit(1)

    if (deviceError) {
      console.log(`❌ device_id column issue: ${deviceError.message}`)
    } else {
      console.log('✅ device_id column accessible')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testDatabaseWithAnon().catch(console.error)