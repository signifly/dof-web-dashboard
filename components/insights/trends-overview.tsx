"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendAnalysis } from "@/types/insights"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Cpu,
  HardDrive,
  BarChart3,
} from "lucide-react"

interface TrendsOverviewProps {
  trends: {
    fps_trend: TrendAnalysis
    memory_trend: TrendAnalysis
    cpu_trend: TrendAnalysis
  }
}

export function TrendsOverview({ trends }: TrendsOverviewProps) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />
      case "down":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = (direction: string, metricType: string) => {
    // For FPS, up is good; for memory/cpu/loading, down is good
    const isGoodTrend =
      metricType === "fps" ? direction === "up" : direction === "down"

    if (direction === "stable") return "text-gray-600"
    return isGoodTrend ? "text-green-600" : "text-red-600"
  }

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case "high":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">High</Badge>
        )
      case "medium":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            Low
          </Badge>
        )
      default:
        return <Badge variant="secondary">None</Badge>
    }
  }

  const formatSlope = (slope: number, metricType: string) => {
    const unit =
      metricType === "fps"
        ? "fps"
        : metricType === "memory"
          ? "MB"
          : metricType === "cpu"
            ? "%"
            : ""

    return `${slope > 0 ? "+" : ""}${slope.toFixed(2)} ${unit}/period`
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const formatForecast = (forecast: number | undefined, metricType: string) => {
    if (forecast === undefined) return "N/A"

    const unit =
      metricType === "fps"
        ? " fps"
        : metricType === "memory"
          ? " MB"
          : metricType === "cpu"
            ? "%"
            : ""

    return `${forecast.toFixed(1)}${unit}`
  }

  const trendItems = [
    {
      name: "FPS Performance",
      icon: <Activity className="h-5 w-5" />,
      trend: trends.fps_trend,
      metricType: "fps",
    },
    {
      name: "Memory Usage",
      icon: <HardDrive className="h-5 w-5" />,
      trend: trends.memory_trend,
      metricType: "memory",
    },
    {
      name: "CPU Usage",
      icon: <Cpu className="h-5 w-5" />,
      trend: trends.cpu_trend,
      metricType: "cpu",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Trends Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {trendItems.map(item => (
            <div
              key={item.metricType}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <h4 className="font-medium text-sm">{item.name}</h4>
                </div>
                <div
                  className={`flex items-center gap-1 ${getTrendColor(item.trend.direction, item.metricType)}`}
                >
                  {getTrendIcon(item.trend.direction)}
                  <span className="text-sm font-medium capitalize">
                    {item.trend.direction}
                  </span>
                </div>
              </div>

              {/* Trend Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slope:</span>
                  <span className="font-mono">
                    {formatSlope(item.trend.slope, item.metricType)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-mono">
                    {formatConfidence(item.trend.confidence)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">R² Value:</span>
                  <span className="font-mono">
                    {item.trend.r_squared.toFixed(3)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Points:</span>
                  <span className="font-mono">{item.trend.data_points}</span>
                </div>

                {item.trend.forecast !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forecast:</span>
                    <span className="font-mono">
                      {formatForecast(item.trend.forecast, item.metricType)}
                    </span>
                  </div>
                )}
              </div>

              {/* Significance and Time Period */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Significance:
                  </span>
                  {getSignificanceBadge(item.trend.significance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.trend.time_period}
                </div>
              </div>

              {/* Trend Interpretation */}
              <div className="bg-muted/30 rounded p-2">
                <div className="text-xs text-muted-foreground">
                  {item.trend.direction === "stable" && (
                    <span>
                      Performance is stable with no significant trend detected.
                    </span>
                  )}
                  {item.trend.direction === "up" &&
                    item.metricType === "fps" && (
                      <span className="text-green-700">
                        FPS is improving over time - excellent trend!
                      </span>
                    )}
                  {item.trend.direction === "down" &&
                    item.metricType === "fps" && (
                      <span className="text-red-700">
                        FPS is declining - performance optimization needed.
                      </span>
                    )}
                  {item.trend.direction === "up" &&
                    item.metricType !== "fps" && (
                      <span className="text-red-700">
                        {item.name} is increasing - optimization recommended.
                      </span>
                    )}
                  {item.trend.direction === "down" &&
                    item.metricType !== "fps" && (
                      <span className="text-green-700">
                        {item.name} is decreasing - good optimization trend!
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Trend Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Trend Summary</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Analysis period: {trends.fps_trend.time_period} across{" "}
              {trends.fps_trend.data_points} data points
            </p>
            <p>
              Overall performance trend:{" "}
              {
                [
                  trends.fps_trend,
                  trends.memory_trend,
                  trends.cpu_trend,
                ].filter(t => t.significance !== "low").length
              }{" "}
              significant trends detected
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
