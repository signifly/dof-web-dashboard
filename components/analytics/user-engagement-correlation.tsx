"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsTrend } from "@/lib/performance-data"

interface UserEngagementCorrelationProps {
  performanceData: MetricsTrend[]
}

interface EngagementMetric {
  timestamp: string
  sessionDuration: number
  screenViews: number
  userInteractions: number
  crashRate: number
  appVersion: string
}

// Simulated user engagement data - in real app this would come from analytics
const generateEngagementData = (
  performanceData: MetricsTrend[]
): EngagementMetric[] => {
  return performanceData.map(perf => {
    // Simulate correlation: better FPS = higher engagement
    const fpsQuality = perf.fps / 60 // normalize to 0-1
    const memoryImpact = Math.max(0, 1 - perf.memory_usage / 500) // normalize memory impact

    return {
      timestamp: perf.timestamp,
      sessionDuration: Math.round(300 + fpsQuality * 600), // 5-15 minutes
      screenViews: Math.round(5 + fpsQuality * 15), // 5-20 screens
      userInteractions: Math.round(20 + fpsQuality * 100), // 20-120 interactions
      crashRate: Math.max(0, (1 - fpsQuality) * 5), // 0-5% crash rate
      appVersion: "1.0.0",
    }
  })
}

export function UserEngagementCorrelation({
  performanceData,
}: UserEngagementCorrelationProps) {
  const engagementData = generateEngagementData(performanceData)

  // Calculate correlations
  const correlations = {
    fpsVsSessionDuration: calculateCorrelation(
      performanceData.map(p => p.fps),
      engagementData.map(e => e.sessionDuration)
    ),
    memoryVsInteractions: calculateCorrelation(
      performanceData.map(p => p.memory_usage),
      engagementData.map(e => e.userInteractions)
    ),
  }

  // Performance segments analysis
  const segments = analyzePerformanceSegments(performanceData, engagementData)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance-Engagement Correlation Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(correlations.fpsVsSessionDuration * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                FPS vs Session Duration Correlation
              </div>
            </div>

            <div className="text-center p-4 bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.abs(correlations.memoryVsInteractions * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Memory vs Interactions Correlation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Segments Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{segment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    FPS: {segment.avgFps.toFixed(1)} | Memory:{" "}
                    {segment.avgMemory.toFixed(0)}MB
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {segment.avgSessionDuration.toFixed(0)}min sessions
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {segment.avgInteractions.toFixed(0)} interactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Impact Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <div className="font-medium text-blue-900">High FPS Impact</div>
              <div className="text-sm text-blue-700">
                Users with 50+ FPS have{" "}
                {(
                  ((segments[0]?.avgSessionDuration || 0) /
                    (segments[2]?.avgSessionDuration || 1)) *
                    100 -
                  100
                ).toFixed(0)}
                % longer sessions
              </div>
            </div>

            <div className="p-3 bg-orange-900/20 rounded-lg">
              <div className="font-medium text-orange-900">
                Memory Usage Impact
              </div>
              <div className="text-sm text-orange-700">
                High memory usage ({">"}300MB) reduces user interactions by ~
                {(
                  (segments[0]?.avgInteractions || 0) -
                  (segments[2]?.avgInteractions || 0)
                ).toFixed(0)}{" "}
                per session
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  )

  return denominator === 0 ? 0 : numerator / denominator
}

function analyzePerformanceSegments(
  performanceData: MetricsTrend[],
  engagementData: EngagementMetric[]
) {
  // Group by performance levels
  const segments = [
    { name: "High Performance", minFps: 50, maxMemory: 200 },
    { name: "Medium Performance", minFps: 30, maxMemory: 300 },
    { name: "Low Performance", minFps: 0, maxMemory: Infinity },
  ]

  return segments.map(segment => {
    const indices = performanceData
      .map((perf, i) =>
        perf.fps >= segment.minFps && perf.memory_usage <= segment.maxMemory
          ? i
          : -1
      )
      .filter(i => i !== -1)

    if (indices.length === 0) {
      return {
        ...segment,
        avgFps: 0,
        avgMemory: 0,
        avgSessionDuration: 0,
        avgInteractions: 0,
        avgScreenViews: 0,
      }
    }

    const segmentPerf = indices.map(i => performanceData[i])
    const segmentEng = indices.map(i => engagementData[i])

    return {
      ...segment,
      avgFps:
        segmentPerf.reduce((sum, p) => sum + p.fps, 0) / segmentPerf.length,
      avgMemory:
        segmentPerf.reduce((sum, p) => sum + p.memory_usage, 0) /
        segmentPerf.length,
      avgSessionDuration:
        segmentEng.reduce((sum, e) => sum + e.sessionDuration, 0) /
        segmentEng.length /
        60, // convert to minutes
      avgInteractions:
        segmentEng.reduce((sum, e) => sum + e.userInteractions, 0) /
        segmentEng.length,
      avgScreenViews:
        segmentEng.reduce((sum, e) => sum + e.screenViews, 0) /
        segmentEng.length,
    }
  })
}
