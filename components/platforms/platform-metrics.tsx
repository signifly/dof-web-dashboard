"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"

interface PlatformMetricsProps {
  metrics: Array<{
    deviceId: string
    sessionId: string
    sessionNumber: number
    fps: number
    memory_usage: number
    cpu_usage: number
    load_time: number
    timestamp: string
  }>
}

export function PlatformMetrics({ metrics }: PlatformMetricsProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics by Device Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No metrics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for scatter plots - each session is a data point
  const chartData = metrics.map((metric, index) => {
    const date = new Date(metric.timestamp)
    const sessionIdShort = metric.sessionId.slice(0, 8) // First 8 chars of session ID

    return {
      x: index + 1, // Sequential index for x-axis positioning
      sessionId: metric.sessionId,
      sessionIdShort,
      fps: metric.fps,
      memory_usage: metric.memory_usage,
      cpu_usage: metric.cpu_usage,
      deviceId: metric.deviceId.slice(0, 8) + "...",
      sessionNumber: metric.sessionNumber,
      dateFormatted: format(date, "MMM d, HH:mm"),
      timestamp: metric.timestamp,
    }
  })

  // Custom tooltip to show device info and session ID
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">Session: {data.sessionIdShort}...</p>
          <p className="text-sm text-muted-foreground">
            Device: {data.deviceId}
          </p>
          <p className="text-sm text-muted-foreground">{data.dateFormatted}</p>
          <p className="text-sm">
            <span className="font-medium">Value:</span>{" "}
            {payload[0].value.toFixed(1)}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tick formatter for x-axis - show session ID
  const formatXAxis = (value: number) => {
    const index = value - 1
    if (index >= 0 && index < chartData.length) {
      return chartData[index].sessionIdShort
    }
    return ""
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Showing {metrics.length} session data points across all devices.
            Each point represents the average performance for one session.
          </p>
        </CardContent>
      </Card>

      {/* FPS Scatter Chart */}
      <Card>
        <CardHeader>
          <CardTitle>FPS Performance by Session</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Session"
                tickFormatter={formatXAxis}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                label={{
                  value: "Session ID",
                  position: "bottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="fps"
                name="FPS"
                label={{ value: "FPS", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter
                name="FPS"
                data={chartData}
                fill="#10b981"
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Memory Scatter Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage by Session</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Session"
                tickFormatter={formatXAxis}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                label={{
                  value: "Session ID",
                  position: "bottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="memory_usage"
                name="Memory"
                label={{
                  value: "Memory (MB)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter
                name="Memory (MB)"
                data={chartData}
                fill="#f59e0b"
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CPU Scatter Chart */}
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage by Session</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Session"
                tickFormatter={formatXAxis}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
                label={{
                  value: "Session ID",
                  position: "bottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="number"
                dataKey="cpu_usage"
                name="CPU"
                label={{
                  value: "CPU (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter
                name="CPU (%)"
                data={chartData}
                fill="#ef4444"
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
