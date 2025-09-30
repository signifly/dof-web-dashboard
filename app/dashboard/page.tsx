import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import {
  getCachedPerformanceSummary,
  getCachedPerformanceTrends,
} from "@/lib/performance-data"
import { requireAuth } from "@/lib/auth"

// Dashboard page with performance data - shorter revalidation for fresh data
export const revalidate = 60 // 1 minute

export default async function DashboardPage() {
  // Require authentication (DashboardLayout will get user from server context)
  await requireAuth()

  try {
    const [summary, trends] = await Promise.all([
      getCachedPerformanceSummary(),
      getCachedPerformanceTrends(50),
    ])

    return (
      <DashboardLayout>
        <DashboardContent initialSummary={summary} initialTrends={trends} />
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading dashboard data:", error)

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load performance data
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
