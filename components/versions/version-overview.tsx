"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VersionDetails } from "@/lib/types/version"

interface VersionOverviewProps {
  version: VersionDetails
}

export function VersionOverview({ version }: VersionOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Version Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* FPS Metric */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {version.avgFps.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg FPS</div>
            <div
              className={`mt-1 text-xs ${
                version.avgFps >= 50
                  ? "text-green-600 dark:text-green-400"
                  : version.avgFps >= 30
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {version.avgFps >= 50
                ? "Excellent"
                : version.avgFps >= 30
                  ? "Good"
                  : "Poor"}
            </div>
          </div>

          {/* Memory Metric */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {version.avgMemory} MB
            </div>
            <div className="text-sm text-muted-foreground">Avg Memory</div>
            <div
              className={`mt-1 text-xs ${
                version.avgMemory <= 200
                  ? "text-green-600 dark:text-green-400"
                  : version.avgMemory <= 400
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {version.avgMemory <= 200
                ? "Excellent"
                : version.avgMemory <= 400
                  ? "Good"
                  : "High"}
            </div>
          </div>

          {/* CPU Metric */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {version.avgCpu.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg CPU</div>
            <div
              className={`mt-1 text-xs ${
                version.avgCpu <= 30
                  ? "text-green-600 dark:text-green-400"
                  : version.avgCpu <= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {version.avgCpu <= 30
                ? "Low"
                : version.avgCpu <= 60
                  ? "Moderate"
                  : "High"}
            </div>
          </div>

          {/* Load Time Metric */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">
              {version.avgLoadTime} ms
            </div>
            <div className="text-sm text-muted-foreground">Avg Load Time</div>
            <div
              className={`mt-1 text-xs ${
                version.avgLoadTime <= 500
                  ? "text-green-600 dark:text-green-400"
                  : version.avgLoadTime <= 1000
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {version.avgLoadTime <= 500
                ? "Fast"
                : version.avgLoadTime <= 1000
                  ? "Moderate"
                  : "Slow"}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="text-sm">
            <div className="text-muted-foreground">Commit</div>
            <div className="font-mono font-medium">{version.commit}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Branch</div>
            <div className="font-mono font-medium">{version.branch}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Date Range</div>
            <div className="font-medium">
              {new Date(version.firstSeen).toLocaleDateString()} -{" "}
              {new Date(version.lastSeen).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
