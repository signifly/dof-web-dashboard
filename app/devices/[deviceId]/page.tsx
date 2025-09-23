import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getDeviceDetails } from "@/lib/actions/device-actions"
import { DeviceOverview } from "@/components/devices/device-overview"
import { DeviceTimeline } from "@/components/devices/device-timeline"
import { DeviceMetrics } from "@/components/devices/device-metrics"

export const dynamic = "force-dynamic"

interface DeviceDetailPageProps {
  params: {
    deviceId: string
  }
}

export default async function DeviceDetailPage({
  params,
}: DeviceDetailPageProps) {
  const { deviceId } = params

  try {
    // Decode the deviceId in case it's URL encoded
    const decodedDeviceId = decodeURIComponent(deviceId)

    // Fetch comprehensive device data
    const device = await getDeviceDetails(decodedDeviceId)

    if (!device) {
      notFound()
    }

    // Format device title (first 8 characters + ellipsis)
    const deviceTitle = `Device ${device.deviceId.slice(0, 8)}...`

    return (
      <DashboardLayout title={deviceTitle}>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {deviceTitle}
                </h1>
                <p className="text-muted-foreground">
                  Comprehensive performance analysis and session history
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Health Score Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    device.healthScore >= 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : device.healthScore >= 60
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : device.healthScore >= 40
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  Health Score: {device.healthScore}/100
                </div>

                {/* Risk Level Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    device.riskLevel === "low"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : device.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {device.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Device Overview Section */}
          <section>
            <DeviceOverview device={device} />
          </section>

          {/* Device Timeline Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Session Timeline
              </h2>
              <p className="text-muted-foreground">
                Recent performance sessions and activity history
              </p>
            </div>
            <DeviceTimeline
              sessions={device.sessionHistory}
              deviceId={device.deviceId}
            />
          </section>

          {/* Device Metrics Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Performance Metrics
              </h2>
              <p className="text-muted-foreground">
                Detailed performance trends and analytics over time
              </p>
            </div>
            <DeviceMetrics
              deviceId={device.deviceId}
              metrics={device.metricsOverTime}
            />
          </section>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading device details:", error)

    return (
      <DashboardLayout title="Device Details">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Unable to load device data
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an error loading the device information.
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
export async function generateMetadata({ params }: DeviceDetailPageProps) {
  const { deviceId } = params
  const decodedDeviceId = decodeURIComponent(deviceId)
  const deviceTitle = `Device ${decodedDeviceId.slice(0, 8)}...`

  return {
    title: `${deviceTitle} | DOF Performance Dashboard`,
    description: `Performance analysis and session history for device ${deviceTitle}`,
  }
}
