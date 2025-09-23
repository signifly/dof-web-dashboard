"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RouteAnalyticsReport } from "@/types/route-analytics"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Route,
  Brain,
  AlertTriangle,
  Target,
  GitBranch,
  Clock,
} from "lucide-react"

interface RouteAnalyticsDashboardProps {
  report: RouteAnalyticsReport
}

export function RouteAnalyticsDashboard({
  report,
}: RouteAnalyticsDashboardProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCorrelationColor = (strength: number) => {
    if (strength > 0.7) return "text-red-600 bg-red-100"
    if (strength > 0.5) return "text-orange-600 bg-orange-100"
    if (strength > 0.3) return "text-yellow-600 bg-yellow-100"
    return "text-green-600 bg-green-100"
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-orange-600 bg-orange-100"
      case "low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Performance Metrics */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Advanced Route Analytics</h2>
          <p className="text-muted-foreground">
            Generated {formatTimestamp(report.generated_at)} • Processing time:{" "}
            {report.processing_time_ms.toFixed(0)}ms
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">
              {report.performance_meta.sessions_processed}
            </div>
            <div className="text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {report.performance_meta.routes_analyzed}
            </div>
            <div className="text-muted-foreground">Routes</div>
          </div>
          <div className="text-center">
            <div
              className={`font-semibold ${report.performance_meta.meets_performance_target ? "text-green-600" : "text-red-600"}`}
            >
              {report.performance_meta.meets_performance_target ? "✓" : "✗"}
            </div>
            <div className="text-muted-foreground">Performance</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="flows">Navigation</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {report.insights.map((insight, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <CardTitle className="text-lg">
                        {insight.route_name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={getImpactColor(insight.impact_assessment)}
                      >
                        {insight.impact_assessment} impact
                      </Badge>
                      <Badge variant="secondary">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insight.route_pattern}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Type:</span>{" "}
                      {insight.insight_type.replace("_", " ")}
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-lg">
                      {insight.actionable_recommendation}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <div className="grid gap-4">
            {report.route_correlations.map((correlation, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <CardTitle className="text-lg">
                        Route Correlation
                      </CardTitle>
                    </div>
                    <Badge
                      className={getCorrelationColor(
                        correlation.correlation_strength
                      )}
                    >
                      {(correlation.correlation_strength * 100).toFixed(0)}%
                      strength
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Source:</span>
                      <span className="font-mono">
                        {correlation.source_route}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target:</span>
                      <span className="font-mono">
                        {correlation.target_route}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Impact:</span>
                      <Badge
                        variant="outline"
                        className={
                          correlation.performance_impact === "positive"
                            ? "text-green-600 bg-green-100"
                            : correlation.performance_impact === "negative"
                              ? "text-red-600 bg-red-100"
                              : "text-gray-600 bg-gray-100"
                        }
                      >
                        {correlation.performance_impact}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <span className="capitalize">
                        {correlation.correlation_type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sample Size:</span>
                      <span>{correlation.sample_size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Significance:</span>
                      <span>
                        {(correlation.statistical_significance * 100).toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {report.performance_predictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <CardTitle className="text-lg">
                        Performance Prediction
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={getPriorityColor(
                          prediction.recommendation_priority
                        )}
                      >
                        {prediction.recommendation_priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {prediction.prediction_horizon}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {prediction.route_pattern}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Predicted Score:</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={prediction.predicted_performance_score}
                          className="w-20"
                        />
                        <span className="text-sm font-mono">
                          {prediction.predicted_performance_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence Interval:</span>
                      <span className="font-mono">
                        [{prediction.confidence_interval[0].toFixed(1)},{" "}
                        {prediction.confidence_interval[1].toFixed(1)}]
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trend:</span>
                      <div className="flex items-center gap-1">
                        {prediction.trend_direction === "improving" ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : prediction.trend_direction === "degrading" ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Activity className="h-3 w-3 text-gray-600" />
                        )}
                        <span className="capitalize">
                          {prediction.trend_direction}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Forecast Accuracy:</span>
                      <span>
                        {(prediction.forecast_accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    {prediction.contributing_factors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">
                          Contributing Factors:
                        </span>
                        <div className="text-xs space-y-1">
                          {prediction.contributing_factors.map((factor, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <div className="grid gap-4">
            {report.navigation_flows.map((flow, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      <CardTitle className="text-lg">Navigation Flow</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {flow.flow_frequency} occurrences
                      </Badge>
                      <Badge
                        className={
                          flow.user_impact_score > 50
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }
                      >
                        {flow.user_impact_score.toFixed(1)} impact
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium">
                        Route Sequence:
                      </span>
                      <div className="text-xs font-mono mt-1 p-2 bg-muted rounded">
                        {flow.route_sequence.join(" → ")}
                      </div>
                    </div>

                    {flow.bottleneck_routes.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">
                          Bottlenecks:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flow.bottleneck_routes.map((route, i) => (
                            <Badge
                              key={i}
                              variant="destructive"
                              className="text-xs"
                            >
                              {route}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Optimization Potential:
                        </span>
                        <div className="font-mono">
                          {flow.optimization_potential.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Avg Transition:
                        </span>
                        <div className="font-mono">
                          {(flow.avg_transition_time / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>

                    {flow.performance_degradation_points.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">
                          Performance Drops:
                        </span>
                        <div className="space-y-1 mt-1">
                          {flow.performance_degradation_points
                            .slice(0, 3)
                            .map((point, i) => (
                              <div
                                key={i}
                                className="text-xs flex justify-between items-center p-2 bg-muted rounded"
                              >
                                <span className="font-mono">
                                  {point.from_route} → {point.to_route}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>
                                    -{point.performance_drop.toFixed(1)}%
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      point.severity === "critical"
                                        ? "text-red-600 bg-red-100"
                                        : point.severity === "high"
                                          ? "text-orange-600 bg-orange-100"
                                          : point.severity === "medium"
                                            ? "text-yellow-600 bg-yellow-100"
                                            : "text-blue-600 bg-blue-100"
                                    }
                                  >
                                    {point.severity}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4">
            {report.cross_route_patterns.map((pattern, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <CardTitle className="text-lg">
                        Cross-Route Pattern
                      </CardTitle>
                    </div>
                    <Badge
                      className={
                        pattern.pattern_strength > 0.7
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      }
                    >
                      {(pattern.pattern_strength * 100).toFixed(0)}% strength
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {pattern.pattern_type.replace("_", " ")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium">
                        Affected Routes:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.affected_routes.map((route, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {route}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Detection Confidence:</span>
                      <span>
                        {(pattern.detection_confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-sm font-medium">
                        Suggested Mitigation:
                      </span>
                      <div className="space-y-1 mt-1">
                        {pattern.suggested_mitigation.map((suggestion, i) => (
                          <div
                            key={i}
                            className="text-xs flex items-start gap-2 p-2 bg-muted rounded"
                          >
                            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5"></div>
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
