"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRealtimeSessionMetrics } from "@/lib/hooks/use-realtime-session-metrics"
import { SessionMetricsTimeline } from "@/types/session"
import { RefreshCw, Wifi, WifiOff, Activity } from "lucide-react"
import { format } from "date-fns"

interface LiveSessionMonitorProps {
  sessionId: string
  initialMetrics?: SessionMetricsTimeline[]
}

export function LiveSessionMonitor({
  sessionId,
  initialMetrics = [],
}: LiveSessionMonitorProps) {
  const {
    metrics,
    isLive,
    isConnected,
    lastUpdate,
    error,
    reconnect,
    totalMetrics,
  } = useRealtimeSessionMetrics(sessionId, {
    initialData: initialMetrics,
    maxDataPoints: 50,
    aggregationInterval: 5000,
  })

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm:ss")
  }

  const getConnectionStatus = () => {
    if (error) return { icon: WifiOff, color: "text-red-500", text: "Error" }
    if (!isConnected) return { icon: WifiOff, color: "text-gray-500", text: "Disconnected" }
    if (isLive) return { icon: Activity, color: "text-green-500", text: "Live" }
    return { icon: Wifi, color: "text-blue-500", text: "Connected" }
  }

  const getPerformanceIndicator = (value: number, type: "fps" | "memory" | "cpu" | "loadTime") => {
    let status: "good" | "warning" | "danger" = "good"
    let color = "text-green-600"

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
      case "loadTime":
        if (value > 3000) status = "danger"
        else if (value > 2000) status = "warning"
        break
    }

    if (status === "warning") color = "text-yellow-600"
    if (status === "danger") color = "text-red-600"

    return { status, color }
  }

  const connectionStatus = getConnectionStatus()
  const ConnectionIcon = connectionStatus.icon
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Live Session Monitor</span>
        </CardTitle>
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <ConnectionIcon className={`h-4 w-4 ${connectionStatus.color}`} />
            <span className={`text-sm font-medium ${connectionStatus.color}`}>
              {connectionStatus.text}
            </span>
          </div>

          {/* Reconnect Button */}
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reconnect</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-medium">Connection Error:</span> {error.message}
            </p>
          </div>
        )}

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className={isLive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {isLive ? "LIVE" : "INACTIVE"}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Metrics</p>
            <p className="text-lg font-semibold">{totalMetrics.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Data Points</p>
            <p className="text-lg font-semibold">{metrics.length}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Update</p>
            <p className="text-sm font-medium">
              {lastUpdate ? formatTime(lastUpdate.toISOString()) : "None"}
            </p>
          </div>
        </div>

        {/* Latest Performance Metrics */}
        {latestMetric && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Latest Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">FPS</p>
                <p className={`text-lg font-bold ${getPerformanceIndicator(latestMetric.fps, "fps").color}`}>
                  {latestMetric.fps.toFixed(1)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Memory</p>
                <p className={`text-lg font-bold ${getPerformanceIndicator(latestMetric.memory_usage, "memory").color}`}>
                  {latestMetric.memory_usage.toFixed(0)}MB
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">CPU</p>
                <p className={`text-lg font-bold ${getPerformanceIndicator(latestMetric.cpu_usage, "cpu").color}`}>
                  {latestMetric.cpu_usage.toFixed(0)}%
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Load Time</p>
                <p className={`text-lg font-bold ${getPerformanceIndicator(latestMetric.load_time, "loadTime").color}`}>
                  {(latestMetric.load_time / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Current Screen:</span>
              <Badge variant="outline">{latestMetric.screen_name}</Badge>
            </div>
          </div>
        )}

        {/* Recent Metrics Stream */}
        {metrics.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {metrics.slice(-10).reverse().map((metric, index) => (
                <div
                  key={`${metric.timestamp}-${index}`}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatTime(metric.timestamp)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {metric.screen_name}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={getPerformanceIndicator(metric.fps, "fps").color}>
                      {metric.fps.toFixed(0)} FPS
                    </span>
                    <span className={getPerformanceIndicator(metric.memory_usage, "memory").color}>
                      {metric.memory_usage.toFixed(0)}MB
                    </span>
                    <span className={getPerformanceIndicator(metric.cpu_usage, "cpu").color}>
                      {metric.cpu_usage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {metrics.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Waiting for live session data...</p>
            <p className="text-xs mt-1">
              {isConnected ? "Connected and monitoring" : "Connecting to session"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}