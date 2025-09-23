import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceProfiling } from "@/components/analytics/device-profiling"
import {
  getPerformanceSummary,
  getDevicePerformanceData,
} from "@/lib/performance-data"

export const dynamic = "force-dynamic"

export default async function DevicesPage() {
  try {
    const [summary, devices] = await Promise.all([
      getPerformanceSummary(),
      getDevicePerformanceData(),
    ])

    return (
      <DashboardLayout title="Devices">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Device Management
              </h2>
              <p className="text-muted-foreground">
                Monitor performance across all devices and platforms.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.deviceCount}</div>
                <p className="text-xs text-muted-foreground">
                  Unique devices monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.platformBreakdown.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Different platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalSessions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total monitoring sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.avgFps.toFixed(1)} FPS
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>
          </div>

          <DeviceProfiling devices={devices} />
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading devices data:", error)

    return (
      <DashboardLayout title="Devices">
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load device data
            </h2>
            <p className="text-gray-600">
              Make sure your database is connected and contains performance
              data.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Error: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
}
