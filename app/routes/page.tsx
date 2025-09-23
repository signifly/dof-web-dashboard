import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoutePerformanceOverview } from "@/components/analytics/route-performance-overview"
import { RoutePerformanceTable } from "@/components/analytics/route-performance-table"
import { RouteAnalyticsDashboard } from "@/components/analytics/route-analytics-dashboard"
import { getRoutePerformanceAnalysis } from "@/lib/route-performance-data"
import { RouteAnalyticsEngine } from "@/lib/services/route-analytics-engine"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function RoutesPage() {
  try {
    const routeAnalysis = await getRoutePerformanceAnalysis()

    // Generate advanced analytics if we have sufficient data
    let routeAnalyticsReport = null
    if (routeAnalysis.routes && routeAnalysis.routes.length > 0) {
      try {
        const analyticsEngine = new RouteAnalyticsEngine()
        routeAnalyticsReport =
          await analyticsEngine.generateAdvancedInsights(routeAnalysis)
      } catch (error) {
        console.warn("Advanced analytics unavailable:", error)
      }
    }

    return (
      <DashboardLayout title="Route Performance">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Route Performance Analysis
            </h1>
            <p className="text-muted-foreground">
              Analyze performance metrics by route to identify bottlenecks and
              optimization opportunities.
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Performance Overview</TabsTrigger>
              <TabsTrigger
                value="advanced-analytics"
                disabled={!routeAnalyticsReport}
              >
                Advanced Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <RoutePerformanceOverview analysis={routeAnalysis} />
              <RoutePerformanceTable routes={routeAnalysis.routes} />
            </TabsContent>

            <TabsContent value="advanced-analytics">
              {routeAnalyticsReport ? (
                <RouteAnalyticsDashboard report={routeAnalyticsReport} />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Advanced Analytics Unavailable
                  </h3>
                  <p className="text-gray-600">
                    Advanced route analytics require sufficient performance data
                    for analysis.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading route performance data:", error)

    return (
      <DashboardLayout title="Route Performance">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Route Performance Analysis
            </h1>
            <p className="text-muted-foreground">
              Analyze performance metrics by route to identify bottlenecks and
              optimization opportunities.
            </p>
          </div>

          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load route performance data
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                Make sure your database contains screen_time metrics for route
                analysis.
              </p>
              <p className="text-sm text-gray-500">
                Screen time metrics should include route information with
                segments, routeName, routePath, and screenStartTime.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Error:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }
}
