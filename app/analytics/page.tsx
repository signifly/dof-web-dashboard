import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserEngagementCorrelation } from "@/components/analytics/user-engagement-correlation"
import { DeviceBenchmarking } from "@/components/analytics/device-benchmarking"
import { ABTestingPerformance } from "@/components/analytics/ab-testing-performance"
import { RegressionDetection } from "@/components/analytics/regression-detection"
import { getPerformanceTrends, getRecentSessions } from "@/lib/performance-data"
import { Button } from "@/components/ui/button"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  // Require authentication (DashboardLayout will get user from server context)
  await requireAuth()
  try {
    const [trends, sessions] = await Promise.all([
      getPerformanceTrends(200),
      getRecentSessions(100),
    ])

    return (
      <DashboardLayout title="Advanced Analytics">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Advanced Performance Analytics
              </h2>
              <p className="text-muted-foreground">
                Deep insights into performance optimization, user engagement,
                and regression detection.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">Export Report</Button>
              <Button variant="outline">Schedule Report</Button>
            </div>
          </div>
          <section>
            <h3 className="text-xl font-semibold mb-4">
              User Engagement & Performance Correlation
            </h3>
            <UserEngagementCorrelation performanceData={trends} />
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-4">
              Device Performance Benchmarking
            </h3>
            <DeviceBenchmarking sessions={sessions} />
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-4">
              A/B Testing Performance Results
            </h3>
            <ABTestingPerformance performanceData={trends} />
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-4">
              CI/CD Regression Detection
            </h3>
            <RegressionDetection performanceData={trends} />
          </section>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading analytics data:", error)

    return (
      <DashboardLayout title="Advanced Analytics">
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load analytics data
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
