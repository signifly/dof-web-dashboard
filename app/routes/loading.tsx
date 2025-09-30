import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, TrendingUp, Brain } from "lucide-react"

export default function RoutesLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span>Enhanced Route Performance Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive analytics with journey insights, predictive models,
              and AI-powered optimization recommendations
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI-Powered Analytics</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center space-x-3 py-12">
              <TrendingUp className="h-8 w-8 text-blue-600 animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <p className="text-lg font-medium">
                Loading Enhanced Route Analytics
              </p>
              <p className="text-sm text-muted-foreground">
                Processing journey flows, predictive models, and performance
                correlations...
              </p>
              <div className="flex justify-center space-x-2 pt-4">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton cards for analytics sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-5 bg-muted rounded animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-48 bg-muted rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
