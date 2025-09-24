"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeviceSession } from "@/types/device"
import { format } from "date-fns"
import { useState } from "react"

interface DeviceTimelineProps {
  sessions: DeviceSession[]
  deviceId: string
}

interface SessionDetailsProps {
  session: DeviceSession
  isExpanded: boolean
  onToggle: () => void
}

function SessionDetails({
  session,
  isExpanded,
  onToggle,
}: SessionDetailsProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm:ss a")
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Session {session.session.id.slice(0, 8)}...
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(session.session.session_start)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${getHealthScoreColor(session.healthSnapshot.score)}`}
            />
            <span className="text-sm font-medium">
              {session.healthSnapshot.score}/100
            </span>
            <button
              onClick={onToggle}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? "Less" : "More"}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Session Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">
              {session.duration ? `${session.duration}m` : "Unknown"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Health</p>
            <p className="font-medium">
              {getHealthScoreText(session.healthSnapshot.score)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Screens</p>
            <p className="font-medium">{session.screenTransitions}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Metrics</p>
            <p className="font-medium">{session.sessionMetrics.length}</p>
          </div>
        </div>

        {/* Performance Snapshot */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <h4 className="font-medium mb-2 text-sm">Performance Snapshot</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div
                className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  session.healthSnapshot.fps >= 50
                    ? "bg-green-500"
                    : session.healthSnapshot.fps >= 30
                      ? "bg-yellow-500"
                      : session.healthSnapshot.fps >= 20
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
              />
              <p className="text-muted-foreground">FPS</p>
              <p className="font-medium">
                {session.healthSnapshot.fps.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <div
                className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  session.healthSnapshot.memory <= 200
                    ? "bg-green-500"
                    : session.healthSnapshot.memory <= 400
                      ? "bg-yellow-500"
                      : session.healthSnapshot.memory <= 600
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
              />
              <p className="text-muted-foreground">Memory</p>
              <p className="font-medium">
                {session.healthSnapshot.memory > 0
                  ? `${session.healthSnapshot.memory.toFixed(0)}MB`
                  : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <div
                className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  session.healthSnapshot.loadTime <= 500
                    ? "bg-green-500"
                    : session.healthSnapshot.loadTime <= 1000
                      ? "bg-yellow-500"
                      : session.healthSnapshot.loadTime <= 2000
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
              />
              <p className="text-muted-foreground">Load Time</p>
              <p className="font-medium">
                {session.healthSnapshot.loadTime > 0
                  ? `${session.healthSnapshot.loadTime.toFixed(0)}ms`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Session Details</p>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Started:</span>{" "}
                    {formatDate(session.session.session_start)}
                  </p>
                  {session.session.session_end && (
                    <p>
                      <span className="font-medium">Ended:</span>{" "}
                      {formatDate(session.session.session_end)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Device:</span>{" "}
                    {session.session.device_type}
                  </p>
                  <p>
                    <span className="font-medium">OS:</span>{" "}
                    {session.session.os_version}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Performance Data</p>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Data Points:</span>{" "}
                    {session.sessionMetrics.length}
                  </p>
                  <p>
                    <span className="font-medium">Screen Changes:</span>{" "}
                    {session.screenTransitions}
                  </p>
                  <p>
                    <span className="font-medium">Crashes:</span>{" "}
                    {session.crashCount}
                  </p>
                  <p>
                    <span className="font-medium">App Version:</span>{" "}
                    {session.session.app_version}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            {session.sessionMetrics.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Recent Metrics
                </p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1 text-xs">
                    {session.sessionMetrics.slice(0, 5).map((metric, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span className="font-mono">{metric.metric_type}</span>
                        <span className="font-medium">
                          {metric.metric_value.toFixed(1)} {metric.metric_unit}
                        </span>
                      </div>
                    ))}
                    {session.sessionMetrics.length > 5 && (
                      <p className="text-center text-muted-foreground italic">
                        +{session.sessionMetrics.length - 5} more metrics...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DeviceTimeline({ sessions, _deviceId }: DeviceTimelineProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId)
  }

  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Sessions Found</h3>
            <p className="text-muted-foreground">
              No performance sessions have been recorded for this device yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group sessions by date for better organization
  const sessionsByDate = sessions.reduce(
    (groups, session) => {
      const date = format(new Date(session.session.session_start), "yyyy-MM-dd")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
      return groups
    },
    {} as Record<string, DeviceSession[]>
  )

  const sortedDates = Object.keys(sessionsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Session Timeline
            <Badge variant="outline">{sessions.length} Sessions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.healthSnapshot.score >= 80).length}
              </p>
              <p className="text-sm text-muted-foreground">
                Excellent Sessions
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {
                  sessions.filter(
                    s =>
                      s.healthSnapshot.score >= 60 &&
                      s.healthSnapshot.score < 80
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">Good Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {
                  sessions.filter(
                    s =>
                      s.healthSnapshot.score >= 40 &&
                      s.healthSnapshot.score < 60
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">Fair Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {sessions.filter(s => s.healthSnapshot.score < 40).length}
              </p>
              <p className="text-sm text-muted-foreground">Poor Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Timeline */}
      <div className="space-y-4">
        {sortedDates.map(date => (
          <div key={date} className="space-y-3">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </h3>
              <Badge variant="secondary">
                {sessionsByDate[date].length} sessions
              </Badge>
            </div>

            <div className="space-y-3 pl-4">
              {sessionsByDate[date].map(session => (
                <SessionDetails
                  key={session.session.id}
                  session={session}
                  isExpanded={expandedSession === session.session.id}
                  onToggle={() => toggleSessionExpansion(session.session.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Sessions */}
      {sessions.length >= 20 && (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Showing the most recent {sessions.length} sessions.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Load More Sessions
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
