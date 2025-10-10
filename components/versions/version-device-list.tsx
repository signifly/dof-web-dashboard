"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VersionDevice } from "@/lib/types/version"

interface VersionDeviceListProps {
  devices: VersionDevice[]
}

type SortKey = "deviceId" | "platform" | "totalSessions" | "avgFps" | "avgMemory" | "avgCpu"
type SortDirection = "asc" | "desc"

export function VersionDeviceList({ devices }: VersionDeviceListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("avgFps")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const sortedDevices = [...devices].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No device data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <span className="text-muted-foreground">↕</span>
    }
    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices ({devices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("deviceId")}
                >
                  <div className="flex items-center gap-2">
                    Device ID <SortIcon column="deviceId" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("platform")}
                >
                  <div className="flex items-center gap-2">
                    Platform <SortIcon column="platform" />
                  </div>
                </th>
                <th
                  className="text-center p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("totalSessions")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Sessions <SortIcon column="totalSessions" />
                  </div>
                </th>
                <th
                  className="text-center p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("avgFps")}
                >
                  <div className="flex items-center justify-center gap-2">
                    FPS <SortIcon column="avgFps" />
                  </div>
                </th>
                <th
                  className="text-center p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("avgMemory")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Memory <SortIcon column="avgMemory" />
                  </div>
                </th>
                <th
                  className="text-center p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleSort("avgCpu")}
                >
                  <div className="flex items-center justify-center gap-2">
                    CPU <SortIcon column="avgCpu" />
                  </div>
                </th>
                <th className="text-center p-3">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevices.map(device => (
                <tr key={device.deviceId} className="border-b hover:bg-accent/50">
                  <td className="p-3">
                    <div className="font-mono text-sm">
                      {device.deviceId.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{device.platform}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="font-medium">{device.totalSessions}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className={`font-medium ${
                        device.avgFps >= 50
                          ? "text-green-600 dark:text-green-400"
                          : device.avgFps >= 30
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {device.avgFps.toFixed(1)}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className={`font-medium ${
                        device.avgMemory <= 200
                          ? "text-green-600 dark:text-green-400"
                          : device.avgMemory <= 400
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {device.avgMemory} MB
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div
                      className={`font-medium ${
                        device.avgCpu <= 30
                          ? "text-green-600 dark:text-green-400"
                          : device.avgCpu <= 60
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {device.avgCpu.toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        device.riskLevel === "low"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : device.riskLevel === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {device.riskLevel.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
