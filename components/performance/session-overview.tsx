import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InteractiveChart } from "@/components/charts"
import { PerformanceSummary, PerformanceSession } from "@/lib/performance-data"
import { format } from "date-fns"

interface SessionOverviewProps {
  summary: PerformanceSummary
  isLoading?: boolean
}

export function SessionOverview({ summary, isLoading }: SessionOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const _formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown"
    if (duration < 60) return `${Math.round(duration)}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  const getSessionStatus = (session: PerformanceSession) => {
    if (!session.session_end) return { status: "Active", color: "" }
    // Note: avg_fps is not available in the session table, using a default status
    return { status: "Completed", color: "" }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.platformBreakdown.length > 0 ? (
            <InteractiveChart
              data={summary.platformBreakdown.map((p, index) => ({
                timestamp: `Platform ${index + 1}`,
                fps: p.count,
                memory_usage: 0,
                cpu_usage: 0,
                load_time: 0,
                screen_name: p.platform,
              }))}
              metric="fps"
              chartType="bar"
              title="Platform Distribution"
              height={200}
              enableBrush={false}
              enableZoom={false}
              enableExport={false}
              enableAnomalyDetection={false}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No platform data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.recentActivity.length > 0 ? (
              summary.recentActivity.slice(0, 5).map(session => {
                const sessionStatus = getSessionStatus(session)
                return (
                  <div key={session.id} className="flex items-center space-x-3">
                    <span className="text-lg">{sessionStatus.color}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.device_type} • {session.app_version}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{sessionStatus.status}</span>
                        <span>•</span>
                        <span>{session.os_version}</span>
                        <span>•</span>
                        <span>
                          {format(
                            new Date(session.created_at),
                            "MMM dd, HH:mm"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {session.session_end ? "Completed" : "Active"}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent sessions
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
