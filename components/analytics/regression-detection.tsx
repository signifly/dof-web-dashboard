"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricsTrend } from "@/lib/performance-data"
import { getBuildPerformanceDataClient } from "@/lib/client-performance-data"
import { useEffect, useState } from "react"

interface RegressionDetectionProps {
  performanceData: MetricsTrend[]
}

interface RegressionAlert {
  id: string
  severity: "critical" | "warning" | "info"
  metric: string
  change: number
  baseline: number
  current: number
  buildInfo: {
    version: string
    commit: string
    branch: string
    timestamp: string
  }
  affectedDevices: string[]
  status: "new" | "investigating" | "resolved" | "false_positive"
}

interface BuildPerformance {
  version: string
  commit: string
  branch: string
  timestamp: string
  avgFps: number
  avgMemory: number
  avgCpu: number
  regressionScore: number
  status: "passed" | "failed" | "warning"
  totalSessions: number
  platforms: string[]
  dateRange: {
    first: string
    last: string
  }
}

// Generate regression alerts from real performance data
const generateRegressionData = (builds: BuildPerformance[]) => {
  // Only generate alerts if we have real build data
  if (builds.length < 2) {
    return { builds, alerts: [] }
  }

  // Use actual build data for alerts
  const latestBuild = builds[0]
  const previousBuild = builds[1]

  const alerts: RegressionAlert[] = []

  // Generate FPS regression alert if there's a significant drop
  if (previousBuild.avgFps - latestBuild.avgFps > 5) {
    alerts.push({
      id: "alert-fps",
      severity:
        previousBuild.avgFps - latestBuild.avgFps > 10 ? "critical" : "warning",
      metric: "FPS",
      change:
        ((latestBuild.avgFps - previousBuild.avgFps) / previousBuild.avgFps) *
        100,
      baseline: previousBuild.avgFps,
      current: latestBuild.avgFps,
      buildInfo: latestBuild,
      affectedDevices: latestBuild.platforms || ["Unknown"],
      status: "new",
    })
  }

  // Generate memory regression alert if there's a significant increase
  if (
    latestBuild.avgMemory - previousBuild.avgMemory >
    previousBuild.avgMemory * 0.15
  ) {
    alerts.push({
      id: "alert-memory",
      severity:
        latestBuild.avgMemory - previousBuild.avgMemory >
        previousBuild.avgMemory * 0.25
          ? "critical"
          : "warning",
      metric: "Memory Usage",
      change:
        ((latestBuild.avgMemory - previousBuild.avgMemory) /
          previousBuild.avgMemory) *
        100,
      baseline: previousBuild.avgMemory,
      current: latestBuild.avgMemory,
      buildInfo: latestBuild,
      affectedDevices: latestBuild.platforms || ["Unknown"],
      status: "new",
    })
  }

  return { builds, alerts }
}

