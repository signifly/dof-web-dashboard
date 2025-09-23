// Simple script to debug database metric types
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('🔍 Debugging database metric types...\n')

  try {
    // Get unique metric types with counts
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('metric_type, metric_value')
      .limit(1000)

    if (error) {
      console.error('Error fetching metrics:', error)
      return
    }

    console.log(`📊 Total metrics found: ${metrics.length}\n`)

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

    console.log('📈 Metric Types Found:')
    console.log('=====================================')

    Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([type, count]) => {
        const examples = typeExamples.get(type) || []
        console.log(`📌 "${type}":`)
        console.log(`   Count: ${count}`)
        console.log(`   Examples: [${examples.join(', ')}]`)
        console.log('')
      })

    // Check specifically for load time related metrics
    console.log('🕐 Load Time Analysis:')
    console.log('=====================================')

    const loadTimeTypes = ['navigation_time', 'screen_load', 'load_time', 'page_load', 'startup_time', 'boot_time']
    let foundLoadTimeMetrics = false

    loadTimeTypes.forEach(type => {
      if (typeCounts.has(type)) {
        foundLoadTimeMetrics = true
        console.log(`✅ Found: "${type}" (${typeCounts.get(type)} metrics)`)
      } else {
        console.log(`❌ Missing: "${type}"`)
      }
    })

    if (!foundLoadTimeMetrics) {
      console.log('\n🚨 NO LOAD TIME METRICS FOUND!')
      console.log('This explains why load time shows "N/A".')
      console.log('Load time metrics need to be added to your database with one of these metric types:')
      console.log('- "navigation_time"')
      console.log('- "screen_load"')
      console.log('- "load_time"')
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

debugDatabase()