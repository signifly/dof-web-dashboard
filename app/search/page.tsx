import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SearchPageContent } from "@/components/search/search-page-content"

export const dynamic = "force-dynamic"

export default function SearchPage() {
  return (
    <DashboardLayout title="Search Performance Data">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Search Performance Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Find specific performance metrics, sessions, and devices with
              advanced filtering
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Loading search...</div>}>
          <SearchPageContent />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
