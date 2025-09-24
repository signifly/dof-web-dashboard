"use client"

import { RoutePerformancePrediction } from "@/types/route-analytics"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  Brain,
} from "lucide-react"

interface PredictionTimelineProps {
  predictions: RoutePerformancePrediction[]
  timeRange?: "1d" | "7d" | "30d"
  metricFilter?: string[]
  showConfidenceIntervals?: boolean
}

export function PredictionTimeline({
  predictions,
  timeRange = "7d",
  metricFilter,
  showConfidenceIntervals = true,
}: PredictionTimelineProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "1d" | "7d" | "30d"
  >(timeRange)
  const [selectedRoute, setSelectedRoute] = useState<string>("all")

  const filteredPredictions = predictions
    .filter(p => p.prediction_horizon === selectedTimeRange)
    .filter(p => selectedRoute === "all" || p.route_pattern === selectedRoute)
    .sort((a, b) => {
      // Sort by priority first, then by predicted performance
      if (
        a.recommendation_priority === "high" &&
        b.recommendation_priority !== "high"
      )
        return -1
      if (
        b.recommendation_priority === "high" &&
        a.recommendation_priority !== "high"
      )
        return 1
      if (
        a.recommendation_priority === "medium" &&
        b.recommendation_priority === "low"
      )
        return -1
      if (
        b.recommendation_priority === "medium" &&
        a.recommendation_priority === "low"
      )
        return 1
      return a.predicted_performance_score - b.predicted_performance_score // Show concerning predictions first
    })

  const uniqueRoutes = Array.from(
    new Set(predictions.map(p => p.route_pattern))
  )

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "degrading":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      default:
        return "secondary"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (predictions.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Performance Prediction Timeline</CardTitle>
          <CardDescription>
            Forecasted performance trends with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No performance predictions available
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Predictions require sufficient historical performance data for
              analysis
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance Prediction Timeline
          <Badge variant="outline" className="text-xs">
            {filteredPredictions.length} predictions
          </Badge>
        </CardTitle>
        <CardDescription>
          Forecasted performance trends with confidence intervals and ML-based
          insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <Select
            value={selectedTimeRange}
            onValueChange={(value: "1d" | "7d" | "30d") =>
              setSelectedTimeRange(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {uniqueRoutes.map(route => (
                <SelectItem key={route} value={route}>
                  {route.replace(/^\//, "") || "Home"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredPredictions.slice(0, 8).map((prediction, index) => (
            <div
              key={`${prediction.route_pattern}-${index}`}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {prediction.route_pattern.replace(/^\//, "") || "Home"}
                    </h4>
                    {getTrendIcon(prediction.trend_direction)}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span>{selectedTimeRange} forecast</span>
                    <span>•</span>
                    <span>
                      {Math.round(prediction.forecast_accuracy * 100)}% accuracy
                    </span>
                    <span>•</span>
                    <span className="capitalize">
                      {prediction.prediction_model.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      getPriorityColor(
                        prediction.recommendation_priority
                      ) as any
                    }
                  >
                    {prediction.recommendation_priority}
                  </Badge>
                  <Badge
                    variant={
                      prediction.trend_direction === "improving"
                        ? "default"
                        : prediction.trend_direction === "degrading"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {prediction.trend_direction}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white border rounded-lg">
                  <div
                    className={`text-2xl font-bold mb-1 ${getPerformanceColor(prediction.predicted_performance_score)}`}
                  >
                    {Math.round(prediction.predicted_performance_score)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Predicted Score
                  </div>
                </div>

                {showConfidenceIntervals && (
                  <div className="text-center p-3 bg-white border rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {Math.round(prediction.confidence_interval[0])} -{" "}
                      {Math.round(prediction.confidence_interval[1])}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confidence Range
                    </div>
                    <Progress
                      value={
                        ((prediction.confidence_interval[1] -
                          prediction.confidence_interval[0]) /
                          100) *
                          50 +
                        50
                      }
                      className="h-1 mt-1"
                    />
                  </div>
                )}

                <div className="text-center p-3 bg-white border rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {Math.round(prediction.forecast_accuracy * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model Accuracy
                  </div>
                  <Progress
                    value={prediction.forecast_accuracy * 100}
                    className="h-1 mt-1"
                  />
                </div>
              </div>

              {/* Prediction Insights */}
              <div className="space-y-2">
                {prediction.predicted_performance_score < 50 && (
                  <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-red-800">
                        Performance Alert
                      </div>
                      <div className="text-red-600">
                        Predicted score below critical threshold. Immediate
                        attention recommended.
                      </div>
                    </div>
                  </div>
                )}

                {prediction.trend_direction === "degrading" &&
                  prediction.predicted_performance_score > 50 && (
                    <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <TrendingDown className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-800">
                          Declining Trend
                        </div>
                        <div className="text-yellow-600">
                          Performance is predicted to decline. Consider
                          proactive optimization.
                        </div>
                      </div>
                    </div>
                  )}

                {prediction.trend_direction === "improving" && (
                  <div className="flex items-start space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-green-800">
                        Improving Trend
                      </div>
                      <div className="text-green-600">
                        Performance is predicted to improve. Recent
                        optimizations may be working.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contributing Factors */}
              {prediction.contributing_factors.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-3 w-3 text-gray-500" />
                    <div className="text-xs font-medium text-gray-600">
                      Key Factors:
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {prediction.contributing_factors
                      .slice(0, 4)
                      .map((factor, factorIndex) => (
                        <Badge
                          key={factorIndex}
                          variant="outline"
                          className="text-xs"
                        >
                          {factor}
                        </Badge>
                      ))}
                    {prediction.contributing_factors.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{prediction.contributing_factors.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">
                {
                  filteredPredictions.filter(
                    p => p.recommendation_priority === "high"
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {
                  filteredPredictions.filter(
                    p => p.trend_direction === "degrading"
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                Declining Trends
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(
                  (filteredPredictions.reduce(
                    (sum, p) => sum + p.forecast_accuracy,
                    0
                  ) /
                    filteredPredictions.length) *
                    100
                )}
                %
              </div>
              <div className="text-xs text-muted-foreground">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
