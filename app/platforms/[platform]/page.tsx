import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getPlatformDetails } from "@/lib/actions/platform-actions"
import { PlatformOverview } from "@/components/platforms/platform-overview"
import { PlatformDeviceList } from "@/components/platforms/platform-device-list"
import { PlatformMetrics } from "@/components/platforms/platform-metrics"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

interface PlatformDetailPageProps {
  params: {
    platform: string
  }
}

export default async function PlatformDetailPage({
  params,
}: PlatformDetailPageProps) {
  // Require authentication (DashboardLayout will get user from server context)
  await requireAuth()

  const { platform } = params

  try {
    // Decode the platform name in case it's URL encoded
    const decodedPlatform = decodeURIComponent(platform)

    // Fetch comprehensive platform data
    const platformData = await getPlatformDetails(decodedPlatform)

    if (!platformData) {
      notFound()
    }

    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {platformData.platform} Platform
                </h1>
                <p className="text-muted-foreground">
                  Comprehensive performance analysis across all {platformData.platform} devices
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Health Score Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    platformData.healthScore >= 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : platformData.healthScore >= 60
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : platformData.healthScore >= 40
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  Health Score: {platformData.healthScore}/100
                </div>

                {/* Risk Level Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    platformData.riskLevel === "low"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : platformData.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {platformData.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Platform Overview Section */}
          <section>
            <PlatformOverview platform={platformData} />
          </section>

          {/* Platform Devices Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Device Breakdown
              </h2>
              <p className="text-muted-foreground">
                All devices running on {platformData.platform} platform
              </p>
            </div>
            <PlatformDeviceList devices={platformData.devices} />
          </section>

          {/* Platform Metrics Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Performance Metrics
              </h2>
              <p className="text-muted-foreground">
                Aggregated performance trends across all {platformData.platform} devices
              </p>
            </div>
            <PlatformMetrics metrics={platformData.deviceMetrics} />
          </section>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading platform details:", error)

    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Unable to load platform data
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an error loading the platform information.
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
export async function generateMetadata({ params }: PlatformDetailPageProps) {
  const { platform } = params
  const decodedPlatform = decodeURIComponent(platform)

  return {
    title: `${decodedPlatform} Platform | DOF Performance Dashboard`,
    description: `Performance analysis for all ${decodedPlatform} devices`,
  }
}
