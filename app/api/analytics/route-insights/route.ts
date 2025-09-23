import { NextRequest, NextResponse } from "next/server"
import { RouteAnalyticsEngine } from "@/lib/services/route-analytics-engine"
import { getRoutePerformanceAnalysis } from "@/lib/route-performance-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeCorrelations =
      searchParams.get("includeCorrelations") !== "false"
    const includePredictions =
      searchParams.get("includePredictions") !== "false"
    const includeFlows = searchParams.get("includeFlows") !== "false"
    const includePatterns = searchParams.get("includePatterns") !== "false"

    // Get route performance data
    const routeData = await getRoutePerformanceAnalysis()

    if (!routeData.routes || routeData.routes.length === 0) {
      return NextResponse.json(
        { error: "No route performance data available for analysis" },
        { status: 404 }
      )
    }

    // Generate advanced route analytics
    const analyticsEngine = new RouteAnalyticsEngine()
    const report = await analyticsEngine.generateAdvancedInsights(routeData)

    // Filter report based on query parameters to reduce payload size
    const filteredReport = {
      ...report,
      route_correlations: includeCorrelations ? report.route_correlations : [],
      performance_predictions: includePredictions
        ? report.performance_predictions
        : [],
      navigation_flows: includeFlows ? report.navigation_flows : [],
      cross_route_patterns: includePatterns ? report.cross_route_patterns : [],
    }

    return NextResponse.json(filteredReport)
  } catch (error) {
    console.error("Error generating route analytics:", error)

    return NextResponse.json(
      {
        error: "Failed to generate route analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
