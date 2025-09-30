"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceSession } from "@/lib/performance-data"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

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
            <Link
              key={session.id}
              href={`/sessions/${encodeURIComponent(session.id)}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      getSessionStatus(session) === "Active"
                        ? "bg-green-500"
                        : getSessionStatus(session) === "Completed"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                    }`}
                    title={`${getSessionStatus(session)} Session`}
                  />
                  <div>
                    <div className="font-medium text-sm flex items-center space-x-2">
                      <span>
                        {session.device_type} • {session.app_version}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      User: {session.anonymous_user_id.slice(0, 8)}... •
                      Session: {session.id.slice(0, 8)}...
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
            </Link>
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
