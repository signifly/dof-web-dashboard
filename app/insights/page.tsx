import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InsightsDashboard } from "@/components/insights/insights-dashboard"
import { PerformanceInsightsEngine } from "@/lib/services/insights-engine"

export const dynamic = "force-dynamic"

export default async function InsightsPage() {
  try {
    // Generate performance insights
    const insightsEngine = new PerformanceInsightsEngine()
    const performanceReport = await insightsEngine.generateInsights()

    return (
      <DashboardLayout title="Performance Insights">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Performance Insights
            </h1>
            <p className="text-muted-foreground">
              Comprehensive performance analysis and optimization
              recommendations.
            </p>
          </div>

          <InsightsDashboard report={performanceReport} />
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error generating insights:", error)

    return (
      <DashboardLayout title="Performance Insights">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Unable to Generate Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              There was an error analyzing performance data. Please check that
              performance data is available and try again.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg max-w-md">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }
}
