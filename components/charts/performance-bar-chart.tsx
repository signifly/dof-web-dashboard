"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface DataPoint {
  name: string
  [key: string]: string | number
}

interface PerformanceBarChartProps {
  data: DataPoint[]
  bars: {
    key: string
    name: string
    color: string
    unit?: string
  }[]
  height?: number
  showLegend?: boolean
}

export function PerformanceBarChart({
  data,
  bars,
  height = 300,
  showLegend = true,
}: PerformanceBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const bar = bars.find(b => b.key === entry.dataKey)
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}${bar?.unit || ""}`}
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
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {bars.map(bar => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.name}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
