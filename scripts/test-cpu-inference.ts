/**
 * Test script to validate CPU inference accuracy
 */

import { inferCPUUsage, validateInference, getCPUPerformanceGrade, PerformanceMetricsForInference } from '../lib/utils/cpu-inference'

// Test scenarios with expected CPU ranges
const testScenarios: Array<{
  name: string
  metrics: PerformanceMetricsForInference
  expectedRange: [number, number] // min, max expected CPU
  reasoning: string
}> = [
  {
    name: "High Performance iPhone",
    metrics: {
      fps: 60,
      memory_usage: 120,
      load_time: 400,
      device_type: "iPhone 15 Pro"
    },
    expectedRange: [5, 15],
    reasoning: "Great FPS, low memory, fast load time should result in low CPU"
  },
  {
    name: "Struggling Android Device",
    metrics: {
      fps: 15,
      memory_usage: 800,
      load_time: 3500,
      device_type: "Android"
    },
    expectedRange: [60, 85],
    reasoning: "Poor FPS, high memory, slow load time indicates high CPU usage"
  },
  {
    name: "Development Simulator",
    metrics: {
      fps: 45,
      memory_usage: 300,
      load_time: 1200,
      device_type: "Simulator iOS"
    },
    expectedRange: [20, 40],
    reasoning: "Simulator overhead with moderate performance metrics"
  },
  {
    name: "Memory Constrained Device",
    metrics: {
      fps: 30,
      memory_usage: 600,
      load_time: 1800,
      device_type: "iPhone"
    },
    expectedRange: [35, 55],
    reasoning: "Low-end performance with memory pressure"
  },
  {
    name: "Excellent iPad Performance",
    metrics: {
      fps: 58,
      memory_usage: 80,
      load_time: 350,
      device_type: "iPad Pro"
    },
    expectedRange: [5, 12],
    reasoning: "iPad efficiency with excellent metrics"
  }
]

console.log("🔍 CPU Inference Testing")
console.log("=".repeat(50))

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`)
  console.log("-".repeat(30))

  const inferredCPU = inferCPUUsage(scenario.metrics)
  const grade = getCPUPerformanceGrade(inferredCPU)
  const validation = validateInference(scenario.metrics, inferredCPU)

  console.log(`Input:`)
  console.log(`  FPS: ${scenario.metrics.fps}`)
  console.log(`  Memory: ${scenario.metrics.memory_usage} MB`)
  console.log(`  Load Time: ${scenario.metrics.load_time} ms`)
  console.log(`  Device: ${scenario.metrics.device_type}`)

  console.log(`\nOutput:`)
  console.log(`  Inferred CPU: ${inferredCPU.toFixed(1)}%`)
  console.log(`  Grade: ${grade.grade} (${grade.color})`)
  console.log(`  Description: ${grade.description}`)

  console.log(`\nValidation:`)
  console.log(`  Expected Range: ${scenario.expectedRange[0]}-${scenario.expectedRange[1]}%`)
  console.log(`  Within Range: ${inferredCPU >= scenario.expectedRange[0] && inferredCPU <= scenario.expectedRange[1] ? '✅' : '❌'}`)
  console.log(`  Confidence: ${(validation.confidence * 100).toFixed(1)}%`)
  console.log(`  Realistic: ${validation.isRealistic ? '✅' : '❌'}`)

  if (validation.warnings.length > 0) {
    console.log(`  Warnings:`)
    validation.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`))
  }

  console.log(`  Reasoning: ${scenario.reasoning}`)
})

console.log("\n" + "=".repeat(50))
console.log("🎯 Summary")

// Calculate accuracy
let passedTests = 0
testScenarios.forEach(scenario => {
  const inferredCPU = inferCPUUsage(scenario.metrics)
  if (inferredCPU >= scenario.expectedRange[0] && inferredCPU <= scenario.expectedRange[1]) {
    passedTests++
  }
})

const accuracy = (passedTests / testScenarios.length) * 100
console.log(`Tests Passed: ${passedTests}/${testScenarios.length} (${accuracy.toFixed(1)}%)`)

if (accuracy >= 80) {
  console.log("✅ CPU inference appears to be working accurately!")
} else if (accuracy >= 60) {
  console.log("⚠️  CPU inference needs some tuning")
} else {
  console.log("❌ CPU inference requires significant adjustment")
}

console.log("\n💡 Recommendations:")
console.log("1. Monitor real-world CPU vs inferred values for calibration")
console.log("2. Adjust thresholds based on device-specific performance patterns")
console.log("3. Consider adding more sophisticated device profiling")
console.log("4. Track validation confidence over time")