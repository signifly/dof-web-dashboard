/**
 * Script to debug build performance calculation
 */

import { getBuildPerformanceDataClient } from "../lib/client-performance-data"

async function debugBuildData() {
  console.log("🔍 Debugging build performance data calculation...")
  console.log("=" .repeat(60))

  try {
    const builds = await getBuildPerformanceDataClient()

    console.log(`\n📊 Total builds returned: ${builds.length}\n`)

    builds.forEach((build, index) => {
      console.log(`${index + 1}. Version: ${build.version}`)
      console.log(`   avgFps: ${build.avgFps} (raw)`)
      console.log(`   avgFps.toFixed(1): ${build.avgFps.toFixed(1)}`)
      console.log(`   avgMemory: ${build.avgMemory}`)
      console.log(`   avgCpu: ${build.avgCpu}`)
      console.log(`   regressionScore: ${build.regressionScore}`)
      console.log(`   status: ${build.status}`)
      console.log(`   totalSessions: ${build.totalSessions}`)
      console.log(`   timestamp: ${build.timestamp}`)
      console.log("")
    })
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

// Run the script
debugBuildData()
