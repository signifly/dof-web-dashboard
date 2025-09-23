"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { MetricCard } from "@/components/charts/metric-card"
import { DataFreshness } from "@/components/ui/data-freshness"
import { RefreshSettings } from "@/components/settings/refresh-settings"
import { useSmartRefresh } from "@/lib/hooks/use-smart-refresh"
import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"
import { getDashboardDataClient } from "@/lib/performance-data-client"
import { Settings, ChevronDown, ChevronUp, Download } from "lucide-react"

interface MetricsContentProps {
  initialSummary: PerformanceSummary
  initialTrends: MetricsTrend[]
}

interface MetricsData {
  summary: PerformanceSummary
  trends: MetricsTrend[]
}

export function MetricsContent({
  initialSummary,
  initialTrends,
}: MetricsContentProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Smart refresh for metrics data with longer interval (summary type)
  const {
    data: metricsData,
    isRefreshing,
    lastUpdated,
    nextRefresh,
    error,
    isPaused,
    refresh,
  } = useSmartRefresh<MetricsData>(
    async () => {
      return await getDashboardDataClient(100) // Use more data points for detailed metrics
    },
    {
      interval: 5 * 60 * 1000, // 5 minutes for summary data
      pauseOnInteraction: true,
      enabled: true,
      key: "metrics-data",
      type: "summary",
    },
    { summary: initialSummary, trends: initialTrends }
  )

  const summary = metricsData?.summary || initialSummary
  const trends = metricsData?.trends || initialTrends

  const handleExportData = () => {
    // Create CSV data
    const csvData = trends.map(trend => ({
      timestamp: trend.timestamp,
      fps: trend.fps,
      cpu_usage: trend.cpu_usage,
      memory_usage: trend.memory_usage,
      load_time: trend.load_time,
      screen_name: trend.screen_name,
    }))

    // Convert to CSV string
    const headers = Object.keys(csvData[0]).join(",")
    const csvContent = [
      headers,
      ...csvData.map(row => Object.values(row).join(",")),
    ].join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `performance-metrics-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header with data freshness and controls */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Performance Metrics
            </h2>
            <p className="text-muted-foreground">
              Detailed analytics and performance trends for your applications.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={!trends.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
              {showSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <DataFreshness
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            nextRefresh={nextRefresh}
            error={error}
            isPaused={isPaused}
            onRefresh={refresh}
            showNextRefresh={true}
          />
        </div>

        {/* Collapsible refresh settings */}
        {showSettings && (
          <div className="border rounded-lg p-4">
            <RefreshSettings sections={["intervals"]} compact={true} />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Average FPS"
          value={`${summary.avgFps.toFixed(1)}`}
          description="Frames per second across all sessions"
          trend={summary.avgFps >= 30 ? "up" : "down"}
          changeType={summary.avgFps >= 30 ? "positive" : "negative"}
        />

        <MetricCard
          title="Active Sessions"
          value={summary.totalSessions}
          description={`${summary.totalMetrics.toLocaleString()} total metrics`}
          trend="stable"
        />
      </div>

      {/* Performance Trends Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Trends Over Time</CardTitle>
            <DataFreshness
              lastUpdated={lastUpdated}
              isRefreshing={isRefreshing}
              error={error}
              compact={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <PerformanceChart
              data={trends}
              title="FPS Performance"
              metric="fps"
              unit=" FPS"
              height="h-64"
            />
            <PerformanceChart
              data={trends}
              title="CPU Usage"
              metric="cpu_usage"
              unit="%"
              height="h-64"
            />
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart
            data={trends}
            title="Memory Usage Trends"
            metric="memory_usage"
            unit=" MB"
            height="h-64"
          />
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Key Performance Indicators</CardTitle>
            <DataFreshness
              lastUpdated={lastUpdated}
              isRefreshing={isRefreshing}
              error={error}
              compact={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-4">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Average FPS</span>
                  <span className="font-medium">
                    {summary.avgFps.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average CPU Usage</span>
                  <span className="font-medium">
                    {summary.avgCpu === 0
                      ? "No data"
                      : `${summary.avgCpu.toFixed(1)}%*`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Memory Usage</span>
                  <span className="font-medium">
                    {summary.avgMemory.toFixed(1)} MB
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Session Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Sessions</span>
                  <span className="font-medium">{summary.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Metrics</span>
                  <span className="font-medium">
                    {summary.totalMetrics.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Unique Devices</span>
                  <span className="font-medium">{summary.deviceCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Platforms</span>
                  <span className="font-medium">
                    {summary.platformBreakdown.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
