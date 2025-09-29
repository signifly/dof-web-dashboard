import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getEnhancedRouteAnalytics } from "@/lib/actions/enhanced-route-analytics"
import { EnhancedRouteDashboard } from "@/components/analytics/enhanced-route-dashboard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, Brain, TrendingUp } from "lucide-react"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function RoutesPage() {
  // Require authentication (DashboardLayout will get user from server context)
  await requireAuth()
  try {
    const dashboardData = await getEnhancedRouteAnalytics()

    return (
      <DashboardLayout title="Route Performance">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span>Enhanced Route Performance Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive analytics with journey insights, predictive
                models, and AI-powered optimization recommendations
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI-Powered Analytics</span>
              </div>
              <div className="mt-1">
                Data Quality:{" "}
                <span
                  className={`font-medium ${
                    dashboardData.processing_metadata.data_quality_score >= 80
                      ? "text-green-600"
                      : dashboardData.processing_metadata.data_quality_score >=
                          60
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {dashboardData.processing_metadata.data_quality_score}%
                </span>
              </div>
            </div>
          </div>

          <EnhancedRouteDashboard data={dashboardData} />
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading enhanced route dashboard:", error)

    return (
      <DashboardLayout title="Route Performance">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span>Enhanced Route Performance Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive route analytics and insights
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span>Enhanced Dashboard Temporarily Unavailable</span>
              </CardTitle>
              <CardDescription>
                Unable to load enhanced route analytics. Please check your data
                configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 mb-2">
                    Possible Issues:
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>
                      • Insufficient performance data for advanced analytics
                    </li>
                    <li>• Database connectivity issues</li>
                    <li>• Missing screen_time or session data</li>
                    <li>• Analytics engine configuration issues</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">
                    Enhanced Dashboard Features:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • <Brain className="h-3 w-3 inline mr-1" />
                      AI-powered predictive performance models
                    </li>
                    <li>
                      • <TrendingUp className="h-3 w-3 inline mr-1" />
                      User journey flow analysis with bottleneck detection
                    </li>
                    <li>
                      • <AlertCircle className="h-3 w-3 inline mr-1" />
                      Route correlation analysis and optimization
                      recommendations
                    </li>
                    <li>• Seasonal pattern detection and proactive alerts</li>
                  </ul>
                </div>

                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <strong>Technical Error:</strong>{" "}
                  {error instanceof Error
                    ? error.message
                    : "Unknown error occurred"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }
}
