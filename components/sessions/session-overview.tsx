"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SessionDetails } from "@/types/session"
import { formatDistanceToNow, format } from "date-fns"

interface SessionOverviewProps {
  session: SessionDetails
}

export function SessionOverview({ session }: SessionOverviewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy 'at' h:mm a")
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatDuration = (durationMs: number | null) => {
    if (!durationMs) return "N/A"

    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20"
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20"
    if (score >= 40) return "bg-orange-100 dark:bg-orange-900/20"
    return "bg-red-100 dark:bg-red-900/20"
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Session Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Session Information
            <Badge className={getStatusColor(session.isActive)}>
              {session.isActive ? "Active" : "Completed"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Session ID</p>
              <p className="font-mono text-xs">{session.id.slice(0, 12)}...</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Device</p>
              <p className="font-medium">{session.device_type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">App Version</p>
              <p className="font-medium">{session.app_version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">OS Version</p>
              <p className="font-medium">{session.os_version}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">
                {session.anonymous_user_id.slice(0, 8)}...
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{formatDuration(session.duration)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Started</span>
              <div className="text-right">
                <p className="font-medium">
                  {formatDate(session.session_start)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(session.session_start)}
                </p>
              </div>
            </div>

            {session.session_end && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ended</span>
                <div className="text-right">
                  <p className="font-medium">
                    {formatDate(session.session_end)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(session.session_end)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Metrics</span>
              <span className="font-medium">
                {session.totalMetrics.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Screens Visited</span>
              <span className="font-medium">
                {session.uniqueScreens.length}
              </span>
            </div>

            {session.uniqueScreens.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Screen List:
                </p>
                <div className="flex flex-wrap gap-1">
                  {session.uniqueScreens.slice(0, 3).map((screen, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {screen}
                    </Badge>
                  ))}
                  {session.uniqueScreens.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{session.uniqueScreens.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Health Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Performance Health
            <div className="flex items-center space-x-2">
              <Badge className={getRiskLevelColor(session.riskLevel)}>
                {session.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Performance Score */}
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${getHealthScoreBg(
                session.performanceScore
              )} ${getHealthScoreColor(session.performanceScore)}`}
            >
              {session.performanceScore}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Health Score</p>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average FPS</span>
              <span className="font-medium">
                {session.healthIndicators.avgFps.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Memory</span>
              <span className="font-medium">
                {session.healthIndicators.avgMemory.toFixed(0)}MB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average CPU</span>
              <span className="font-medium">
                {session.healthIndicators.avgCpu.toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
