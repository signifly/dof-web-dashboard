import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const alerts = [
  {
    id: "alert-001",
    title: "High CPU Usage",
    description: "CPU usage exceeded 90% threshold",
    severity: "critical",
    timestamp: "2024-01-15 14:30:00",
    source: "Production Server",
    status: "active",
  },
  {
    id: "alert-002",
    title: "Memory Warning",
    description: "Memory usage reached 85% capacity",
    severity: "warning",
    timestamp: "2024-01-15 14:25:00",
    source: "Database Server",
    status: "active",
  },
  {
    id: "alert-003",
    title: "Service Restored",
    description: "Database connection restored successfully",
    severity: "info",
    timestamp: "2024-01-15 14:20:00",
    source: "Database",
    status: "resolved",
  },
  {
    id: "alert-004",
    title: "Disk Space Low",
    description: "Available disk space below 10%",
    severity: "warning",
    timestamp: "2024-01-15 14:15:00",
    source: "File Server",
    status: "active",
  },
]

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return "🔴"
    case "warning":
      return "🟡"
    case "info":
      return "🔵"
    default:
      return "⚪"
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "text-red-600"
    case "warning":
      return "text-yellow-600"
    case "info":
      return "text-blue-600"
    default:
      return "text-gray-600"
  }
}

export default function AlertsPage() {
  return (
    <DashboardLayout title="Alert Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Alert Management
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage system alerts and notifications.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Configure Rules</Button>
            <Button variant="outline">View All</Button>
            <Button>Mark All Read</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Alerts
              </CardTitle>
              <span className="text-2xl">🔔</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <span className="text-2xl">🔴</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter(a => a.severity === "critical").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <span className="text-2xl">🟡</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter(a => a.severity === "warning").length}
              </div>
              <p className="text-xs text-muted-foreground">Monitor closely</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter(a => a.status === "resolved").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully handled
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    alert.status === "resolved" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">
                      {getSeverityIcon(alert.severity)}
                    </span>
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.source} • {alert.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium capitalize ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {alert.status}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {alert.status === "active" && (
                      <>
                        <Button variant="outline" size="sm">
                          Acknowledge
                        </Button>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Notification Rules</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Email Notifications</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMS Alerts</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slack Integration</span>
                    <span className="text-red-600">Disabled</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Thresholds</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span>90%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span>85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disk Space</span>
                    <span>10%</span>
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
