"use client"

import { RouteAnalyticsDashboard } from "@/lib/actions/enhanced-route-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JourneyFlowChart } from "./journey-flow-chart"
import { PredictionTimeline } from "./prediction-timeline"
import { CorrelationHeatmap } from "./correlation-heatmap"
import { ProactiveRecommendationsPanel } from "./proactive-recommendations-panel"
import { RoutePerformanceOverview } from "./route-performance-overview"
import { RoutePerformanceTable } from "./route-performance-table"
import {
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  ChevronDown,
  FileText,
} from "lucide-react"
import { useState } from "react"

interface EnhancedRouteDashboardProps {
  data: RouteAnalyticsDashboard
}

export function EnhancedRouteDashboard({ data }: EnhancedRouteDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedJourneyPattern, setSelectedJourneyPattern] = useState<string>()

  const generateCSV = (data: RouteAnalyticsDashboard): string => {
    const csvSections: string[] = []

    // Route Performance Summary
    if (
      data.route_performance.routes &&
      data.route_performance.routes.length > 0
    ) {
      csvSections.push("Route Performance Summary")
      csvSections.push(
        "Route,Sessions,Devices,Avg FPS,Avg Memory,Avg CPU,Performance Score,Risk Level,Trend"
      )

      data.route_performance.routes.forEach(route => {
        csvSections.push(
          `"${route.routeName}",${route.totalSessions},${route.uniqueDevices},${route.avgFps.toFixed(1)},${route.avgMemory.toFixed(1)},${route.avgCpu.toFixed(1)},${route.performanceScore},${route.riskLevel},${route.performanceTrend}`
        )
      })
      csvSections.push("")
    }

    // Journey Patterns
    if (data.journey_patterns.length > 0) {
      csvSections.push("Journey Patterns")
      csvSections.push(
        "Pattern ID,Routes,Completion Rate,Avg Duration,Impact Score,Optimization Potential"
      )

      data.journey_patterns.forEach(pattern => {
        csvSections.push(
          `"${pattern.pattern_id}","${pattern.route_sequence.join(" → ")}",${(pattern.completion_rate * 100).toFixed(1)}%,${Math.round(pattern.avg_journey_duration / 1000)}s,${pattern.user_impact_score.toFixed(1)},${pattern.optimization_potential.toFixed(1)}%`
        )
      })
      csvSections.push("")
    }

    // Performance Predictions
    if (data.performance_predictions.length > 0) {
      csvSections.push("Performance Predictions")
      csvSections.push(
        "Route,Predicted Score,Confidence Min,Confidence Max,Horizon,Trend,Priority,Accuracy"
      )

      data.performance_predictions.forEach(prediction => {
        csvSections.push(
          `"${prediction.route_pattern}",${Math.round(prediction.predicted_performance_score)},${Math.round(prediction.confidence_interval[0])},${Math.round(prediction.confidence_interval[1])},${prediction.prediction_horizon},${prediction.trend_direction},${prediction.recommendation_priority},${(prediction.forecast_accuracy * 100).toFixed(1)}%`
        )
      })
      csvSections.push("")
    }

    // Correlation Analysis
    if (data.correlation_analysis.length > 0) {
      csvSections.push("Route Correlations")
      csvSections.push(
        "Source Route,Target Route,Correlation Strength,Impact,Confidence,Significance"
      )

      data.correlation_analysis.forEach(correlation => {
        csvSections.push(
          `"${correlation.source_route}","${correlation.target_route}",${correlation.correlation_strength.toFixed(3)},${correlation.performance_impact},${correlation.confidence_level.toFixed(3)},${correlation.statistical_significance.toFixed(3)}`
        )
      })
      csvSections.push("")
    }

    // Metadata
    csvSections.push("Export Metadata")
    csvSections.push(
      "Generated At,Processing Time (ms),Data Quality Score,Sessions Analyzed,Routes Analyzed"
    )
    csvSections.push(
      `"${data.processing_metadata.generated_at}",${data.processing_metadata.processing_time_ms},${data.processing_metadata.data_quality_score},${data.processing_metadata.sessions_analyzed},${data.processing_metadata.routes_analyzed}`
    )

    return csvSections.join("\n")
  }

  const handleExport = (format: "json" | "csv" = "json") => {
    try {
      let exportData: string
      let mimeType: string
      let fileExtension: string

      if (format === "csv") {
        exportData = generateCSV(data)
        mimeType = "text/csv"
        fileExtension = "csv"
      } else {
        const jsonData = {
          ...data,
          export_timestamp: new Date().toISOString(),
          export_format: "json",
          export_version: "1.0",
        }
        exportData = JSON.stringify(jsonData, null, 2)
        mimeType = "application/json"
        fileExtension = "json"
      }

      const blob = new Blob([exportData], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `route-analytics-${new Date().toISOString().split("T")[0]}.${fileExtension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // In a real implementation, this would trigger a server action to refresh data
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Helper function to format processing time
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Get quality score color
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div
              className={`text-lg font-bold ${getQualityColor(data.processing_metadata.data_quality_score)}`}
            >
              {data.processing_metadata.data_quality_score}%
            </div>
            <div className="text-xs text-muted-foreground">Data Quality</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {data.processing_metadata.sessions_analyzed}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {data.processing_metadata.routes_analyzed}
            </div>
            <div className="text-xs text-muted-foreground">Routes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatProcessingTime(
                data.processing_metadata.processing_time_ms
              )}
            </div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Predictions</span>
          </TabsTrigger>
          <TabsTrigger value="journeys" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Journeys</span>
          </TabsTrigger>
          <TabsTrigger
            value="correlations"
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Correlations</span>
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Recommendations</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoutePerformanceOverview analysis={data.route_performance} />

            {/* Quick Insights Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analytics Summary</CardTitle>
                <CardDescription>
                  Key insights from enhanced analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Journey Patterns
                    </span>
                    <Badge variant="outline">
                      {data.journey_patterns.length} detected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Predictions Available
                    </span>
                    <Badge variant="outline">
                      {data.performance_predictions.length} routes
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Route Correlations
                    </span>
                    <Badge variant="outline">
                      {data.correlation_analysis.length} found
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Proactive Recommendations
                    </span>
                    <Badge
                      variant={
                        data.proactive_recommendations.length > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {data.proactive_recommendations.length} available
                    </Badge>
                  </div>

                  {data.seasonal_insights.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Seasonal Patterns
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {data.seasonal_insights.length} patterns
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <RoutePerformanceTable routes={data.route_performance.routes} />
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6">
            <PredictionTimeline
              predictions={data.performance_predictions}
              showConfidenceIntervals={true}
            />

            {/* Seasonal Insights */}
            {data.seasonal_insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Seasonal Performance Patterns</span>
                    <Badge variant="outline" className="text-xs">
                      {data.seasonal_insights.length} patterns
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Identified seasonal trends and their impact on route
                    performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.seasonal_insights
                      .slice(0, 6)
                      .map((pattern, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm capitalize">
                                {pattern.pattern_type} Pattern
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pattern.metric_type} •{" "}
                                {Math.round(pattern.confidence * 100)}%
                                confidence
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {pattern.detection_method}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Next Peak:
                              </span>
                              <span>
                                {new Date(
                                  pattern.next_predicted_peak
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Pattern Strength:
                              </span>
                              <span>
                                {Math.round(pattern.seasonal_strength * 100)}%
                              </span>
                            </div>
                            {pattern.route_pattern && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Route:
                                </span>
                                <span className="font-medium">
                                  {pattern.route_pattern.replace(/^\//, "")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* User Journeys Tab */}
        <TabsContent value="journeys" className="space-y-6">
          <JourneyFlowChart
            journeyPatterns={data.journey_patterns}
            selectedPattern={selectedJourneyPattern}
            onPatternSelect={setSelectedJourneyPattern}
            showPerformanceOverlay={true}
          />
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="space-y-6">
          <CorrelationHeatmap
            correlations={data.correlation_analysis}
            routes={
              data.route_performance.routes?.map((r: any) => r.routePattern) ||
              []
            }
            interactive={true}
          />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <ProactiveRecommendationsPanel
            recommendations={data.proactive_recommendations}
            routeContext={data.route_performance}
            showImplementationGuidance={true}
          />
        </TabsContent>
      </Tabs>

      {/* Data Freshness Footer */}
      <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t">
        <div>
          Last updated:{" "}
          {new Date(data.processing_metadata.generated_at).toLocaleString()}
        </div>
        <div className="flex items-center space-x-4">
          <span>
            Processing:{" "}
            {formatProcessingTime(data.processing_metadata.processing_time_ms)}
          </span>
          <span>
            Data Quality: {data.processing_metadata.data_quality_score}%
          </span>
          {data.advanced_analytics && (
            <span>
              Analytics:{" "}
              {data.advanced_analytics.performance_meta
                ?.meets_performance_target
                ? "✓"
                : "⚠"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
