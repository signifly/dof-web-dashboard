"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PerformanceScore } from "@/types/insights"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PerformanceScoreCardProps {
  score: PerformanceScore
}

export function PerformanceScoreCard({ score }: PerformanceScoreCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500 hover:bg-green-600"
      case "B":
        return "bg-blue-500 hover:bg-blue-600"
      case "C":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "D":
        return "bg-orange-500 hover:bg-orange-600"
      case "F":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-blue-500"
    if (score >= 70) return "bg-yellow-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const formatLastCalculated = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Performance Score</span>
          <div className="flex items-center gap-2">
            {getTrendIcon(score.trend)}
            <Badge className={`${getGradeColor(score.grade)} text-white`}>
              Grade {score.grade}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div
              className={`text-5xl font-bold ${getScoreColor(score.overall)}`}
            >
              {score.overall}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Overall Performance Score
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {formatLastCalculated(score.last_calculated)}
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Performance Breakdown
            </h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">FPS Performance</span>
                  <span className="text-sm text-muted-foreground">
                    {score.breakdown.fps.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={score.breakdown.fps} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU Efficiency</span>
                  <span className="text-sm text-muted-foreground">
                    {score.breakdown.cpu.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={score.breakdown.cpu} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {score.breakdown.memory.toFixed(0)}/100
                  </span>
                </div>
                <Progress value={score.breakdown.memory} className="h-2" />
              </div>
            </div>
          </div>

          {/* Baseline Comparison */}
          {score.baseline_comparison && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">
                vs. Baseline
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div
                    className={`font-medium ${score.baseline_comparison.fps_vs_baseline >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {score.baseline_comparison.fps_vs_baseline >= 0 ? "+" : ""}
                    {score.baseline_comparison.fps_vs_baseline.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">FPS</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${score.baseline_comparison.cpu_vs_baseline <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {score.baseline_comparison.cpu_vs_baseline >= 0 ? "+" : ""}
                    {score.baseline_comparison.cpu_vs_baseline.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">CPU</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${score.baseline_comparison.memory_vs_baseline <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {score.baseline_comparison.memory_vs_baseline >= 0
                      ? "+"
                      : ""}
                    {score.baseline_comparison.memory_vs_baseline.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">Memory</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
