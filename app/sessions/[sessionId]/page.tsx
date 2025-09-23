import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  getSessionDetails,
  getSessionMetrics,
  getSessionAnalysis,
} from "@/lib/actions/session-actions"
import { SessionOverview } from "@/components/sessions/session-overview"
import { LiveSessionMonitor } from "@/components/sessions/live-session-monitor"
import { SessionMetricsTimelineComponent } from "@/components/sessions/session-metrics-timeline"
import { SessionPerformanceAnalysisComponent } from "@/components/sessions/session-performance-analysis"

export const dynamic = "force-dynamic"

interface SessionDetailPageProps {
  params: {
    sessionId: string
  }
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { sessionId } = params

  try {
    // Decode the sessionId in case it's URL encoded
    const decodedSessionId = decodeURIComponent(sessionId)

    // Fetch comprehensive session data
    const session = await getSessionDetails(decodedSessionId)

    if (!session) {
      notFound()
    }

    // Fetch session metrics and analysis in parallel
    const [metrics, analysis] = await Promise.all([
      getSessionMetrics(decodedSessionId),
      getSessionAnalysis(decodedSessionId),
    ])

    // Format session title (first 8 characters + ellipsis)
    const sessionTitle = `Session ${session.id.slice(0, 8)}...`

    return (
      <DashboardLayout title={sessionTitle}>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {sessionTitle}
                </h1>
                <p className="text-muted-foreground">
                  Comprehensive performance analysis and real-time monitoring
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Performance Score Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.performanceScore >= 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : session.performanceScore >= 60
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : session.performanceScore >= 40
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  Score: {session.performanceScore}/100
                </div>

                {/* Risk Level Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.riskLevel === "low"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : session.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {session.riskLevel.toUpperCase()} RISK
                </div>

                {/* Active Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {session.isActive ? "ACTIVE" : "COMPLETED"}
                </div>
              </div>
            </div>
          </div>

          {/* Session Overview Section */}
          <section>
            <SessionOverview session={session} />
          </section>

          {/* Live Session Monitor (only for active sessions) */}
          {session.isActive && (
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  Live Performance Monitor
                </h2>
                <p className="text-muted-foreground">
                  Real-time performance metrics and connection status
                </p>
              </div>
              <LiveSessionMonitor
                sessionId={session.id}
                initialMetrics={metrics}
              />
            </section>
          )}

          {/* Session Metrics Timeline Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Performance Timeline
              </h2>
              <p className="text-muted-foreground">
                Detailed performance metrics and trends over time
              </p>
            </div>
            <SessionMetricsTimelineComponent
              metrics={metrics}
              sessionId={session.id}
              isLive={session.isActive}
            />
          </section>

          {/* Session Performance Analysis Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Performance Analysis
              </h2>
              <p className="text-muted-foreground">
                Issue detection, trends analysis, and screen-by-screen breakdown
              </p>
            </div>
            <SessionPerformanceAnalysisComponent analysis={analysis} />
          </section>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading session details:", error)

    return (
      <DashboardLayout title="Session Details">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Unable to load session data
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an error loading the session information.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: SessionDetailPageProps) {
  const { sessionId } = params
  const decodedSessionId = decodeURIComponent(sessionId)
  const sessionTitle = `Session ${decodedSessionId.slice(0, 8)}...`

  return {
    title: `${sessionTitle} | DOF Performance Dashboard`,
    description: `Performance analysis and real-time monitoring for session ${sessionTitle}`,
  }
}