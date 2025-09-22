"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsTrend } from "@/lib/performance-data"

interface PerformanceChartProps {
  data: MetricsTrend[]
  title: string
  metric: "fps" | "memory_usage" | "cpu_usage" | "load_time"
  unit?: string
  height?: string
}

export function PerformanceChart({
  data,
  title,
  metric,
  unit = "",
  height = "h-64",
}: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`${height} flex items-center justify-center text-muted-foreground`}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Simple visualization using CSS bars
  const values = data.map(d => d[metric])
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <span className="text-sm font-normal text-muted-foreground">
            {data.length} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${height} flex items-end justify-between gap-1 p-4`}>
          {data.slice(-20).map((point, index) => {
            const percentage = ((point[metric] - minValue) / range) * 100
            const barHeight = Math.max(percentage, 5) // Minimum 5% height

            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity relative group"
                style={{ height: `${barHeight}%` }}
                title={`${point.screen_name}: ${point[metric]}${unit}`}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {point.screen_name}: {point[metric]}
                  {unit}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>
            Min: {minValue.toFixed(1)}
            {unit}
          </span>
          <span>
            Max: {maxValue.toFixed(1)}
            {unit}
          </span>
          <span>
            Avg:{" "}
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}
            {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
