"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"
import { VersionSessionMetric } from "@/lib/types/version"

interface VersionMetricsChartsProps {
  metrics: VersionSessionMetric[]
}

export function VersionMetricsCharts({ metrics }: VersionMetricsChartsProps) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No metrics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format metrics for charts
  const chartData = metrics.map(metric => ({
    ...metric,
    timestamp: new Date(metric.timestamp).getTime(),
    timestampLabel: format(parseISO(metric.timestamp), "MMM d, HH:mm"),
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border p-3 rounded shadow-lg">
          <p className="text-sm font-medium mb-2">{data.timestampLabel}</p>
          <p className="text-xs text-muted-foreground mb-1">
            Device: {data.deviceId.substring(0, 8)}...
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Platform: {data.platform}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: {entry.value}
                {entry.name === "FPS" ? "" : entry.name === "Memory" ? " MB" : "%"}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* FPS Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>FPS Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={timestamp =>
                  format(new Date(timestamp), "MMM d")
                }
                className="text-xs"
              />
              <YAxis className="text-xs" domain={[0, "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="fps"
                name="FPS"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Memory Usage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={timestamp =>
                  format(new Date(timestamp), "MMM d")
                }
                className="text-xs"
              />
              <YAxis className="text-xs" domain={[0, "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="memory_usage"
                name="Memory"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CPU Usage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={timestamp =>
                  format(new Date(timestamp), "MMM d")
                }
                className="text-xs"
              />
              <YAxis className="text-xs" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu_usage"
                name="CPU"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* FPS vs Memory Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>FPS vs Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="fps"
                name="FPS"
                className="text-xs"
                domain={[0, "auto"]}
              />
              <YAxis
                type="number"
                dataKey="memory_usage"
                name="Memory"
                className="text-xs"
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<CustomTooltip />}
              />
              <Legend />
              <Scatter
                name="Sessions"
                data={chartData}
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
