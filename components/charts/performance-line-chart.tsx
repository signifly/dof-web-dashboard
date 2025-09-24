"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { MetricsTrend } from "@/lib/performance-data"

interface _DataPoint {
  timestamp: string
  [key: string]: string | number
}

interface PerformanceLineChartProps {
  data: MetricsTrend[]
  lines: {
    key: string
    name: string
    color: string
    unit?: string
  }[]
  height?: number
  showLegend?: boolean
  formatTimestamp?: (timestamp: string) => string
}

const defaultFormatTimestamp = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "HH:mm:ss")
  } catch {
    return timestamp
  }
}

export function PerformanceLineChart({
  data,
  lines,
  height = 300,
  showLegend = true,
  formatTimestamp = defaultFormatTimestamp,
}: PerformanceLineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{formatTimestamp(label)}</p>
          {payload.map((entry: any, index: number) => {
            const line = lines.find(l => l.key === entry.dataKey)
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}${line?.unit || ""}`}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTimestamp}
          className="text-xs fill-muted-foreground"
        />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {lines.map(line => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
