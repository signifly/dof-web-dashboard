"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSession } from "@/lib/performance-data"

interface RecentSessionsProps {
  sessions: PerformanceSession[]
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No recent sessions available
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown"
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPerformanceColor = (fps: number | null) => {
    if (!fps) return "bg-gray-500"
    if (fps >= 50) return "bg-green-900/200"
    if (fps >= 30) return "bg-yellow-900/200"
    if (fps >= 20) return "bg-orange-900/200"
    return "bg-red-900/200"
  }

  const getSessionStatus = (session: PerformanceSession) => {
    // If session has an end time, it's completed
    if (session.session_end) {
      return "Completed"
    }

    // If no end time, check how long ago it started
    const startTime = new Date(session.session_start).getTime()
    const now = new Date().getTime()
    const hoursAgo = (now - startTime) / (1000 * 60 * 60)

    // Consider sessions "stale" if they started more than 2 hours ago without ending
    if (hoursAgo > 2) {
      return "Stale"
    }

    return "Active"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.slice(0, 8).map(session => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full bg-blue-900/200`}
                  title="Session"
                />
                <div>
                  <div className="font-medium text-sm">
                    {session.device_type} • {session.app_version}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User: {session.anonymous_user_id.slice(0, 8)}...
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">
                  {getSessionStatus(session)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(session.session_start)}
                </div>
              </div>
            </div>
          ))}

          {sessions.length > 8 && (
            <div className="text-center pt-2">
              <div className="text-sm text-muted-foreground">
                Showing 8 of {sessions.length} sessions
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
