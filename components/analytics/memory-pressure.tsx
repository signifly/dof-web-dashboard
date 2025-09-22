"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MemoryPressureLevel {
  level: string
  count: number
}

interface MemoryPressureProps {
  pressureLevels: MemoryPressureLevel[]
  totalMemoryMetrics: number
}

export function MemoryPressure({
  pressureLevels,
  totalMemoryMetrics,
}: MemoryPressureProps) {
  const getPressureColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "normal":
        return "bg-green-900/200"
      case "warning":
        return "bg-yellow-900/200"
      case "critical":
        return "bg-red-900/200"
      case "low":
        return "bg-blue-900/200"
      default:
        return "bg-gray-500"
    }
  }

  const getPressureIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "normal":
        return ""
      case "warning":
        return ""
      case "critical":
        return ""
      case "low":
        return ""
      default:
        return ""
    }
  }

  const getPressureDescription = (level: string) => {
    switch (level.toLowerCase()) {
      case "normal":
        return "Healthy memory usage, no pressure detected"
      case "warning":
        return "Elevated memory usage, monitoring recommended"
      case "critical":
        return "High memory pressure, cleanup may be triggered"
      case "low":
        return "Low memory usage, optimal performance"
      default:
        return "Unknown memory pressure level"
    }
  }

  // Sort by severity (critical first)
  const sortedPressure = [...pressureLevels].sort((a, b) => {
    const order = ["critical", "warning", "normal", "low"]
    const aIndex = order.findIndex(level =>
      a.level.toLowerCase().includes(level)
    )
    const bIndex = order.findIndex(level =>
      b.level.toLowerCase().includes(level)
    )
    return (aIndex === -1 ? 5 : aIndex) - (bIndex === -1 ? 5 : bIndex)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Pressure Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {pressureLevels.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No memory pressure data available
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPressure.map(pressure => {
              const percentage =
                totalMemoryMetrics > 0
                  ? (pressure.count / totalMemoryMetrics) * 100
                  : 0

              return (
                <div key={pressure.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {getPressureIcon(pressure.level)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {pressure.level} Pressure
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getPressureDescription(pressure.level)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {pressure.count.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPressureColor(pressure.level)}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>Memory Pressure Levels:</strong>
                <br />• <strong>Normal:</strong> Healthy memory usage, system
                operating efficiently
                <br />• <strong>Warning:</strong> Elevated usage, performance
                may be impacted
                <br />• <strong>Critical:</strong> High pressure, system may
                trigger cleanup
                <br />• <strong>Low:</strong> Minimal usage, optimal performance
                conditions
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
