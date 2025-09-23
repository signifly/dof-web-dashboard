import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { InsightsDashboard } from "@/components/insights/insights-dashboard"
import { RouteAnalyticsDashboard } from "@/components/analytics/route-analytics-dashboard"
import { PerformanceInsightsEngine } from "@/lib/services/insights-engine"
import { RouteAnalyticsEngine } from "@/lib/services/route-analytics-engine"
import { getRoutePerformanceAnalysis } from "@/lib/route-performance-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function InsightsPage() {
  try {
    // Generate both types of insights in parallel
    const [performanceReport, routeAnalyticsReport] = await Promise.all([
      (async () => {
        const insightsEngine = new PerformanceInsightsEngine()
        return await insightsEngine.generateInsights()
      })(),
      (async () => {
        try {
          const routeData = await getRoutePerformanceAnalysis()
          if (routeData.routes && routeData.routes.length > 0) {
            const analyticsEngine = new RouteAnalyticsEngine()
            return await analyticsEngine.generateAdvancedInsights(routeData)
          }
          return null
        } catch (error) {
          console.warn("Route analytics unavailable:", error)
          return null
        }
      })(),
    ])

    return (
      <DashboardLayout title="Performance Insights">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Performance Insights
            </h1>
            <p className="text-muted-foreground">
              Comprehensive performance analysis and route-level insights.
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Performance Overview</TabsTrigger>
              <TabsTrigger
                value="route-analytics"
                disabled={!routeAnalyticsReport}
              >
                Route Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InsightsDashboard report={performanceReport} />
            </TabsContent>

            <TabsContent value="route-analytics">
              {routeAnalyticsReport ? (
                <RouteAnalyticsDashboard report={routeAnalyticsReport} />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Route Analytics Unavailable
                  </h3>
                  <p className="text-gray-600">
                    Route performance data is required for advanced analytics.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
