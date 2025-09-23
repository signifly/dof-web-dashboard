"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SessionPerformanceAnalysis } from "@/types/session"
import { format } from "date-fns"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  HardDrive,
  Cpu,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react"

interface SessionPerformanceAnalysisProps {
  analysis: SessionPerformanceAnalysis
}

export function SessionPerformanceAnalysisComponent({
  analysis,
}: SessionPerformanceAnalysisProps) {
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm:ss")
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "fps_drop":
        return <Zap className="h-4 w-4" />
      case "memory_spike":
        return <HardDrive className="h-4 w-4" />
      case "slow_load":
        return <Clock className="h-4 w-4" />
      case "cpu_high":
        return <Cpu className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "stable":
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600"
      case "declining":
        return "text-red-600"
      case "stable":
      default:
        return "text-gray-600"
    }
  }

  const getScreenPerformanceStatus = (
    screen: (typeof analysis.screenPerformance)[0]
  ) => {
    if (screen.issueCount === 0 && screen.avgFps > 30) {
      return { icon: CheckCircle2, color: "text-green-600", status: "Good" }
    } else if (screen.issueCount <= 2 && screen.avgFps > 20) {
      return { icon: Info, color: "text-yellow-600", status: "Fair" }
    } else {
      return { icon: AlertCircle, color: "text-red-600", status: "Poor" }
    }
  }

  const issuesByScreen = analysis.performanceIssues.reduce(
    (acc, issue) => {
      if (!acc[issue.affectedScreen]) {
        acc[issue.affectedScreen] = []
      }
      acc[issue.affectedScreen].push(issue)
      return acc
    },
    {} as Record<string, typeof analysis.performanceIssues>
  )

  const totalIssues = analysis.performanceIssues.length
  const highSeverityIssues = analysis.performanceIssues.filter(
    i => i.severity === "high"
  ).length
  const mediumSeverityIssues = analysis.performanceIssues.filter(
    i => i.severity === "medium"
  ).length

  return (
    <div className="space-y-6">
      {/* Performance Issues Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Performance Issues</span>
            {totalIssues > 0 && (
              <Badge variant="destructive">{totalIssues}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalIssues > 0 ? (
            <div className="space-y-4">
              {/* Issue Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600">
                    {highSeverityIssues}
                  </div>
                  <div className="text-sm text-red-600">High Severity</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mediumSeverityIssues}
                  </div>
                  <div className="text-sm text-yellow-600">Medium Severity</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalIssues - highSeverityIssues - mediumSeverityIssues}
                  </div>
                  <div className="text-sm text-blue-600">Low Severity</div>
                </div>
              </div>

              {/* Issue List */}
              <div className="space-y-3">
                {analysis.performanceIssues
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime()
                  )
                  .map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-600">
                          {getIssueIcon(issue.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {issue.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{formatTime(issue.timestamp)}</span>
                            <span>•</span>
                            <span>{issue.affectedScreen}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getIssueColor(issue.severity)}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No Performance Issues</p>
              <p className="text-sm">
                This session performed within acceptable ranges
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">FPS</span>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(analysis.performanceTrends.fps)}
                <span
                  className={`text-sm font-medium ${getTrendColor(
                    analysis.performanceTrends.fps
                  )}`}
                >
                  {analysis.performanceTrends.fps}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(analysis.performanceTrends.memory)}
                <span
                  className={`text-sm font-medium ${getTrendColor(
                    analysis.performanceTrends.memory
                  )}`}
                >
                  {analysis.performanceTrends.memory}
                </span>
              </div>
            </div>


            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Overall</span>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(analysis.performanceTrends.overall)}
                <span
                  className={`text-sm font-medium ${getTrendColor(
                    analysis.performanceTrends.overall
                  )}`}
                >
                  {analysis.performanceTrends.overall}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen-by-Screen Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Screen Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.screenPerformance.length > 0 ? (
            <div className="space-y-3">
              {analysis.screenPerformance.map((screen, index) => {
                const status = getScreenPerformanceStatus(screen)
                const StatusIcon = status.icon
                const screenIssues = issuesByScreen[screen.screenName] || []

                return (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        <div>
                          <h4 className="font-medium">{screen.screenName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Visited {screen.visitCount} times
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={status.color.replace("text", "border")}
                      >
                        {status.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg FPS:</span>
                        <span className="ml-2 font-medium">
                          {screen.avgFps.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Avg Memory:
                        </span>
                        <span className="ml-2 font-medium">
                          {screen.avgMemory.toFixed(0)}MB
                        </span>
                      </div>
                    </div>

                    {screenIssues.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-600">
                          Issues ({screenIssues.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {screenIssues.map((issue, issueIndex) => (
                            <Badge
                              key={issueIndex}
                              className={`${getIssueColor(issue.severity)} text-xs`}
                            >
                              {issue.type.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No screen performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
