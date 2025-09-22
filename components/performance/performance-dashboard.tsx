import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSummaryCards } from "./performance-summary-cards"
import { SessionOverview } from "./session-overview"
import { PerformanceOverviewChart } from "@/components/charts/performance-overview-chart"
import {
  getPerformanceSummary,
  getPerformanceTrends,
} from "@/lib/performance-data"

async function PerformanceData() {
  const [summary, trends] = await Promise.all([
    getPerformanceSummary(),
    getPerformanceTrends(50), // Get last 50 data points for trends
  ])

  return (
    <div className="space-y-6">
      <PerformanceSummaryCards data={summary} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <PerformanceOverviewChart
                data={trends}
                height={250}
                showAllMetrics={false} // Simplified view for dashboard
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Devices</span>
                <span className="text-sm text-muted-foreground">
                  {summary.deviceCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Sessions</span>
                <span className="text-sm text-muted-foreground">
                  {summary.totalSessions.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Points</span>
                <span className="text-sm text-muted-foreground">
                  {summary.totalMetrics.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Load Time</span>
                <span className="text-sm text-muted-foreground">
                  {summary.avgLoadTime.toFixed(0)}ms
                </span>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Platforms:{" "}
                  {summary.platformBreakdown.map(p => p.platform).join(", ") ||
                    "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionOverview summary={summary} />
    </div>
  )
}

function PerformanceLoadingState() {
  return (
    <div className="space-y-6">
      {/* Summary cards loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Chart and status loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session overview loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 h-64 bg-muted rounded-lg animate-pulse" />
        <div className="col-span-3 h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

export function PerformanceDashboard() {
  return (
    <Suspense fallback={<PerformanceLoadingState />}>
      <PerformanceData />
    </Suspense>
  )
}
