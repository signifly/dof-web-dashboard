import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const devices = [
  {
    id: "device-001",
    name: "Production Server",
    type: "Server",
    status: "online",
    lastSeen: "2 minutes ago",
    performance: "Good",
  },
  {
    id: "device-002",
    name: "Development Server",
    type: "Server",
    status: "online",
    lastSeen: "5 minutes ago",
    performance: "Excellent",
  },
  {
    id: "device-003",
    name: "Database Server",
    type: "Database",
    status: "warning",
    lastSeen: "1 minute ago",
    performance: "Fair",
  },
  {
    id: "device-004",
    name: "Load Balancer",
    type: "Network",
    status: "offline",
    lastSeen: "1 hour ago",
    performance: "Poor",
  },
]

function getStatusIcon(status: string) {
  switch (status) {
    case "online":
      return "🟢"
    case "warning":
      return "🟡"
    case "offline":
      return "🔴"
    default:
      return "⚪"
  }
}

export default function DevicesPage() {
  return (
    <DashboardLayout title="Device Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Device Management
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage all connected devices and services.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Add Device</Button>
            <Button>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Devices
              </CardTitle>
              <span className="text-2xl">📱</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
              <p className="text-xs text-muted-foreground">Active devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <span className="text-2xl">🟢</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.filter(d => d.status === "online").length}
              </div>
              <p className="text-xs text-muted-foreground">Healthy devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <span className="text-2xl">🟡</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.filter(d => d.status === "warning").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Devices with issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <span className="text-2xl">🔴</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devices.filter(d => d.status === "offline").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Disconnected devices
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Device List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map(device => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">
                      {getStatusIcon(device.status)}
                    </span>
                    <div>
                      <h4 className="font-semibold">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {device.type} • ID: {device.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{device.performance}</p>
                    <p className="text-sm text-muted-foreground">
                      Last seen: {device.lastSeen}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