export function RegressionDetection({}: RegressionDetectionProps) {
  const [builds, setBuilds] = useState<BuildPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBuildData() {
      try {
        setLoading(true)
        const realBuilds = await getBuildPerformanceDataClient()
        setBuilds(realBuilds)
        setError(null)
      } catch (err) {
        console.error("Error fetching build performance data:", err)
        setError("Failed to load build performance data")
        // Fallback to empty array
        setBuilds([])
      } finally {
        setLoading(false)
      }
    }

    fetchBuildData()
  }, [])

  const { alerts } = generateRegressionData(builds)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/20 text-red-700 border-red-200"
      case "warning":
        return "bg-yellow-900/20 text-yellow-700 border-yellow-200"
      case "info":
        return "bg-blue-900/20 text-blue-700 border-blue-200"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-900/20 text-green-700 border-green-200"
      case "failed":
        return "bg-red-900/20 text-red-700 border-red-200"
      case "warning":
        return "bg-yellow-900/20 text-yellow-700 border-yellow-200"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-900/20 text-red-700 border-red-200"
      case "investigating":
        return "bg-yellow-900/20 text-yellow-700 border-yellow-200"
      case "resolved":
        return "bg-green-900/20 text-green-700 border-green-200"
      case "false_positive":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>CI/CD Performance Regression Detection</CardTitle>
          <Button variant="outline" size="sm">
            Configure Thresholds
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="text-center p-4 bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.severity === "critical").length}
              </div>
              <div className="text-sm text-muted-foreground">
                Critical Alerts
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.severity === "warning").length}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center p-4 bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {builds.filter(b => b.status === "passed").length}
              </div>
              <div className="text-sm text-muted-foreground">Builds Passed</div>
            </div>
            <div className="text-center p-4 bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {builds.length > 0
                  ? builds[builds.length - 1].regressionScore
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Latest Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Regression Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No active regression alerts
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getSeverityColor(alert.severity)}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getAlertStatusColor(alert.status)}`}
                      >
                        {alert.status.replace("_", " ")}
                      </span>
                      <h4 className="font-medium">
                        {alert.metric} Regression Detected
                      </h4>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Investigate
                      </Button>
                      <Button variant="outline" size="sm">
                        Mark False Positive
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Performance Impact
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Baseline:</span>
                          <span>
                            {alert.baseline}
                            {alert.metric === "FPS" ? " FPS" : " MB"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="text-red-600">
                            {alert.current}
                            {alert.metric === "FPS" ? " FPS" : " MB"}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Change:</span>
                          <span className="text-red-600">
                            {alert.change > 0 ? "+" : ""}
                            {alert.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">
                        Build Information
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Version:</span>
                          <span className="font-mono">
                            {alert.buildInfo.version}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commit:</span>
                          <span className="font-mono">
                            {alert.buildInfo.commit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Branch:</span>
                          <span className="font-mono">
                            {alert.buildInfo.branch}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Affected:</span>
                          <span>{alert.affectedDevices.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent App Version Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading performance data...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-600">{error}</div>
            </div>
          ) : builds.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                No performance data available
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {builds.map((build, index) => (
                <Link
                  key={index}
                  href={`/versions/${encodeURIComponent(build.version)}`}
                  className="block"
                >
                  <div className="flex justify-between items-center p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(build.status)}`}
                      >
                        {build.status}
                      </span>
                      <div>
                        <div className="font-medium">{build.version}</div>
                        <div className="text-sm text-muted-foreground">
                          {build.commit} • {build.branch} •{" "}
                          {new Date(build.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">
                          {build.regressionScore}
                        </div>
                        <div className="text-muted-foreground">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {build.avgFps.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">FPS</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{build.avgMemory}</div>
                        <div className="text-muted-foreground">MB</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {build.avgCpu === 0 ? "N/A" : `${build.avgCpu}%*`}
                        </div>
                        <div className="text-muted-foreground">CPU</div>
                      </div>
                      <div className="text-muted-foreground">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CI/CD Integration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 rounded-lg">
              <div className="font-medium text-blue-900">
                GitHub Actions Integration
              </div>
              <div className="text-sm text-blue-700 mt-2">
                Add performance benchmarking to your CI pipeline with automated
                regression detection.
              </div>
              <pre className="mt-3 p-3 bg-card rounded text-xs overflow-x-auto">
                {`- name: Performance Benchmark
  run: |
    npm run benchmark
    curl -X POST $DOF_WEBHOOK_URL \\
      -H "Content-Type: application/json" \\
      -d @benchmark-results.json`}
              </pre>
            </div>

            <div className="p-4 bg-green-900/20 rounded-lg">
              <div className="font-medium text-green-900">
                Automated Thresholds
              </div>
              <div className="text-sm text-green-700 mt-1">
                • FPS regression {">"}5% = Warning, {">"}10% = Critical • Memory
                increase {">"}15% = Warning, {">"}25% = Critical
              </div>
            </div>

            <div className="p-4 bg-orange-900/20 rounded-lg">
              <div className="font-medium text-orange-900">
                Alert Integration
              </div>
              <div className="text-sm text-orange-700 mt-1">
                Critical regressions automatically create GitHub issues and send
                Slack notifications to the development team for immediate
                investigation.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
