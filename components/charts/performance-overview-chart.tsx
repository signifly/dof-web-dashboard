"use client"

import { PerformanceLineChart } from "./performance-line-chart"
import { MetricsTrend } from "@/lib/performance-data"

interface PerformanceOverviewChartProps {
  data: MetricsTrend[]
  height?: number
  showAllMetrics?: boolean
}

export function PerformanceOverviewChart({
  data,
  height = 300,
  showAllMetrics = true,
}: PerformanceOverviewChartProps) {
  const lines = []

  if (showAllMetrics) {
    lines.push(
      {
        key: "fps",
        name: "FPS",
        color: "#8884d8",
        unit: " fps",
      },
      {
        key: "cpu_usage",
        name: "CPU Usage",
        color: "#82ca9d",
        unit: "%",
      },
      {
        key: "memory_usage",
        name: "Memory Usage",
        color: "#ffc658",
        unit: " MB",
      },
      {
        key: "load_time",
        name: "Load Time",
        color: "#ff7300",
        unit: " ms",
      },
      {
        key: "cache_size",
        name: "Cache Size",
        color: "#a78bfa",
        unit: " MB",
        formatValue: (val: number) => (val / 1024 / 1024).toFixed(1),
      }
    )
  } else {
    // Show only FPS and CPU for simplified view
    lines.push(
      {
        key: "fps",
        name: "FPS",
        color: "#8884d8",
        unit: " fps",
      },
      {
        key: "cpu_usage",
        name: "CPU Usage",
        color: "#82ca9d",
        unit: "%",
      }
    )
  }

  return (
    <PerformanceLineChart
      data={data}
      lines={lines}
      height={height}
      showLegend={true}
    />
  )
}
