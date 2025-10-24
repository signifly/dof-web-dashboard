import { PerformanceMetric } from "@/lib/performance-data"
import {
  inferCPUUsage,
  PerformanceMetricsForInference,
} from "@/lib/utils/cpu-inference"

/**
 * Calculate inferred CPU usage for a session based on its metrics
 */
export function calculateInferredCPU(
  metrics: PerformanceMetric[],
  deviceType: string
): number {
  // Get the latest values for each metric type
  const fpsMetrics = metrics.filter(m => m.metric_type === "fps")
  const memoryMetrics = metrics.filter(m => m.metric_type === "memory_usage")
  const loadTimeMetrics = metrics.filter(
    m =>
      m.metric_type === "navigation_time" ||
      m.metric_type === "screen_load" ||
      m.metric_type === "load_time"
  )

  if (
    fpsMetrics.length === 0 &&
    memoryMetrics.length === 0 &&
    loadTimeMetrics.length === 0
  ) {
    return 0 // No data to infer from
  }

  // Calculate averages
  const avgFps =
    fpsMetrics.length > 0
      ? fpsMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        fpsMetrics.length
      : 30 // Default reasonable FPS if no data

  const avgMemory =
    memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        memoryMetrics.length
      : 200 // Default reasonable memory if no data

  const avgLoadTime =
    loadTimeMetrics.length > 0
      ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
        loadTimeMetrics.length
      : 1000 // Default reasonable load time if no data

  const inferenceInput: PerformanceMetricsForInference = {
    fps: avgFps,
    memory_usage: avgMemory,
    load_time: avgLoadTime,
    device_type: deviceType,
  }

  return inferCPUUsage(inferenceInput)
}

/**
 * Helper to get metric type filters for common queries
 */
export const METRIC_TYPE_FILTERS = {
  FPS: "fps",
  MEMORY: "memory_usage",
  LOAD_TIME: ["navigation_time", "screen_load", "load_time"],
  CPU: "cpu_usage",
  CACHE_SIZE: "cache_size",
} as const

/**
 * Helper to extract metrics by type with fallback values
 */
export function extractMetricsByType(
  metrics: PerformanceMetric[],
  metricType: keyof typeof METRIC_TYPE_FILTERS,
  defaultValue = 0
): { values: number[]; average: number } {
  let filteredMetrics: PerformanceMetric[] = []

  switch (metricType) {
    case "FPS":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.FPS
      )
      break
    case "MEMORY":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.MEMORY
      )
      break
    case "LOAD_TIME":
      filteredMetrics = metrics.filter(m =>
        (METRIC_TYPE_FILTERS.LOAD_TIME as readonly string[]).includes(
          m.metric_type
        )
      )
      break
    case "CPU":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.CPU
      )
      break
    case "CACHE_SIZE":
      filteredMetrics = metrics.filter(
        m => m.metric_type === METRIC_TYPE_FILTERS.CACHE_SIZE
      )
      break
  }

  const values = filteredMetrics.map(m => m.metric_value)
  const average =
    values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : defaultValue

  return { values, average }
}
