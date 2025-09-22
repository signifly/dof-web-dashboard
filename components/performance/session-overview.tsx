import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceBarChart } from "@/components/charts/performance-bar-chart"
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

  const formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown"
    if (duration < 60) return `${Math.round(duration)}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  const getSessionStatus = (session: PerformanceSession) => {
    if (!session.end_time) return { status: "Active", color: "" }
    if (session.avg_fps && session.avg_fps >= 30)
      return { status: "Good", color: "" }
    if (session.avg_fps && session.avg_fps >= 20)
      return { status: "Fair", color: "" }
    return { status: "Poor", color: "" }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.platformBreakdown.length > 0 ? (
            <PerformanceBarChart
              data={summary.platformBreakdown.map(p => ({
                name: p.platform,
                sessions: p.count,
              }))}
              bars={[
                {
                  key: "sessions",
                  name: "Sessions",
                  color: "#8884d8",
                  unit: " sessions",
                },
              ]}
              height={200}
              showLegend={false}
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
                        {session.platform} • {session.app_version}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{sessionStatus.status}</span>
                        <span>•</span>
                        <span>{formatDuration(session.duration)}</span>
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
                        {session.total_metrics} metrics
                      </p>
                      {session.avg_fps && (
                        <p className="text-xs font-medium">
                          {session.avg_fps.toFixed(1)} FPS
                        </p>
                      )}
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
