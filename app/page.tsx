import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <DashboardLayout title="Welcome">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            DOF Web Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Performance monitoring and management for your applications
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard" className="block">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <CardTitle>Dashboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View system performance metrics and analytics in real-time.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/metrics" className="block">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📈</span>
                  <CardTitle>Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed performance metrics and historical trends.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/devices" className="block">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📱</span>
                  <CardTitle>Devices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor all connected devices and services.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Get Started</h2>
          <p className="text-muted-foreground">
            Choose a section above to begin monitoring your applications performance,
            or start with the main dashboard.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
