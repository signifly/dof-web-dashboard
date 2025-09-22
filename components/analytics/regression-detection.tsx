"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricsTrend } from "@/lib/performance-data"

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
  avgLoadTime: number
  avgCpu: number
  regressionScore: number
  status: "passed" | "failed" | "warning"
}

// Generate regression alerts and build performance data
const generateRegressionData = (performanceData: MetricsTrend[]) => {
  const builds: BuildPerformance[] = [
    {
      version: "v1.2.3",
      commit: "a1b2c3d",
      branch: "main",
      timestamp: "2024-02-20T10:30:00Z",
      avgFps: 58.2,
      avgMemory: 145,
      avgLoadTime: 820,
      avgCpu: 42,
      regressionScore: 95,
      status: "passed",
    },
    {
      version: "v1.2.4",
      commit: "e4f5g6h",
      branch: "main",
      timestamp: "2024-02-21T14:20:00Z",
      avgFps: 52.1,
      avgMemory: 168,
      avgLoadTime: 950,
      avgCpu: 48,
      regressionScore: 72,
      status: "warning",
    },
    {
      version: "v1.2.5",
      commit: "i7j8k9l",
      branch: "feature/optimization",
      timestamp: "2024-02-22T09:15:00Z",
      avgFps: 61.3,
      avgMemory: 132,
      avgLoadTime: 780,
      avgCpu: 38,
      regressionScore: 98,
      status: "passed",
    },
  ]

  const alerts: RegressionAlert[] = [
    {
      id: "alert-001",
      severity: "critical",
      metric: "FPS",
      change: -10.5,
      baseline: 58.2,
      current: 52.1,
      buildInfo: builds[1],
      affectedDevices: ["Android", "iOS"],
      status: "investigating",
    },
    {
      id: "alert-002",
      severity: "warning",
      metric: "Memory Usage",
      change: 15.8,
      baseline: 145,
      current: 168,
      buildInfo: builds[1],
      affectedDevices: ["Android"],
      status: "new",
    },
    {
      id: "alert-003",
      severity: "warning",
      metric: "Load Time",
      change: 15.9,
      baseline: 820,
      current: 950,
      buildInfo: builds[1],
      affectedDevices: ["Android", "iOS", "Web"],
      status: "new",
    },
  ]

  return { builds, alerts }
}

export function RegressionDetection({
  performanceData,
}: RegressionDetectionProps) {
  const { builds, alerts } = generateRegressionData(performanceData)

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
                            {alert.metric === "FPS"
                              ? " FPS"
                              : alert.metric === "Memory Usage"
                                ? " MB"
                                : " ms"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="text-red-600">
                            {alert.current}
                            {alert.metric === "FPS"
                              ? " FPS"
                              : alert.metric === "Memory Usage"
                                ? " MB"
                                : " ms"}
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
          <CardTitle>Recent Build Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {builds.map((build, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
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
                    <div className="font-medium">{build.regressionScore}</div>
                    <div className="text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{build.avgFps.toFixed(1)}</div>
                    <div className="text-muted-foreground">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{build.avgMemory}</div>
                    <div className="text-muted-foreground">MB</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{build.avgLoadTime}</div>
                    <div className="text-muted-foreground">ms</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{build.avgCpu}%</div>
                    <div className="text-muted-foreground">CPU</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                increase {">"}15% = Warning, {">"}25% = Critical • Load time
                increase {">"}20% = Warning, {">"}35% = Critical
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
