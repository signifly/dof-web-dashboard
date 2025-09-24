"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PerformanceInsight } from "@/types/insights"
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Clock,
  Activity,
  Cpu,
  HardDrive,
  Zap,
} from "lucide-react"

interface InsightsListProps {
  insights: PerformanceInsight[]
}

export function InsightsList({ insights }: InsightsListProps) {
  const getInsightIcon = (type: string, category: string) => {
    switch (type) {
      case "trend_decline":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "trend_improvement":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "anomaly":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "opportunity":
        return <Lightbulb className="h-4 w-4 text-blue-600" />
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return <Activity className="h-3 w-3" />
      case "memory":
        return <HardDrive className="h-3 w-3" />
      case "cpu":
        return <Cpu className="h-3 w-3" />
      case "loading":
        return <Clock className="h-3 w-3" />
      case "rendering":
        return <Zap className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 hover:bg-red-600 text-white"
      case "high":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600 text-white"
      case "low":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Recently"
    }
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No performance insights available at this time.</p>
              <p className="text-sm mt-1">
                Check back after more data is collected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Insights
          <Badge variant="secondary" className="ml-2">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {insights.map(insight => (
            <div
              key={insight.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type, insight.category)}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(insight.severity)}>
                    {insight.severity}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(insight.category)}
                    <span className="capitalize">{insight.category}</span>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-md border ${getImpactColor(insight.impact)}`}
                  >
                    {insight.impact} impact
                  </div>

                  {insight.data_context.affected_sessions && (
                    <div className="text-muted-foreground">
                      {insight.data_context.affected_sessions} session
                      {insight.data_context.affected_sessions !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>
                    Confidence: {formatConfidence(insight.confidence)}
                  </span>
                  <span>{formatTimestamp(insight.detected_at)}</span>
                </div>
              </div>

              {/* Data Context */}
              {insight.data_context && (
                <div className="bg-muted/30 rounded p-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Details
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        Current Value:
                      </span>
                      <div className="font-mono">
                        {typeof insight.data_context.value === "number"
                          ? insight.data_context.value.toFixed(1)
                          : insight.data_context.value}
                      </div>
                    </div>

                    {insight.data_context.baseline !== 0 && (
                      <div>
                        <span className="text-muted-foreground">Baseline:</span>
                        <div className="font-mono">
                          {insight.data_context.baseline.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {insight.data_context.deviation !== 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Deviation:
                        </span>
                        <div
                          className={`font-mono ${
                            insight.data_context.deviation > 0
                              ? insight.category === "performance"
                                ? "text-green-600"
                                : "text-red-600"
                              : insight.category === "performance"
                                ? "text-red-600"
                                : "text-green-600"
                          }`}
                        >
                          {insight.data_context.deviation > 0 ? "+" : ""}
                          {insight.data_context.deviation.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
