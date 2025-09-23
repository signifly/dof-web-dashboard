import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PerformanceSummaryCards } from "@/components/performance/performance-summary-cards"
import { PlatformBreakdown } from "@/components/performance/platform-breakdown"
import { RecentSessions } from "@/components/performance/recent-sessions"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { PerformanceTiers } from "@/components/analytics/performance-tiers"
import { FpsDistribution } from "@/components/analytics/fps-distribution"
import { MemoryPressure } from "@/components/analytics/memory-pressure"
import { RegressionDetection } from "@/components/analytics/regression-detection"
import {
  getPerformanceSummary,
  getPerformanceTrends,
} from "@/lib/performance-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  try {
    const [summary, trends] = await Promise.all([
      getPerformanceSummary(),
      getPerformanceTrends(50),
    ])

    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <PerformanceSummaryCards data={summary} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 space-y-4">
              <PerformanceChart
                data={trends}
                title="FPS Performance Trends"
                metric="fps"
                unit=" FPS"
                height="h-64"
                enableRealtime={true}
              />
            </div>

            <div className="col-span-3">
              <RecentSessions sessions={summary.recentActivity} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PlatformBreakdown data={summary.platformBreakdown} />

            <PerformanceChart
              data={trends}
              title="Memory Usage Trends"
              metric="memory_usage"
              unit=" MB"
              height="h-48"
              enableRealtime={true}
            />
          </div>

          {/* Enhanced Analytics Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PerformanceTiers
              tiers={summary.performanceTiers}
              totalMetrics={summary.totalMetrics}
            />

            <FpsDistribution
              distribution={summary.fpsDistribution}
              totalFpsMetrics={summary.fpsDistribution.reduce(
                (sum, item) => sum + item.count,
                0
              )}
            />

            <MemoryPressure
              pressureLevels={summary.memoryPressure}
              totalMemoryMetrics={summary.memoryPressure.reduce(
                (sum, item) => sum + item.count,
                0
              )}
            />
          </div>

          {/* Regression Detection Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Performance Regression Detection
            </h2>
            <RegressionDetection performanceData={trends} />
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading dashboard data:", error)

    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load performance data
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
