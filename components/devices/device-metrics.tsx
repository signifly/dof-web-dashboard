"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeviceMetricPoint } from "@/types/device"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DeviceMetricsProps {
  deviceId: string
  metrics: DeviceMetricPoint[]
}

export function DeviceMetrics({ deviceId, metrics }: DeviceMetricsProps) {
  // Prepare chart data
  const chartData = metrics.map(metric => ({
    ...metric,
    timestamp: format(new Date(metric.timestamp), "MMM d, HH:mm"),
    timestampFull: metric.timestamp,
  }))

  // Calculate performance distribution
  const performanceDistribution = metrics.reduce(
    (dist, metric) => {
      if (metric.fps >= 50) dist.excellent++
      else if (metric.fps >= 30) dist.good++
      else if (metric.fps >= 20) dist.fair++
      else dist.poor++
      return dist
    },
    { excellent: 0, good: 0, fair: 0, poor: 0 }
  )

  const distributionData = [
    {
      name: "Excellent (50+ FPS)",
      value: performanceDistribution.excellent,
      color: "#10b981",
    },
    {
      name: "Good (30-49 FPS)",
      value: performanceDistribution.good,
      color: "#f59e0b",
    },
    {
      name: "Fair (20-29 FPS)",
      value: performanceDistribution.fair,
      color: "#f97316",
    },
    {
      name: "Poor (<20 FPS)",
      value: performanceDistribution.poor,
      color: "#ef4444",
    },
  ].filter(item => item.value > 0)

  // Memory usage trends
  const memoryTrends = chartData.filter(d => d.memory > 0)

  // Enhanced screen breakdown using route patterns
  const screenBreakdown = metrics.reduce(
    (screens, metric) => {
      const screen = metric.displayName || metric.screenName
      const routePattern = metric.routePattern || metric.screenName

      screens[screen] = {
        count: (screens[screen]?.count || 0) + 1,
        routePattern,
        isDynamic: metric.isDynamic || false,
        routePath: metric.routePath || null,
      }
      return screens
    },
    {} as Record<
      string,
      {
        count: number
        routePattern: string
        isDynamic: boolean
        routePath: string | null
      }
    >
  )

  const screenData = Object.entries(screenBreakdown)
    .map(([screen, data]) => ({
      screen,
      count: data.count,
      routePattern: data.routePattern,
      isDynamic: data.isDynamic,
      routePath: data.routePath,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 screens

  if (!metrics.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No Performance Data</h3>
            <p className="text-muted-foreground">
              No performance metrics have been recorded for this device in the
              selected period.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Performance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Performance measurements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg FPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length || 0
              ).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Frames per second</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                metrics
                  .filter(m => m.memory > 0)
                  .reduce((sum, m) => sum + m.memory, 0) /
                  (metrics.filter(m => m.memory > 0).length || 1) || 0
              )}{" "}
              MB
            </div>
            <p className="text-xs text-muted-foreground">Memory usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unique Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(screenBreakdown).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different routes/screens visited
            </p>
            {Object.values(screenBreakdown).some(s => s.isDynamic) && (
              <p className="text-xs text-blue-600 mt-1">
                Includes dynamic routes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FPS Performance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>FPS Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  label={{ value: "FPS", angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={label => `Time: ${label}`}
                  formatter={(value: number, name: string, props: any) => {
                    const data = props.payload
                    return [`${value.toFixed(1)} FPS`, "FPS"]
                  }}
                  labelStyle={{ marginBottom: "8px" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null

                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium mb-2">{`Time: ${label}`}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-green-600">{`FPS: ${data.fps?.toFixed(1) || "N/A"}`}</p>
                          {data.displayName &&
                            data.displayName !== "Unknown" && (
                              <p className="text-muted-foreground">{`Screen: ${data.displayName}`}</p>
                            )}
                          {data.routePath && (
                            <p className="text-xs text-muted-foreground font-mono">{`Route: ${data.routePath}`}</p>
                          )}
                          {data.isDynamic && (
                            <p className="text-xs text-blue-600">
                              Dynamic Route
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fps"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#fpsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Memory Usage Timeline */}
        {memoryTrends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memoryTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                    <YAxis
                      label={{
                        value: "MB",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null

                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="text-sm font-medium mb-2">{`Time: ${label}`}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-orange-600">{`Memory: ${data.memory?.toFixed(1) || "N/A"} MB`}</p>
                              {data.displayName &&
                                data.displayName !== "Unknown" && (
                                  <p className="text-muted-foreground">{`Screen: ${data.displayName}`}</p>
                                )}
                              {data.routePath && (
                                <p className="text-xs text-muted-foreground font-mono">{`Route: ${data.routePath}`}</p>
                              )}
                              {data.isDynamic && (
                                <p className="text-xs text-blue-600">
                                  Dynamic Route
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }: any) =>
                      `${name}: ${((percent as number) * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} measurements`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Usage Breakdown */}
      {screenData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Usage Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Performance measurements by route/screen
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={screenData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="screen"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: 'Measurements',
                      angle: -90,
                      position: 'insideLeft'
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null

                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
                          <p className="text-sm font-medium mb-2">{`Screen: ${data.screen}`}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-blue-600 font-medium">{`${data.count} measurements`}</p>
                            {data.routePath &&
                              data.routePath !== data.screen && (
                                <p className="text-xs text-muted-foreground font-mono break-all">{`Route: ${data.routePath}`}</p>
                              )}
                            {data.routePattern &&
                              data.routePattern !== data.screen &&
                              data.routePattern !== data.routePath && (
                                <p className="text-xs text-muted-foreground">{`Pattern: ${data.routePattern}`}</p>
                              )}
                            {data.isDynamic && (
                              <p className="text-xs text-green-600 font-medium">
                                🔗 Dynamic Route
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {((data.count / metrics.length) * 100).toFixed(1)}% of total measurements
                            </p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {screenData.length > 8 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing top 10 most visited routes
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance Snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Screen</th>
                  <th className="text-left p-2">FPS</th>
                  <th className="text-left p-2">Memory</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .slice(-10)
                  .reverse()
                  .map((metric, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="p-2 font-mono text-xs">
                        {format(new Date(metric.timestamp), "MMM d, HH:mm:ss")}
                      </td>
                      <td className="p-2 max-w-32">
                        <div
                          className="truncate"
                          title={metric.routePath || metric.screenName}
                        >
                          <span className="font-medium">
                            {metric.displayName || metric.screenName}
                          </span>
                          {metric.isDynamic && (
                            <span className="text-xs text-blue-600 ml-1">
                              [dynamic]
                            </span>
                          )}
                        </div>
                        {metric.routePath &&
                          metric.routePath !== metric.screenName && (
                            <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                              {metric.routePath}
                            </div>
                          )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              metric.fps >= 50
                                ? "bg-green-500"
                                : metric.fps >= 30
                                  ? "bg-yellow-500"
                                  : metric.fps >= 20
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                            }`}
                          />
                          <span>{metric.fps.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        {metric.memory > 0
                          ? `${metric.memory.toFixed(0)} MB`
                          : "N/A"}
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            metric.fps >= 50
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : metric.fps >= 30
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : metric.fps >= 20
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {metric.fps >= 50
                            ? "Excellent"
                            : metric.fps >= 30
                              ? "Good"
                              : metric.fps >= 20
                                ? "Fair"
                                : "Poor"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
