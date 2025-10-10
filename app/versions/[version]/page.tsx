import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getVersionDetails } from "@/lib/actions/version-actions"
import { requireAuth } from "@/lib/auth"
import { VersionOverview } from "@/components/versions/version-overview"
import { VersionRegressionAnalysis } from "@/components/versions/version-regression-analysis"
import { VersionPlatformBreakdown } from "@/components/versions/version-platform-breakdown"
import { VersionMetricsCharts } from "@/components/versions/version-metrics-charts"
import { VersionDeviceList } from "@/components/versions/version-device-list"

export const dynamic = "force-dynamic"

interface VersionDetailPageProps {
  params: Promise<{
    version: string
  }>
}

export default async function VersionDetailPage({
  params,
}: VersionDetailPageProps) {
  await requireAuth()

  const { version } = await params
  const decodedVersion = decodeURIComponent(version)

  try {
    const versionData = await getVersionDetails(decodedVersion)

    if (!versionData) {
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
                  Version {versionData.version}
                </h1>
                <p className="text-muted-foreground">
                  Performance analysis across {versionData.totalDevices} devices
                  and {versionData.totalSessions} sessions
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    versionData.status === "passed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : versionData.status === "warning"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {versionData.status.toUpperCase()}
                </div>
                {/* Health Score Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    versionData.healthScore >= 80
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : versionData.healthScore >= 60
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  Health: {versionData.healthScore}/100
                </div>
              </div>
            </div>
          </div>

          {/* Regression Analysis (if previous version exists) */}
          {versionData.previousVersion && versionData.changes && (
            <section>
              <VersionRegressionAnalysis
                currentVersion={versionData}
                previousVersion={versionData.previousVersion}
                changes={versionData.changes}
              />
            </section>
          )}

          {/* Version Overview */}
          <section>
            <VersionOverview version={versionData} />
          </section>

          {/* Platform Breakdown */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Platform Distribution
              </h2>
              <p className="text-muted-foreground">
                Performance breakdown across different platforms
              </p>
            </div>
            <VersionPlatformBreakdown platforms={versionData.platforms} />
          </section>

          {/* Performance Trends */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Performance Over Time
              </h2>
              <p className="text-muted-foreground">
                Session-by-session metrics for this version
              </p>
            </div>
            <VersionMetricsCharts metrics={versionData.sessionMetrics} />
          </section>

          {/* Device List */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                All Devices
              </h2>
              <p className="text-muted-foreground">
                All devices running version {versionData.version}
              </p>
            </div>
            <VersionDeviceList devices={versionData.devices} />
          </section>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading version details:", error)

    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">
            Unable to load version data
          </h2>
          <p className="text-muted-foreground">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </DashboardLayout>
    )
  }
}

export async function generateMetadata({ params }: VersionDetailPageProps) {
  const { version } = await params
  const decodedVersion = decodeURIComponent(version)

  return {
    title: `Version ${decodedVersion} | DOF Performance Dashboard`,
    description: `Performance analysis for app version ${decodedVersion}`,
  }
}
