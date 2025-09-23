"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceSession } from "@/lib/performance-data"

interface DeviceProfile {
  deviceId: string
  platform: string
  appVersion: string
  sessions: PerformanceSession[]
  totalSessions: number
  avgFps: number
  avgMemory: number
  avgLoadTime: number
  lastSeen: string
  performanceTier?: string
  riskLevel: "low" | "medium" | "high"
}

interface DeviceProfilingProps {
  devices: DeviceProfile[]
}

export function DeviceProfiling({ devices }: DeviceProfilingProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return "bg-green-900/200"
    if (fps >= 30) return "bg-yellow-900/200"
    if (fps >= 20) return "bg-orange-900/200"
    return "bg-red-900/200"
  }

  const getRiskColor = (riskLevel: "low" | "medium" | "high") => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-900/20"
      case "medium":
        return "text-yellow-600 bg-yellow-900/20"
      case "high":
        return "text-red-600 bg-red-900/20"
    }
  }

  const getRiskIcon = (riskLevel: "low" | "medium" | "high") => {
    switch (riskLevel) {
      case "low":
        return "✓"
      case "medium":
        return "!"
      case "high":
        return "!"
    }
  }

  const getPerformanceScore = (device: DeviceProfile) => {
    // Calculate a composite performance score based on FPS and Memory only
    const fpsScore = Math.min((device.avgFps / 60) * 60, 60) // 60 points max for FPS
    const memoryScore =
      device.avgMemory > 0
        ? Math.max(40 - (device.avgMemory / 1000) * 15, 0)
        : 40 // 40 points max for memory efficiency

    return Math.round(fpsScore + memoryScore)
  }

  // Sort devices by performance score (highest first)
  const sortedDevices = [...devices].sort(
    (a, b) => getPerformanceScore(b) - getPerformanceScore(a)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Performance Profiling</CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No device profiling data available
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDevices.map(device => {
              const performanceScore = getPerformanceScore(device)

              return (
                <div
                  key={device.deviceId}
                  className="p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className={`w-4 h-4 rounded-full mt-1 ${getPerformanceColor(device.avgFps)}`}
                        title={`${device.avgFps.toFixed(1)} FPS`}
                      />
                      <div className="flex-1">
                        <div className="font-medium group-hover:text-primary transition-colors">
                          Device{" "}
                          {device.deviceId
                            ? device.deviceId.slice(0, 8)
                            : "Unknown"}
                          ...
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {device.platform} • {device.appVersion}
                          {device.performanceTier && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                              {device.performanceTier} tier
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end space-y-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(device.riskLevel)}`}
                      >
                        {getRiskIcon(device.riskLevel)}{" "}
                        {device.riskLevel.toUpperCase()} RISK
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Score: {performanceScore}/100
                      </div>
                      <Link
                        href={`/devices/${encodeURIComponent(device.deviceId)}`}
                        className="inline-block"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">
                        {device.avgFps.toFixed(1)}
                      </div>
                      <div className="text-muted-foreground">Avg FPS</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {device.avgMemory > 0
                          ? `${device.avgMemory.toFixed(0)} MB`
                          : "N/A"}
                      </div>
                      <div className="text-muted-foreground">Memory</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{device.totalSessions}</div>
                      <div className="text-muted-foreground">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {formatDate(device.lastSeen)}
                      </div>
                      <div className="text-muted-foreground">Last Seen</div>
                    </div>
                  </div>

                  {/* Performance indicator bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Performance Score</span>
                      <span>{performanceScore}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          performanceScore >= 80
                            ? "bg-green-900/200"
                            : performanceScore >= 60
                              ? "bg-yellow-900/200"
                              : performanceScore >= 40
                                ? "bg-orange-900/200"
                                : "bg-red-900/200"
                        }`}
                        style={{ width: `${Math.max(performanceScore, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
              <strong>Performance Scoring:</strong>
              <br />• <strong>FPS (60pts):</strong> Frame rate consistency and
              smoothness
              <br />• <strong>Memory (40pts):</strong> Memory efficiency and
              usage patterns
              <br />
              <br />
              <strong>Risk Levels:</strong> Based on performance trends and
              device behavior patterns
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
