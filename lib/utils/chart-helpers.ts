import { format, parseISO, isValid } from "date-fns"
import { MetricsTrend } from "@/lib/performance-data"
import { CHART_COLORS } from "@/constants/ui/colors"

// Color schemes for different chart types and themes
export const chartColorSchemes = {
  primary: {
    fps: CHART_COLORS.PRIMARY, // green-500
    memory_usage: CHART_COLORS.WARNING, // amber-500
    cpu_usage: CHART_COLORS.DANGER, // red-500
    load_time: CHART_COLORS.SECONDARY, // blue-500
  },
  secondary: {
    fps: CHART_COLORS.PRIMARY_DARK, // green-600
    memory_usage: CHART_COLORS.WARNING_DARK, // amber-600
    cpu_usage: CHART_COLORS.DANGER_DARK, // red-600
    load_time: CHART_COLORS.SECONDARY_DARK, // blue-600
  },
  gradient: {
    fps: [CHART_COLORS.PRIMARY, CHART_COLORS.PRIMARY_DARKEST], // green-500 to green-800
    memory_usage: [CHART_COLORS.WARNING, CHART_COLORS.WARNING_DARKEST], // amber-500 to amber-800
    cpu_usage: [CHART_COLORS.DANGER, CHART_COLORS.DANGER_DARKEST], // red-500 to red-800
    load_time: [CHART_COLORS.SECONDARY, CHART_COLORS.SECONDARY_DARKEST], // blue-500 to blue-800
  },
  categorical: [
    CHART_COLORS.PRIMARY, // green-500
    CHART_COLORS.WARNING, // amber-500
    CHART_COLORS.DANGER, // red-500
    CHART_COLORS.SECONDARY, // blue-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
    "#84cc16", // lime-500
  ],
}

// Performance thresholds for color coding
export const performanceThresholds = {
  fps: {
    excellent: 50,
    good: 30,
    fair: 20,
    poor: 0,
  },
  memory_usage: {
    excellent: 200,
    good: 400,
    fair: 600,
    poor: Infinity,
  },
  cpu_usage: {
    excellent: 30,
    good: 50,
    fair: 70,
    poor: Infinity,
  },
  load_time: {
    excellent: 500,
    good: 1000,
    fair: 2000,
    poor: Infinity,
  },
}

/**
 * Get performance-based color for a metric value
 */
export function getPerformanceColor(
  metric: keyof typeof performanceThresholds,
  value: number
): string {
  const thresholds = performanceThresholds[metric]

  if (
    metric === "memory_usage" ||
    metric === "cpu_usage" ||
    metric === "load_time"
  ) {
    // Lower is better for these metrics
    if (value <= thresholds.excellent) return "#10b981" // green
    if (value <= thresholds.good) return "#f59e0b" // amber
    if (value <= thresholds.fair) return "#f97316" // orange
    return "#ef4444" // red
  } else {
    // Higher is better for FPS
    if (value >= thresholds.excellent) return "#10b981" // green
    if (value >= thresholds.good) return "#f59e0b" // amber
    if (value >= thresholds.fair) return "#f97316" // orange
    return "#ef4444" // red
  }
}

/**
 * Get performance tier based on metric value
 */
export function getPerformanceTier(
  metric: keyof typeof performanceThresholds,
  value: number
): string {
  const thresholds = performanceThresholds[metric]

  if (
    metric === "memory_usage" ||
    metric === "cpu_usage" ||
    metric === "load_time"
  ) {
    if (value <= thresholds.excellent) return "Excellent"
    if (value <= thresholds.good) return "Good"
    if (value <= thresholds.fair) return "Fair"
    return "Poor"
  } else {
    if (value >= thresholds.excellent) return "Excellent"
    if (value >= thresholds.good) return "Good"
    if (value >= thresholds.fair) return "Fair"
    return "Poor"
  }
}

/**
 * Transform data for different chart types
 */
