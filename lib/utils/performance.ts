/**
 * Utility functions for performance data formatting and calculations
 */

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}

export function formatMemory(value: number): string {
  return `${value.toFixed(0)} MB`
}

export function formatDuration(duration: number | null): string {
  if (!duration) return "Unknown"
  if (duration < 60) return `${Math.round(duration)}s`
  if (duration < 3600) return `${Math.round(duration / 60)}m`
  return `${Math.round(duration / 3600)}h`
}

export function getPerformanceGrade(fps: number): {
  grade: string
  type: "positive" | "negative" | "neutral"
  trend: "up" | "down" | "stable"
} {
  if (fps >= 50) {
    return { grade: "Excellent", type: "positive", trend: "up" }
  } else if (fps >= 30) {
    return { grade: "Good", type: "positive", trend: "stable" }
  } else if (fps >= 20) {
    return { grade: "Fair", type: "neutral", trend: "down" }
  } else {
    return { grade: "Poor", type: "negative", trend: "down" }
  }
}

export function getCpuGrade(cpu: number): {
  grade: string
  type: "positive" | "negative" | "neutral"
  trend: "up" | "down" | "stable"
} {
  if (cpu <= 30) {
    return { grade: "Low", type: "positive", trend: "down" }
  } else if (cpu <= 60) {
    return { grade: "Moderate", type: "neutral", trend: "stable" }
  } else if (cpu <= 80) {
    return { grade: "High", type: "negative", trend: "up" }
  } else {
    return { grade: "Critical", type: "negative", trend: "up" }
  }
}

export function getMemoryGrade(memory: number): {
  grade: string
  type: "positive" | "negative" | "neutral"
  trend: "up" | "down" | "stable"
} {
  if (memory <= 200) {
    return { grade: "Low", type: "positive", trend: "down" }
  } else if (memory <= 400) {
    return { grade: "Moderate", type: "neutral", trend: "stable" }
  } else if (memory <= 600) {
    return { grade: "High", type: "negative", trend: "up" }
  } else {
    return { grade: "Critical", type: "negative", trend: "up" }
  }
}

export function getPerformanceColor(fps: number): string {
  if (fps >= 50) return "bg-green-500"
  if (fps >= 30) return "bg-yellow-500"
  if (fps >= 20) return "bg-orange-500"
  return "bg-red-500"
}
