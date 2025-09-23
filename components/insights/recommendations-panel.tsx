"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PerformanceRecommendation } from "@/types/insights"
import {
  Lightbulb,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Activity,
  Cpu,
  HardDrive,
  Zap,
} from "lucide-react"

interface RecommendationsPanelProps {
  recommendations: PerformanceRecommendation[]
}

export function RecommendationsPanel({
  recommendations,
}: RecommendationsPanelProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
      case "rendering":
        return <Activity className="h-3 w-3" />
      case "memory":
        return <HardDrive className="h-3 w-3" />
      case "cpu":
        return <Cpu className="h-3 w-3" />
      case "loading":
        return <Clock className="h-3 w-3" />
      default:
        return <Lightbulb className="h-3 w-3" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500 hover:bg-red-600 text-white"
      case "medium":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "low":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low":
        return "text-green-700 bg-green-50 border-green-200"
      case "medium":
        return "text-orange-700 bg-orange-50 border-orange-200"
      case "high":
        return "text-red-700 bg-red-50 border-red-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "dismissed":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "text-red-600 font-semibold"
    if (priority >= 3) return "text-orange-600 font-medium"
    if (priority >= 2) return "text-blue-600"
    return "text-gray-600"
  }

  const formatCreatedAt = (dateString: string) => {
    try {
      const date = new Date(dateString)
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

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations available at this time.</p>
            <p className="text-sm mt-1">Performance analysis in progress...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Recommendations
          <Badge variant="secondary" className="ml-2">
            {recommendations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map(recommendation => (
            <div
              key={recommendation.id}
              className="border rounded-lg p-4 space-y-4 hover:bg-muted/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(recommendation.status)}
                  <h4 className="font-medium text-sm">
                    {recommendation.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-medium ${getPriorityColor(recommendation.priority_score)}`}
                  >
                    Priority: {recommendation.priority_score.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.description}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {getCategoryIcon(recommendation.category)}
                  <span className="text-xs capitalize">
                    {recommendation.category}
                  </span>
                </div>

                <Badge className={getImpactColor(recommendation.impact)}>
                  {recommendation.impact} impact
                </Badge>

                <div
                  className={`px-2 py-1 rounded-md border text-xs ${getEffortColor(recommendation.effort)}`}
                >
                  {recommendation.effort} effort
                </div>

                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {recommendation.implementation_time}
                </div>
              </div>

              {/* Action Steps */}
              {recommendation.actionable_steps.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">
                    Action Steps:
                  </h5>
                  <div className="space-y-1">
                    {recommendation.actionable_steps
                      .slice(0, 3)
                      .map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs"
                        >
                          <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground leading-relaxed">
                            {step}
                          </span>
                        </div>
                      ))}
                    {recommendation.actionable_steps.length > 3 && (
                      <div className="text-xs text-muted-foreground ml-5">
                        +{recommendation.actionable_steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div>
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {recommendation.estimated_improvement}
                  </div>
                  {recommendation.related_metrics.length > 0 && (
                    <div>
                      Affects:{" "}
                      {recommendation.related_metrics.slice(0, 2).join(", ")}
                      {recommendation.related_metrics.length > 2 && ", ..."}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatCreatedAt(recommendation.created_at)}
                </div>
              </div>

              {/* Effectiveness Score */}
              {recommendation.effectiveness_score !== undefined && (
                <div className="bg-muted/30 rounded p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Effectiveness Score:
                    </span>
                    <span
                      className={`font-medium ${
                        recommendation.effectiveness_score >= 80
                          ? "text-green-600"
                          : recommendation.effectiveness_score >= 60
                            ? "text-orange-600"
                            : "text-red-600"
                      }`}
                    >
                      {recommendation.effectiveness_score}%
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons (if status is pending) */}
              {recommendation.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="h-7 text-xs">
                    Start Implementation
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
