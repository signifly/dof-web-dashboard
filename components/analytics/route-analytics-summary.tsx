"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RouteAnalyticsReport } from "@/types/route-analytics"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  GitBranch,
  Route,
  Activity,
} from "lucide-react"

interface RouteAnalyticsSummaryProps {
  report: RouteAnalyticsReport
  maxItems?: number
}

export function RouteAnalyticsSummary({
  report,
  maxItems = 3,
}: RouteAnalyticsSummaryProps) {
  const topInsights = report.insights.slice(0, maxItems)
  const topCorrelations = report.route_correlations.slice(0, 2)
  const highPriorityPredictions = report.performance_predictions
    .filter(p => p.recommendation_priority === "high")
    .slice(0, 2)
  const criticalFlows = report.navigation_flows
    .filter(f => f.user_impact_score > 50)
    .slice(0, 2)

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-orange-600 bg-orange-100"
      case "low":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Route Analytics Summary</h3>
        <div className="text-sm text-muted-foreground">
          {report.processing_time_ms.toFixed(0)}ms processing •{" "}
          {report.performance_meta.sessions_processed} sessions
        </div>
      </div>

      {/* Key Insights */}
      {topInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-3 py-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium">
                    {insight.route_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={getImpactColor(insight.impact_assessment)}
                  >
                    {insight.impact_assessment}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.actionable_recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Critical Correlations */}
      {topCorrelations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Route Correlations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCorrelations.map((correlation, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-muted rounded"
              >
                <div className="text-xs">
                  <div className="font-mono">{correlation.source_route}</div>
                  <div className="text-muted-foreground">
                    ↔ {correlation.target_route}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {(correlation.correlation_strength * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {correlation.correlation_type.replace("_", " ")}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* High Priority Predictions */}
      {highPriorityPredictions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              High Priority Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityPredictions.map((prediction, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-red-50 rounded border-l-4 border-red-200"
              >
                <div className="text-xs">
                  <div className="font-medium">{prediction.route_pattern}</div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    {prediction.trend_direction === "improving" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : prediction.trend_direction === "degrading" ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Activity className="h-3 w-3 text-gray-600" />
                    )}
                    {prediction.prediction_horizon}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {prediction.predicted_performance_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">predicted</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Critical Navigation Flows */}
      {criticalFlows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4" />
              Critical Navigation Flows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalFlows.map((flow, index) => (
              <div
                key={index}
                className="p-2 bg-orange-50 rounded border-l-4 border-orange-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-medium">
                    Flow Impact: {flow.user_impact_score.toFixed(1)}
                  </div>
                  <Badge variant="outline">{flow.flow_frequency}x</Badge>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {flow.route_sequence.slice(0, 3).join(" → ")}
                  {flow.route_sequence.length > 3 &&
                    ` (+${flow.route_sequence.length - 3} more)`}
                </div>
                {flow.bottleneck_routes.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">
                      {flow.bottleneck_routes.length} bottleneck(s)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Meta */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-semibold">
                {report.route_correlations.length}
              </div>
              <div className="text-muted-foreground">Correlations</div>
            </div>
            <div>
              <div className="font-semibold">
                {report.performance_predictions.length}
              </div>
              <div className="text-muted-foreground">Predictions</div>
            </div>
            <div>
              <div className="font-semibold">
                {report.cross_route_patterns.length}
              </div>
              <div className="text-muted-foreground">Patterns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
