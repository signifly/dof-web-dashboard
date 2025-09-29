import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeedbackDashboard } from "@/components/feedback/feedback-dashboard"
import { getFeedbackList, getFeedbackStats } from "@/lib/actions/feedback"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function FeedbackPage() {
  // Require authentication and get current user
  const user = await requireAuth()

  try {
    const [initialData, stats] = await Promise.all([
      getFeedbackList({ page: 1, limit: 20 }),
      getFeedbackStats(),
    ])

    return (
      <DashboardLayout title="User Feedback" user={user}>
        <FeedbackDashboard
          initialData={{
            feedback: initialData.data,
            stats: stats,
            total: initialData.total,
            hasMore: initialData.hasMore,
          }}
        />
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error loading feedback data:", error)

    return (
      <DashboardLayout title="User Feedback" user={user}>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load feedback data
            </h2>
            <p className="text-gray-600">
              Make sure your database is connected and the feedback table is
              accessible.
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
