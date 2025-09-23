"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricsTrend } from "@/lib/performance-data"

interface ABTestingPerformanceProps {
  performanceData: MetricsTrend[]
}

interface ABTestVariant {
  id: string
  name: string
  description: string
  users: number
  avgFps: number
  avgMemory: number
  avgCpu: number
  conversionRate: number
  retentionRate: number
  crashRate: number
  isControl: boolean
}

interface ABTest {
  id: string
  name: string
  status: "running" | "completed" | "planned"
  startDate: string
  endDate?: string
  variants: ABTestVariant[]
  winningVariant?: string
  significance: number
  primaryMetric: string
}

// Simulate A/B test data
const generateABTests = (performanceData: MetricsTrend[]): ABTest[] => {
  const basePerf = performanceData.slice(-10) // Last 10 data points
  const avgFps = basePerf.reduce((sum, p) => sum + p.fps, 0) / basePerf.length
  const avgMemory =
    basePerf.reduce((sum, p) => sum + p.memory_usage, 0) / basePerf.length
  const avgCpu =
    basePerf.reduce((sum, p) => sum + p.cpu_usage, 0) / basePerf.length

  return [
    {
      id: "test-001",
      name: "Rendering Pipeline Optimization",
      status: "completed",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      primaryMetric: "FPS",
      significance: 95.2,
      winningVariant: "variant-b",
      variants: [
        {
          id: "control",
          name: "Control (Current)",
          description: "Current rendering pipeline",
          users: 5000,
          avgFps: avgFps * 0.95,
          avgMemory: avgMemory,
          avgCpu: avgCpu,
          conversionRate: 12.4,
          retentionRate: 78.2,
          crashRate: 2.1,
          isControl: true,
        },
        {
          id: "variant-a",
          name: "Batched Rendering",
          description: "Batch draw calls for similar objects",
          users: 2500,
          avgFps: avgFps * 1.08,
          avgMemory: avgMemory * 0.95,
          avgCpu: avgCpu * 0.92,
          conversionRate: 13.1,
          retentionRate: 79.8,
          crashRate: 1.9,
          isControl: false,
        },
        {
          id: "variant-b",
          name: "GPU Instancing",
          description: "Use GPU instancing for repeated objects",
          users: 2500,
          avgFps: avgFps * 1.15,
          avgMemory: avgMemory * 0.88,
          avgCpu: avgCpu * 0.85,
          conversionRate: 14.2,
          retentionRate: 82.1,
          crashRate: 1.7,
          isControl: false,
        },
      ],
    },
    {
      id: "test-002",
      name: "Memory Management Strategy",
      status: "running",
      startDate: "2024-02-20",
      primaryMetric: "Memory Usage",
      significance: 87.3,
      variants: [
        {
          id: "control",
          name: "Control (GC Default)",
          description: "Default garbage collection settings",
          users: 3000,
          avgFps: avgFps,
          avgMemory: avgMemory,
          avgCpu: avgCpu,
          conversionRate: 13.8,
          retentionRate: 80.1,
          crashRate: 2.3,
          isControl: true,
        },
        {
          id: "variant-a",
          name: "Object Pooling",
          description:
            "Implement object pooling for frequently created objects",
          users: 3000,
          avgFps: avgFps * 1.03,
          avgMemory: avgMemory * 0.75,
          avgCpu: avgCpu * 1.02,
          conversionRate: 14.5,
          retentionRate: 81.7,
          crashRate: 1.8,
          isControl: false,
        },
      ],
    },
  ]
}

export function ABTestingPerformance({
  performanceData,
}: ABTestingPerformanceProps) {
  const abTests = generateABTests(performanceData)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-900/20 text-blue-700 border-blue-200"
      case "completed":
        return "bg-green-900/20 text-green-700 border-green-200"
      case "planned":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const calculateImprovement = (
    variant: ABTestVariant,
    control: ABTestVariant,
    metric: string
  ) => {
    let variantValue, controlValue
    switch (metric) {
      case "FPS":
        variantValue = variant.avgFps
        controlValue = control.avgFps
        break
      case "Memory Usage":
        variantValue = control.avgMemory // Inverted - lower is better
        controlValue = variant.avgMemory
        break
      default:
        return 0
    }
    return ((variantValue - controlValue) / controlValue) * 100
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>A/B Testing Performance Dashboard</CardTitle>
          <Button variant="outline" size="sm">
            Create New Test
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="text-center p-4 bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {abTests.filter(t => t.status === "running").length}
              </div>
              <div className="text-sm text-muted-foreground">Running Tests</div>
            </div>
            <div className="text-center p-4 bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {abTests.filter(t => t.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Tests
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {abTests.filter(t => t.status === "planned").length}
              </div>
              <div className="text-sm text-muted-foreground">Planned Tests</div>
            </div>
          </div>

          <div className="space-y-6">
            {abTests.map(test => {
              const control = test.variants.find(v => v.isControl)!
              const variants = test.variants.filter(v => !v.isControl)

              return (
                <div key={test.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{test.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(test.status)}`}
                        >
                          {test.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Primary Metric: {test.primaryMetric} • Started:{" "}
                        {test.startDate}
                        {test.endDate && ` • Ended: ${test.endDate}`}
                        {test.significance > 0 &&
                          ` • Significance: ${test.significance}%`}
                      </div>
                    </div>
                    {test.winningVariant && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          Winner
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {
                            test.variants.find(
                              v => v.id === test.winningVariant
                            )?.name
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {test.variants.map(variant => {
                      const improvement = variant.isControl
                        ? 0
                        : calculateImprovement(
                            variant,
                            control,
                            test.primaryMetric
                          )

                      return (
                        <div
                          key={variant.id}
                          className={`p-4 border rounded-lg ${
                            variant.isControl
                              ? "bg-muted"
                              : test.winningVariant === variant.id
                                ? "bg-green-900/20 border-green-200"
                                : "bg-card"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium">{variant.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {variant.description}
                              </div>
                            </div>
                            {!variant.isControl && improvement !== 0 && (
                              <div
                                className={`text-sm font-medium ${improvement > 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {improvement > 0 ? "+" : ""}
                                {improvement.toFixed(1)}%
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground">Users</div>
                              <div className="font-medium">
                                {variant.users.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">FPS</div>
                              <div className="font-medium">
                                {variant.avgFps.toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Memory
                              </div>
                              <div className="font-medium">
                                {variant.avgMemory.toFixed(0)}MB
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Conversion
                              </div>
                              <div className="font-medium">
                                {variant.conversionRate.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Retention
                              </div>
                              <div className="font-medium">
                                {variant.retentionRate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance A/B Testing Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 rounded-lg">
              <div className="font-medium text-green-900">
                Successful Optimization
              </div>
              <div className="text-sm text-green-700 mt-1">
                GPU Instancing variant improved FPS by 15% while reducing memory
                usage by 12%. This optimization is now rolled out to all users.
              </div>
            </div>

            <div className="p-4 bg-blue-900/20 rounded-lg">
              <div className="font-medium text-blue-900">Currently Testing</div>
              <div className="text-sm text-blue-700 mt-1">
                Object Pooling is showing promising results with 25% memory
                reduction. Test is 87% statistically significant and trending
                positive.
              </div>
            </div>

            <div className="p-4 bg-purple-900/20 rounded-lg">
              <div className="font-medium text-purple-900">
                Performance Impact
              </div>
              <div className="text-sm text-purple-700 mt-1">
                A/B testing has led to cumulative improvements: +18% FPS, -20%
                memory usage. User retention increased by 4.2% following these
                optimizations.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
