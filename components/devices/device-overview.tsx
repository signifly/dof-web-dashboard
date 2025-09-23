"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeviceProfile } from "@/types/device"
import { formatDistanceToNow, format } from "date-fns"

interface DeviceOverviewProps {
  device: DeviceProfile
}

export function DeviceOverview({ device }: DeviceOverviewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy 'at' h:mm a")
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈"
      case "declining":
        return "📉"
      case "stable":
      default:
        return "📊"
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Device Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Device Information
            <Badge variant="outline">{device.platform}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Device ID</p>
              <p className="font-mono">{device.deviceId.slice(0, 12)}...</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Platform</p>
              <p className="font-medium">{device.platform}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">App Version</p>
              <p className="font-medium">{device.appVersion}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">OS Version</p>
              <p className="font-medium">{device.osVersion || "Unknown"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Device Health
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreBg(device.healthScore)} ${getHealthScoreColor(device.healthScore)}`}
            >
              {device.healthScore}/100
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Score Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Performance Score</span>
              <span
                className={`font-medium ${getHealthScoreColor(device.healthScore)}`}
              >
                {device.healthScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={`h-2 rounded-full ${
                  device.healthScore >= 80
                    ? "bg-green-500"
                    : device.healthScore >= 60
                      ? "bg-yellow-500"
                      : device.healthScore >= 40
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${device.healthScore}%` }}
              />
            </div>
          </div>

          {/* Performance Trend */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Trend</span>
            <div
              className={`flex items-center space-x-1 ${getTrendColor(device.performanceTrend)}`}
            >
              <span>{getTrendIcon(device.performanceTrend)}</span>
              <span className="font-medium capitalize text-sm">
                {device.performanceTrend}
              </span>
            </div>
          </div>

          {/* Risk Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk Level</span>
            <Badge
              variant={
                device.riskLevel === "low"
                  ? "default"
                  : device.riskLevel === "medium"
                    ? "secondary"
                    : "destructive"
              }
            >
              {device.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{device.totalSessions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Active Days</p>
              <p className="text-2xl font-bold">{device.activeDays}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">{device.sessionsToday}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">This Week</p>
              <p className="text-lg font-semibold">{device.sessionsThisWeek}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average FPS</span>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    device.avgFps >= 50
                      ? "bg-green-500"
                      : device.avgFps >= 30
                        ? "bg-yellow-500"
                        : device.avgFps >= 20
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {device.avgFps.toFixed(1)} FPS
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Average Memory
              </span>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    device.avgMemory <= 200
                      ? "bg-green-500"
                      : device.avgMemory <= 400
                        ? "bg-yellow-500"
                        : device.avgMemory <= 600
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {device.avgMemory > 0
                    ? `${device.avgMemory.toFixed(0)} MB`
                    : "N/A"}
                </span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle>Device Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">First Seen</span>
              <span className="font-medium">
                {formatRelativeTime(device.firstSeen)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Seen</span>
              <span className="font-medium">
                {formatRelativeTime(device.lastSeen)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t space-y-1">
            <p className="text-xs text-muted-foreground">
              First Activity: {formatDate(device.firstSeen)}
            </p>
            <p className="text-xs text-muted-foreground">
              Latest Activity: {formatDate(device.lastSeen)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {device.sessionHistory.length}
              </p>
              <p className="text-xs text-muted-foreground">Recent Sessions</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {device.metricsOverTime.length}
              </p>
              <p className="text-xs text-muted-foreground">Data Points</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {device.sessionHistory.reduce(
                  (sum, session) => sum + session.screenTransitions,
                  0
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Screen Transitions
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(
                  device.sessionHistory.reduce(
                    (sum, session) => sum + (session.duration || 0),
                    0
                  ) / (device.sessionHistory.length || 1)
                )}
              </p>
              <p className="text-xs text-muted-foreground">Avg Session (min)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