export function transformDataForChart(
  data: MetricsTrend[],
  _chartType: "line" | "area" | "bar" | "scatter", // Reserved for future chart-specific transformations
  metric: string
): any[] {
  if (!data.length) return []

  return data.map((item, index) => ({
    ...item,
    index,
    timestamp_formatted: formatTimestamp(item.timestamp),
    timestamp_short: formatTimestamp(item.timestamp, "HH:mm:ss"),
    value: (item as any)[metric] || 0,
    performance_tier: getPerformanceTier(
      metric as any,
      (item as any)[metric] || 0
    ),
    color: getPerformanceColor(metric as any, (item as any)[metric] || 0),
  }))
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(
  timestamp: string,
  formatString = "MMM dd, HH:mm:ss"
): string {
  try {
    const date = parseISO(timestamp)
    if (!isValid(date)) {
      return timestamp // Return original if parsing fails
    }
    return format(date, formatString)
  } catch (_error) {
    return timestamp
  }
}

/**
 * Calculate chart domain for better visualization
 */
export function calculateChartDomain(
  data: any[],
  metric: string
): [number, number] {
  if (!data.length) return [0, 100]

  const values = data.map(item => item.value || (item as any)[metric] || 0)
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Add padding for better visualization
  const padding = (max - min) * 0.1
  const paddedMin = Math.max(0, min - padding)
  const paddedMax = max + padding

  return [paddedMin, paddedMax]
}

/**
 * Get optimal tick count based on data length and container width
 */
export function getOptimalTickCount(
  dataLength: number,
  containerWidth: number
): number {
  if (containerWidth < 400) return Math.min(3, dataLength)
  if (containerWidth < 600) return Math.min(5, dataLength)
  if (containerWidth < 800) return Math.min(7, dataLength)
  return Math.min(10, dataLength)
}

/**
 * Generate chart annotation points
 */
export interface ChartAnnotation {
  x: number | string
  y: number
  label: string
  type: "warning" | "error" | "info" | "success"
  description?: string
}

export function generatePerformanceAnnotations(
  data: MetricsTrend[],
  metric: string
): ChartAnnotation[] {
  const annotations: ChartAnnotation[] = []

  data.forEach((item, _index) => {
    const value = (item as any)[metric] || 0
    const timestamp = item.timestamp

    // Add annotations for extreme values
    if (metric === "fps" && value < 15) {
      annotations.push({
        x: timestamp,
        y: value,
        label: "Low FPS",
        type: "error",
        description: `FPS dropped to ${value.toFixed(1)} - potential performance issue`,
      })
    }

    if (metric === "memory_usage" && value > 800) {
      annotations.push({
        x: timestamp,
        y: value,
        label: "High Memory",
        type: "warning",
        description: `Memory usage at ${value.toFixed(0)}MB - monitor for leaks`,
      })
    }

    if (metric === "cpu_usage" && value > 80) {
      annotations.push({
        x: timestamp,
        y: value,
        label: "High CPU",
        type: "error",
        description: `CPU usage at ${value.toFixed(1)}% - performance bottleneck`,
      })
    }

    if (metric === "load_time" && value > 3000) {
      annotations.push({
        x: timestamp,
        y: value,
        label: "Slow Load",
        type: "warning",
        description: `Load time of ${value.toFixed(0)}ms - user experience impact`,
      })
    }
  })

  return annotations
}

/**
 * Aggregate data for different time intervals
 */
export function aggregateDataByInterval(
  data: MetricsTrend[],
  interval: "minute" | "hour" | "day",
  _metric: string // Reserved for future metric-specific aggregation logic
): MetricsTrend[] {
  if (!data.length) return []

  const groupedData = new Map<string, MetricsTrend[]>()

  data.forEach(item => {
    const date = parseISO(item.timestamp)
    let key: string

    switch (interval) {
      case "minute":
        key = format(date, "yyyy-MM-dd HH:mm")
        break
      case "hour":
        key = format(date, "yyyy-MM-dd HH")
        break
      case "day":
        key = format(date, "yyyy-MM-dd")
        break
    }

    if (!groupedData.has(key)) {
      groupedData.set(key, [])
    }
    groupedData.get(key)!.push(item)
  })

  // Calculate averages for each group
  return Array.from(groupedData.entries())
    .map(([__key, items]) => {
      const avgFps =
        items.reduce((sum, item) => sum + item.fps, 0) / items.length
      const avgMemory =
        items.reduce((sum, item) => sum + item.memory_usage, 0) / items.length
      const avgCpu =
        items.reduce((sum, item) => sum + item.cpu_usage, 0) / items.length
      const avgLoadTime =
        items.reduce((sum, item) => sum + item.load_time, 0) / items.length

      return {
        timestamp: items[0].timestamp, // Use first timestamp as representative
        fps: Math.round(avgFps * 10) / 10,
        memory_usage: Math.round(avgMemory * 10) / 10,
        cpu_usage: Math.round(avgCpu * 10) / 10,
        load_time: Math.round(avgLoadTime * 10) / 10,
        screen_name: items[0].screen_name, // Use first screen name
      }
    })
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
}

/**
 * Convert chart data to CSV format
 */
export function convertToCSV(data: any[], includeHeaders = true): string {
  if (!data.length) return ""

  const headers = Object.keys(data[0])
  const csvRows: string[] = []

  if (includeHeaders) {
    csvRows.push(headers.join(","))
  }

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      // Handle values that might contain commas or quotes
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(","))
  })

  return csvRows.join("\n")
}

/**
 * Convert chart data to JSON format with metadata
 */
export function convertToJSON(data: any[], includeMetadata = true): string {
  const output = includeMetadata
    ? {
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: data.length,
          format: "performance_metrics",
        },
        data,
      }
    : data

  return JSON.stringify(output, null, 2)
}

/**
 * Calculate moving average for smoother trend lines
 */
export function calculateMovingAverage(
  data: number[],
  windowSize = 5
): number[] {
  if (data.length < windowSize) return data

  const result: number[] = []

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1)
    const window = data.slice(start, end)
    const average = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(Math.round(average * 10) / 10)
  }

  return result
}

/**
 * Detect performance anomalies in the data
 */
export interface PerformanceAnomaly {
  index: number
  timestamp: string
  metric: string
  value: number
  severity: "low" | "medium" | "high"
  description: string
}

export function detectAnomalies(
  data: MetricsTrend[],
  metric: string
): PerformanceAnomaly[] {
  if (data.length < 3) return []

  const anomalies: PerformanceAnomaly[] = []
  const values = data.map(item => (item as any)[metric] || 0)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length
  const stdDev = Math.sqrt(variance)

  data.forEach((item, index) => {
    const value = (item as any)[metric] || 0
    const zScore = Math.abs((value - mean) / stdDev)

    let severity: "low" | "medium" | "high" = "low"
    let description = ""

    if (zScore > 3) {
      severity = "high"
      description = `Extreme outlier: ${value.toFixed(1)} (${zScore.toFixed(1)} standard deviations from mean)`
    } else if (zScore > 2) {
      severity = "medium"
      description = `Significant deviation: ${value.toFixed(1)} (${zScore.toFixed(1)} standard deviations from mean)`
    } else if (zScore > 1.5) {
      severity = "low"
      description = `Minor deviation: ${value.toFixed(1)} (${zScore.toFixed(1)} standard deviations from mean)`
    }

    if (zScore > 1.5) {
      anomalies.push({
        index,
        timestamp: item.timestamp,
        metric,
        value,
        severity,
        description,
      })
    }
  })

  return anomalies
}
