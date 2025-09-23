"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SessionMetricsTimeline } from "@/types/session"
import { MetricsTrend } from "@/lib/performance-data"
import { MultiSeriesChart } from "@/components/charts"
import { format } from "date-fns"
import { useState } from "react"
import { Activity, Clock, Zap, HardDrive, Cpu } from "lucide-react"

interface SessionMetricsTimelineProps {
  metrics: SessionMetricsTimeline[]
  sessionId: string
  isLive?: boolean
}

type MetricType = "fps" | "memory" | "cpu" | "all"

export function SessionMetricsTimelineComponent({
  metrics,
  sessionId,
  isLive = false,
}: SessionMetricsTimelineProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("all")
  const [timeRange, setTimeRange] = useState<"all" | "last10" | "last5">("all")

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm:ss")
  }

  const getFilteredMetrics = () => {
    let filteredMetrics = [...metrics]

    // Filter by time range
    if (timeRange === "last10") {
      filteredMetrics = filteredMetrics.slice(-10)
    } else if (timeRange === "last5") {
      filteredMetrics = filteredMetrics.slice(-5)
    }

    return filteredMetrics
  }

  const getChartData = (): MetricsTrend[] => {
    const filteredMetrics = getFilteredMetrics()

    return filteredMetrics.map(metric => ({
      timestamp: formatTime(metric.timestamp),
      fps: metric.fps,
      memory_usage: metric.memory_usage,
      cpu_usage: metric.cpu_usage,
      load_time: 0, // Not used anymore but required by MetricsTrend type
      screen_name: metric.screen_name,
    }))
  }

  const getChartConfig = () => {
    const baseConfig = {
      fps: {
        key: "fps",
        name: "FPS",
        color: "#10b981",
        unit: " FPS",
      },
      memory: {
        key: "memory_usage",
        name: "Memory",
        color: "#f59e0b",
        unit: "MB",
      },
      cpu: {
        key: "cpu_usage",
        name: "CPU",
        color: "#ef4444",
        unit: "%",
      },
    }

    switch (selectedMetric) {
      case "fps":
        return [baseConfig.fps]
      case "memory":
        return [baseConfig.memory]
      case "cpu":
        return [baseConfig.cpu]
      case "all":
      default:
        return Object.values(baseConfig)
    }
  }

  const getMetricStats = () => {
    if (metrics.length === 0) return null

    const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length
    const avgMemory =
      metrics.reduce((sum, m) => sum + m.memory_usage, 0) / metrics.length
    const avgCpu =
      metrics.reduce((sum, m) => sum + m.cpu_usage, 0) / metrics.length

    const maxFps = Math.max(...metrics.map(m => m.fps))
    const maxMemory = Math.max(...metrics.map(m => m.memory_usage))
    const maxCpu = Math.max(...metrics.map(m => m.cpu_usage))

    const minFps = Math.min(...metrics.map(m => m.fps))
    const minMemory = Math.min(...metrics.map(m => m.memory_usage))
    const minCpu = Math.min(...metrics.map(m => m.cpu_usage))

    return {
      avg: {
        fps: avgFps,
        memory: avgMemory,
        cpu: avgCpu,
      },
      max: {
        fps: maxFps,
        memory: maxMemory,
        cpu: maxCpu,
      },
      min: {
        fps: minFps,
        memory: minMemory,
        cpu: minCpu,
      },
    }
  }

  const getPerformanceIndicator = (
    value: number,
    type: "fps" | "memory" | "cpu"
  ) => {
    let status: "good" | "warning" | "danger" = "good"

    switch (type) {
      case "fps":
        if (value < 20) status = "danger"
        else if (value < 30) status = "warning"
        break
      case "memory":
        if (value > 600) status = "danger"
        else if (value > 400) status = "warning"
        break
      case "cpu":
        if (value > 80) status = "danger"
        else if (value > 60) status = "warning"
        break
    }

    return status
  }

  const getScreenTransitions = () => {
    const transitions: { timestamp: string; screen: string; index: number }[] =
      []
    let currentScreen = ""

    metrics.forEach((metric, index) => {
      if (metric.screen_name !== currentScreen) {
        transitions.push({
          timestamp: metric.timestamp,
          screen: metric.screen_name,
          index,
        })
        currentScreen = metric.screen_name
      }
    })

    return transitions
  }

  const chartData = getChartData()
  const chartConfig = getChartConfig()
  const stats = getMetricStats()
  const screenTransitions = getScreenTransitions()

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Performance Metrics Timeline</span>
              {isLive && (
                <Badge className="bg-green-100 text-green-800">LIVE</Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {/* Metric Filter */}
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={selectedMetric === "all" ? "default" : "outline"}
                  onClick={() => setSelectedMetric("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={selectedMetric === "fps" ? "default" : "outline"}
                  onClick={() => setSelectedMetric("fps")}
                  className="flex items-center space-x-1"
                >
                  <Zap className="h-3 w-3" />
                  <span>FPS</span>
                </Button>
                <Button
                  size="sm"
                  variant={selectedMetric === "memory" ? "default" : "outline"}
                  onClick={() => setSelectedMetric("memory")}
                  className="flex items-center space-x-1"
                >
                  <HardDrive className="h-3 w-3" />
                  <span>Memory</span>
                </Button>
                <Button
                  size="sm"
                  variant={selectedMetric === "cpu" ? "default" : "outline"}
                  onClick={() => setSelectedMetric("cpu")}
                  className="flex items-center space-x-1"
                >
                  <Cpu className="h-3 w-3" />
                  <span>CPU</span>
                </Button>
              </div>

              {/* Time Range Filter */}
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={timeRange === "all" ? "default" : "outline"}
                  onClick={() => setTimeRange("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === "last10" ? "default" : "outline"}
                  onClick={() => setTimeRange("last10")}
                >
                  Last 10
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === "last5" ? "default" : "outline"}
                  onClick={() => setTimeRange("last5")}
                >
                  Last 5
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-4">
              <MultiSeriesChart
                datasets={[
                  {
                    name: "FPS",
                    data: chartData,
                    metric: "fps",
                    color: "#10b981",
                    visible:
                      selectedMetric === "all" || selectedMetric === "fps",
                  },
                  {
                    name: "Memory",
                    data: chartData,
                    metric: "memory_usage",
                    color: "#f59e0b",
                    visible:
                      selectedMetric === "all" || selectedMetric === "memory",
                  },
                  {
                    name: "CPU",
                    data: chartData,
                    metric: "cpu_usage",
                    color: "#ef4444",
                    visible:
                      selectedMetric === "all" || selectedMetric === "cpu",
                  },
                ]}
                title="Session Performance Timeline"
                height={350}
                chartType="line"
                enableBrush={true}
                enableZoom={true}
                enableExport={true}
                enableLegend={selectedMetric === "all"}
              />

              {/* Screen Transitions */}
              {screenTransitions.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Screen Transitions</h4>
                  <div className="flex flex-wrap gap-2">
                    {screenTransitions.map((transition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {formatTime(transition.timestamp)} → {transition.screen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance metrics available</p>
              <p className="text-sm mt-1">
                Metrics will appear here as the session generates data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* FPS Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>FPS</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span
                      className={
                        getPerformanceIndicator(stats.avg.fps, "fps") === "good"
                          ? "text-green-600"
                          : getPerformanceIndicator(stats.avg.fps, "fps") ===
                              "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {stats.avg.fps.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span>
                      {stats.min.fps.toFixed(1)} - {stats.max.fps.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Memory</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span
                      className={
                        getPerformanceIndicator(stats.avg.memory, "memory") ===
                        "good"
                          ? "text-green-600"
                          : getPerformanceIndicator(
                                stats.avg.memory,
                                "memory"
                              ) === "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {stats.avg.memory.toFixed(0)}MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span>
                      {stats.min.memory.toFixed(0)} -{" "}
                      {stats.max.memory.toFixed(0)}MB
                    </span>
                  </div>
                </div>
              </div>

              {/* CPU Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>CPU</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span
                      className={
                        getPerformanceIndicator(stats.avg.cpu, "cpu") === "good"
                          ? "text-green-600"
                          : getPerformanceIndicator(stats.avg.cpu, "cpu") ===
                              "warning"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {stats.avg.cpu.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Range:</span>
                    <span>
                      {stats.min.cpu.toFixed(0)} - {stats.max.cpu.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
