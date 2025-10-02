"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceProfile } from "@/lib/performance-data"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface PlatformDeviceListProps {
  devices: DeviceProfile[]
}

export function PlatformDeviceList({ devices }: PlatformDeviceListProps) {
  const router = useRouter()

  const handleDeviceClick = (deviceId: string) => {
    router.push(`/devices/${encodeURIComponent(deviceId)}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices ({devices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {devices.map(device => (
            <div
              key={device.deviceId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleDeviceClick(device.deviceId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm truncate">
                    {device.deviceId.slice(0, 12)}...
                  </span>
                  <Badge
                    variant={
                      device.riskLevel === "low"
                        ? "default"
                        : device.riskLevel === "medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {device.riskLevel}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {device.totalSessions} sessions • Last seen{" "}
                  {formatDistanceToNow(new Date(device.lastSeen), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">FPS</div>
                  <div className="font-medium">{device.avgFps}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">Memory</div>
                  <div className="font-medium">{device.avgMemory}MB</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">CPU</div>
                  <div className="font-medium">{device.avgCpu}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
