"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoutePerformanceAnalysis } from "@/types/route-performance"
import { Activity, Route, AlertTriangle, CheckCircle } from "lucide-react"

interface RoutePerformanceOverviewProps {
  analysis: RoutePerformanceAnalysis
}

export function RoutePerformanceOverview({
  analysis,
}: RoutePerformanceOverviewProps) {
  const { routes, summary, appAverages } = analysis

  const riskLevelCounts = {
    low: routes.filter(r => r.riskLevel === "low").length,
    medium: routes.filter(r => r.riskLevel === "medium").length,
    high: routes.filter(r => r.riskLevel === "high").length,
  }

  const trendCounts = {
    improving: routes.filter(r => r.performanceTrend === "improving").length,
    stable: routes.filter(r => r.performanceTrend === "stable").length,
    degrading: routes.filter(r => r.performanceTrend === "degrading").length,
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalSessions} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FPS</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appAverages.avgFps}</div>
            <p className="text-xs text-muted-foreground">
              App-wide average performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appAverages.avgMemory} MB</div>
            <p className="text-xs text-muted-foreground">
              Average memory consumption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appAverages.avgCpu}%</div>
            <p className="text-xs text-muted-foreground">
              Average CPU utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Level & Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Risk</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-100 rounded-full h-2 w-24">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(riskLevelCounts.low / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="secondary">{riskLevelCounts.low}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium Risk</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-yellow-100 rounded-full h-2 w-24">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${(riskLevelCounts.medium / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="secondary">{riskLevelCounts.medium}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">High Risk</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-red-100 rounded-full h-2 w-24">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(riskLevelCounts.high / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="destructive">{riskLevelCounts.high}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Improving</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-100 rounded-full h-2 w-24">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(trendCounts.improving / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="secondary">{trendCounts.improving}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stable</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-100 rounded-full h-2 w-24">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(trendCounts.stable / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="secondary">{trendCounts.stable}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Degrading</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-red-100 rounded-full h-2 w-24">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(trendCounts.degrading / summary.totalRoutes) * 100}%`,
                    }}
                  />
                </div>
                <Badge variant="destructive">{trendCounts.degrading}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Problem Routes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              Best Performing Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.bestPerformingRoutes.length > 0 ? (
              <div className="space-y-3">
                {summary.bestPerformingRoutes.map((route, index) => (
                  <div
                    key={`${route.routeName}-${route.routePattern}`}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {route.routeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {route.routePattern}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {route.performanceScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {route.avgFps} FPS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No route data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              Worst Performing Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.worstPerformingRoutes.length > 0 ? (
              <div className="space-y-3">
                {summary.worstPerformingRoutes.map((route, index) => (
                  <div
                    key={`${route.routeName}-${route.routePattern}`}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {route.routeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {route.routePattern}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {route.performanceScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {route.avgFps} FPS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No route data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
