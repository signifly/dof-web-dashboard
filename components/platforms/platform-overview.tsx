"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformDetails } from "@/lib/actions/platform-actions"
import {
  Activity,
  Smartphone,
  TrendingUp,
  Zap,
  MemoryStick,
  Gauge,
} from "lucide-react"

interface PlatformOverviewProps {
  platform: PlatformDetails
}

export function PlatformOverview({ platform }: PlatformOverviewProps) {
  const stats = [
    {
      label: "Total Devices",
      value: platform.totalDevices,
      icon: Smartphone,
      color: "text-blue-600",
    },
    {
      label: "Total Sessions",
      value: platform.totalSessions,
      icon: Activity,
      color: "text-purple-600",
    },
    {
      label: "Avg FPS",
      value: `${platform.avgFps}`,
      icon: Zap,
      color: "text-green-600",
    },
    {
      label: "Avg Memory",
      value: `${platform.avgMemory} MB`,
      icon: MemoryStick,
      color: "text-orange-600",
    },
    {
      label: "Avg CPU",
      value: `${platform.avgCpu}%`,
      icon: Gauge,
      color: "text-red-600",
    },
    {
      label: "Avg Load Time",
      value: `${platform.avgLoadTime}ms`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
