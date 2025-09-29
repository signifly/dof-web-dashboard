import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeedbackDashboard } from "@/components/feedback/feedback-dashboard"
import { getFeedbackList, getFeedbackStats } from "@/lib/actions/feedback"
import { requireAuth } from "@/lib/auth"
import { isSuccess } from "@/lib/utils/result"

// Feedback page - medium caching for feedback data
export const revalidate = 180 // 3 minutes

export default async function FeedbackPage() {
  // Require authentication (DashboardLayout will get user from server context)
  await requireAuth()

  const [initialDataResult, statsResult] = await Promise.all([
    getFeedbackList({ page: 1, limit: 20 }),
    getFeedbackStats(),
  ])

  // Handle any errors from the Result pattern
  if (!isSuccess(initialDataResult)) {
    return (
      <DashboardLayout title="User Feedback" >
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
              Error: {initialDataResult.error}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!isSuccess(statsResult)) {
    return (
      <DashboardLayout title="User Feedback" >
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load feedback statistics
            </h2>
            <p className="text-gray-600">
              The feedback list is available, but statistics could not be
              loaded.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Error: {statsResult.error}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="User Feedback" >
      <FeedbackDashboard
        initialData={{
          feedback: initialDataResult.data.data,
          stats: statsResult.data,
          total: initialDataResult.data.total,
          hasMore: initialDataResult.data.hasMore,
        }}
      />
    </DashboardLayout>
  )
}
