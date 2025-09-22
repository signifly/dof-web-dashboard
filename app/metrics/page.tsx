import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { MetricCard } from "@/components/charts/metric-card"
import {
  getPerformanceSummary,
  getPerformanceTrends,
  getRecentSessions,
} from "@/lib/performance-data"

export const dynamic = "force-dynamic"

export default async function MetricsPage() {
  try {
    const [summary, trends, sessions] = await Promise.all([
      getPerformanceSummary(),
      getPerformanceTrends(100),
      getRecentSessions(20),
    ])

    return (
      <DashboardLayout title="Performance Metrics">
        <div className="space-y-6">
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
              <Button variant="outline">Export Data</Button>
              <Button>Refresh</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Average FPS"
              value={`${summary.avgFps.toFixed(1)}`}
              description="Frames per second across all sessions"
              trend={summary.avgFps >= 30 ? "up" : "down"}
              changeType={summary.avgFps >= 30 ? "positive" : "negative"}
            />

            <MetricCard
              title="Load Time"
              value={`${summary.avgLoadTime.toFixed(0)}ms`}
              description="Average screen load time"
              trend={summary.avgLoadTime <= 1000 ? "up" : "down"}
              changeType={summary.avgLoadTime <= 1000 ? "positive" : "negative"}
            />

            <MetricCard
              title="Active Sessions"
              value={summary.totalSessions}
              description={`${summary.totalMetrics.toLocaleString()} total metrics`}
              trend="stable"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
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

          <div className="grid gap-4 md:grid-cols-2">
            <PerformanceChart
              data={trends}
              title="Memory Usage Trends"
              metric="memory_usage"
              unit=" MB"
              height="h-64"
            />
            <PerformanceChart
              data={trends}
              title="Load Time Distribution"
              metric="load_time"
              unit="ms"
              height="h-64"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
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
                        {summary.avgCpu.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Memory Usage</span>
                      <span className="font-medium">
                        {summary.avgMemory.toFixed(1)} MB
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Load Time</span>
                      <span className="font-medium">
                        {summary.avgLoadTime.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Session Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Total Sessions</span>
                      <span className="font-medium">
                        {summary.totalSessions}
                      </span>
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
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading metrics data:", error)

    return (
      <DashboardLayout title="Performance Metrics">
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load metrics data
            </h2>
            <p className="text-gray-600">
              Make sure your database is connected and contains performance
              data.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
}
