/**
 * CPU inference utility that derives CPU usage from existing performance metrics
 * without adding overhead to the mobile app's performance monitoring system.
 */

export interface PerformanceMetricsForInference {
  fps: number
  memory_usage: number
  load_time: number
  device_type: string
}

export interface CPUInferenceConfig {
  target_fps: number
  memory_thresholds: {
    low: number
    medium: number
    high: number
    critical: number
  }
  load_time_thresholds: {
    fast: number
    acceptable: number
    slow: number
    critical: number
  }
  device_multipliers: {
    [key: string]: number
  }
}

const DEFAULT_CONFIG: CPUInferenceConfig = {
  target_fps: 60,
  memory_thresholds: {
    low: 100, // MB
    medium: 200, // MB
    high: 400, // MB
    critical: 600, // MB
  },
  load_time_thresholds: {
    fast: 500, // ms
    acceptable: 1000, // ms
    slow: 2000, // ms
    critical: 3000, // ms
  },
  device_multipliers: {
    iPhone: 0.8, // More efficient
    iPad: 0.9, // Slightly more efficient
    Simulator: 1.2, // Less efficient (development)
    Android: 1.1, // Slightly less efficient
    default: 1.0,
  },
}

/**
 * Infer CPU usage percentage from existing performance metrics
 */
export function inferCPUUsage(
  metrics: PerformanceMetricsForInference,
  config: CPUInferenceConfig = DEFAULT_CONFIG
): number {
  // 1. FPS Efficiency Factor (40% weight)
  const fpsEfficiency = Math.min(metrics.fps / config.target_fps, 1.0)
  const fpsLoad = Math.max(0, 1 - fpsEfficiency)

  // 2. Memory Pressure Factor (30% weight)
  let memoryPressure = 0
  if (metrics.memory_usage >= config.memory_thresholds.critical) {
    memoryPressure = 0.8
  } else if (metrics.memory_usage >= config.memory_thresholds.high) {
    memoryPressure = 0.6
  } else if (metrics.memory_usage >= config.memory_thresholds.medium) {
    memoryPressure = 0.4
  } else if (metrics.memory_usage >= config.memory_thresholds.low) {
    memoryPressure = 0.2
  }

  // 3. Load Time Performance Factor (20% weight)
  let loadTimeFactor = 0
  if (metrics.load_time >= config.load_time_thresholds.critical) {
    loadTimeFactor = 0.7
  } else if (metrics.load_time >= config.load_time_thresholds.slow) {
    loadTimeFactor = 0.5
  } else if (metrics.load_time >= config.load_time_thresholds.acceptable) {
    loadTimeFactor = 0.3
  } else if (metrics.load_time >= config.load_time_thresholds.fast) {
    loadTimeFactor = 0.1
  }

  // 4. Device Type Adjustment (10% weight)
  const deviceKey =
    Object.keys(config.device_multipliers).find(key =>
      metrics.device_type.toLowerCase().includes(key.toLowerCase())
    ) || "default"
  const deviceMultiplier = config.device_multipliers[deviceKey]

  // Calculate weighted CPU inference
  const baseCPU =
    fpsLoad * 0.4 + // FPS contribution
    memoryPressure * 0.3 + // Memory contribution
    loadTimeFactor * 0.2 + // Load time contribution
    0.1 * (deviceMultiplier - 1) // Device adjustment

  // Apply device multiplier and clamp to realistic range
  const inferredCPU = Math.max(
    0,
    Math.min(100, baseCPU * 100 * deviceMultiplier)
  )

  // Add baseline CPU usage (apps always use some CPU)
  const minCPU = getMinimumCPUForDevice(metrics.device_type)

  return Math.max(minCPU, inferredCPU)
}

/**
 * Get minimum expected CPU usage based on device type
 */
function getMinimumCPUForDevice(deviceType: string): number {
  const type = deviceType.toLowerCase()

  if (type.includes("simulator")) return 15 // Development environment
  if (type.includes("iphone") || type.includes("ipad")) return 5 // iOS devices
  if (type.includes("android")) return 8 // Android devices

  return 10 // Default minimum
}

/**
 * Get CPU performance grade based on inferred usage
 */
export function getCPUPerformanceGrade(cpuUsage: number): {
  grade: string
  color: string
  description: string
} {
  if (cpuUsage <= 30) {
    return {
      grade: "Excellent",
      color: "green",
      description: "Very low CPU usage, optimal performance",
    }
  } else if (cpuUsage <= 50) {
    return {
      grade: "Good",
      color: "blue",
      description: "Moderate CPU usage, good performance",
    }
  } else if (cpuUsage <= 70) {
    return {
      grade: "Fair",
      color: "yellow",
      description: "Elevated CPU usage, may impact battery",
    }
  } else {
    return {
      grade: "Poor",
      color: "red",
      description: "High CPU usage, performance concerns",
    }
  }
}

/**
 * Validate inference accuracy by comparing with known patterns
 */
export function validateInference(
  metrics: PerformanceMetricsForInference,
  inferredCPU: number
): {
  isRealistic: boolean
  confidence: number
  warnings: string[]
} {
  const warnings: string[] = []
  let confidence = 1.0

  // Check for unrealistic combinations
  if (metrics.fps > 55 && inferredCPU > 70) {
    warnings.push(
      "High FPS with high CPU inference may indicate calculation error"
    )
    confidence *= 0.7
  }

  if (metrics.memory_usage < 100 && inferredCPU > 60) {
    warnings.push("Low memory with high CPU inference is unusual")
    confidence *= 0.8
  }

  if (metrics.load_time < 500 && inferredCPU > 50) {
    warnings.push("Fast load times with high CPU inference needs review")
    confidence *= 0.9
  }

  return {
    isRealistic: confidence > 0.7,
    confidence,
    warnings,
  }
}
