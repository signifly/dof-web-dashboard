import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function MetricsPage() {
  return (
    <DashboardLayout title="Performance Metrics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Performance Metrics
            </h2>
            <p className="text-muted-foreground">
              Detailed analytics and performance trends for your applications.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Export Data</Button>
            <Button>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245ms</div>
              <div className="h-[100px] mt-4 flex items-center justify-center text-muted-foreground">
                Response time chart
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234 req/s</div>
              <div className="h-[100px] mt-4 flex items-center justify-center text-muted-foreground">
                Throughput chart
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.12%</div>
              <div className="h-[100px] mt-4 flex items-center justify-center text-muted-foreground">
                Error rate chart
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Detailed performance trends chart will be displayed here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Application Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span>67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disk I/O</span>
                    <span>23%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Network Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Bandwidth Usage</span>
                    <span>1.2 GB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency</span>
                    <span>12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packet Loss</span>
                    <span>0.01%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
