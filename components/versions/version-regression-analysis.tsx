"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  VersionDetails,
  VersionSummary,
  VersionChanges,
} from "@/lib/types/version"

interface VersionRegressionAnalysisProps {
  currentVersion: VersionDetails
  previousVersion: VersionSummary
  changes: VersionChanges
}

export function VersionRegressionAnalysis({
  currentVersion,
  previousVersion,
  changes,
}: VersionRegressionAnalysisProps) {
  const getChangeColor = (delta: number, isMemory: boolean = false) => {
    // For memory, positive change is bad (regression)
    // For FPS and CPU, positive change is good (improvement)
    const isRegression = isMemory ? delta > 0 : delta < 0

    if (isRegression) {
      return "text-red-600 dark:text-red-400"
    }
    return "text-green-600 dark:text-green-400"
  }

  const formatChange = (delta: number, percentChange: number) => {
    const sign = delta > 0 ? "+" : ""
    return `${sign}${delta.toFixed(1)} (${sign}${percentChange.toFixed(1)}%)`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regression Analysis vs Previous Version</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Version Comparison Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <div className="text-sm text-muted-foreground">
                Comparing Against
              </div>
              <div className="font-mono font-medium">
                Version {previousVersion.version}
              </div>
            </div>
            <div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  changes.regressionScore.delta >= 0
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {changes.regressionScore.delta >= 0 ? "Improved" : "Regressed"}
              </div>
            </div>
          </div>

          {/* Metrics Comparison Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* FPS Comparison */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-3">FPS Performance</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-medium">
                    {previousVersion.avgFps.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">
                    {currentVersion.avgFps.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Change:</span>
                  <span className={getChangeColor(changes.fps.delta, false)}>
                    {formatChange(changes.fps.delta, changes.fps.percentChange)}
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Comparison */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-3">Memory Usage</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-medium">
                    {previousVersion.avgMemory} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">
                    {currentVersion.avgMemory} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Change:</span>
                  <span
                    className={getChangeColor(changes.memory.delta, true)}
                  >
                    {formatChange(
                      changes.memory.delta,
                      changes.memory.percentChange
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* CPU Comparison */}
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-3">CPU Usage</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-medium">
                    {previousVersion.avgCpu.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">
                    {currentVersion.avgCpu.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Change:</span>
                  <span className={getChangeColor(changes.cpu.delta, true)}>
                    {formatChange(changes.cpu.delta, changes.cpu.percentChange)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Regression Score */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Regression Score Change
                </div>
                <div className="text-2xl font-bold">
                  {currentVersion.regressionScore} / 100
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Delta</div>
                <div
                  className={`text-2xl font-bold ${
                    changes.regressionScore.delta >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {changes.regressionScore.delta >= 0 ? "+" : ""}
                  {changes.regressionScore.delta}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
