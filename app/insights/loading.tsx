import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Brain } from "lucide-react"

export default function InsightsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Insights
          </h1>
          <p className="text-muted-foreground">
            Comprehensive performance analysis and optimization recommendations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center space-x-3 py-12">
              <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <p className="text-lg font-medium">
                Generating AI-Powered Insights
              </p>
              <p className="text-sm text-muted-foreground">
                Analyzing performance data and building recommendations...
              </p>
              <div className="flex justify-center space-x-2 pt-4">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton cards for insights */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-4/6 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
