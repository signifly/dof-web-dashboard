"use client"

import * as React from "react"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowUpDown,
  Download,
  Clock,
  Activity,
  Database,
  Users,
  Loader2,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SearchQuery,
  SearchResults as SearchResultsData,
  SearchMetric,
  SearchSession,
} from "@/lib/services/search-service"

interface SearchResultsProps {
  results: SearchResultsData | null
  query: SearchQuery
  isLoading?: boolean
  onSort: (
    sortBy: SearchQuery["sortBy"],
    sortOrder: SearchQuery["sortOrder"]
  ) => void
  onPageChange: (offset: number) => void
  className?: string
}

type ResultType = "metrics" | "sessions" | "all"

export function SearchResults({
  results,
  query,
  isLoading = false,
  onSort,
  onPageChange,
  className,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultType>("all")
  const [currentPage, setCurrentPage] = useState(0)

  const itemsPerPage = query.limit || 100
  const totalPages = results ? Math.ceil(results.total / itemsPerPage) : 0

  // Handle sorting
  const handleSort = (field: SearchQuery["sortBy"]) => {
    const newSortOrder =
      query.sortBy === field && query.sortOrder === "desc" ? "asc" : "desc"
    onSort(field, newSortOrder)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    onPageChange(page * itemsPerPage)
  }

  // Export functionality
  const exportToCSV = () => {
    if (!results) return

    let dataToExport: any[] = []
    let headers: string[] = []

    if (activeTab === "metrics" || activeTab === "all") {
      headers = [
        "Type",
        "Metric Type",
        "Value",
        "Timestamp",
        "Session ID",
        "Context",
      ]

      const metricsData = results.metrics.map(metric => [
        "Metric",
        metric.metric_type,
        metric.metric_value,
        new Date(metric.timestamp).toISOString(),
        metric.session_id,
        JSON.stringify(metric.context || {}),
      ])

      dataToExport = [...dataToExport, ...metricsData]
    }

    if (activeTab === "sessions" || activeTab === "all") {
      if (activeTab === "sessions") {
        headers = [
          "Session ID",
          "Device Type",
          "App Version",
          "OS Version",
          "Session Start",
          "Duration",
          "Anonymous User ID",
        ]
      }

      const sessionsData = results.sessions.map(session => [
        ...(activeTab === "all" ? ["Session"] : []),
        session.id,
        session.device_type,
        session.app_version,
        session.os_version,
        new Date(session.session_start).toISOString(),
        session.session_end
          ? Math.round(
              (new Date(session.session_end).getTime() -
                new Date(session.session_start).getTime()) /
                1000
            ) + "s"
          : "",
        session.anonymous_user_id,
      ])

      dataToExport = [...dataToExport, ...sessionsData]
    }

    const csvContent = [headers, ...dataToExport]
      .map(row => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `search-results-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Format metric value for display
  const formatMetricValue = (value: number, type: string): string => {
    switch (type) {
      case "fps":
        return `${value.toFixed(1)} fps`
      case "memory_usage":
        return `${(value / 1024 / 1024).toFixed(1)} MB`
      case "cpu_usage":
        return `${value.toFixed(1)}%`
      case "battery_level":
        return `${value.toFixed(0)}%`
      case "network_latency":
      case "screen_load":
      case "navigation_time":
      case "load_time":
        return `${value.toFixed(0)}ms`
      default:
        return value.toString()
    }
  }

  // Format session duration
  const formatDuration = (duration: number | null): string => {
    if (!duration) return "N/A"

    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // Get metric type badge variant
  const getMetricBadgeVariant = (
    metricType: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (metricType) {
      case "fps":
      case "cpu_usage":
      case "memory_usage":
        return "default"
      case "screen_load":
      case "navigation_time":
      case "load_time":
        return "secondary"
      case "battery_level":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Searching performance data...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Run a search to see performance data results
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasResults = results.total > 0
  const metricsCount = results.metrics.length
  const sessionsCount = results.sessions.length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Search Results
              </CardTitle>
              <CardDescription>
                Found {results.total.toLocaleString()} results in{" "}
                {results.executionTime}ms
                {results.hasMore && " (showing first page)"}
              </CardDescription>
            </div>
            {hasResults && (
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Results Summary */}
          {hasResults && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {metricsCount} metrics
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {sessionsCount} sessions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Sort: {query.sortBy || "timestamp"} (
                  {query.sortOrder || "desc"})
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        {hasResults && (
          <CardContent className="pt-0">
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as ResultType)}
            >
              <TabsList>
                <TabsTrigger value="all">
                  All Results ({results.total})
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <Activity className="h-4 w-4 mr-1" />
                  Metrics ({metricsCount})
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <Users className="h-4 w-4 mr-1" />
                  Sessions ({sessionsCount})
                </TabsTrigger>
              </TabsList>

              {/* Sorting Controls */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Sort by:
                  </span>
                  <Select
                    value={query.sortBy || "timestamp"}
                    onValueChange={value =>
                      handleSort(value as SearchQuery["sortBy"])
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timestamp">Timestamp</SelectItem>
                      <SelectItem value="metric_value">Metric Value</SelectItem>
                      <SelectItem value="created_at">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort(query.sortBy || "timestamp")}
                  className="flex items-center gap-1"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {query.sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>

              {/* Results Content */}
              <div className="mt-6">
                <TabsContent value="all" className="mt-0">
                  <AllResultsTable
                    metrics={results.metrics}
                    sessions={results.sessions}
                    formatMetricValue={formatMetricValue}
                    formatDuration={formatDuration}
                    getMetricBadgeVariant={getMetricBadgeVariant}
                  />
                </TabsContent>

                <TabsContent value="metrics" className="mt-0">
                  <MetricsTable
                    metrics={results.metrics}
                    formatMetricValue={formatMetricValue}
                    getMetricBadgeVariant={getMetricBadgeVariant}
                  />
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  <SessionsTable
                    sessions={results.sessions}
                    formatDuration={formatDuration}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {hasResults && results.hasMore && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasResults && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or date range
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// All Results Combined Table
function AllResultsTable({
  metrics,
  sessions,
  formatMetricValue,
  formatDuration,
  getMetricBadgeVariant,
}: {
  metrics: SearchMetric[]
  sessions: SearchSession[]
  formatMetricValue: (value: number, type: string) => string
  formatDuration: (duration: number | null) => string
  getMetricBadgeVariant: (
    type: string
  ) => "default" | "secondary" | "destructive" | "outline"
}) {
  // Combine and sort all results by timestamp
  const allResults = [
    ...metrics.map(m => ({
      type: "metric" as const,
      data: m,
      timestamp: m.timestamp,
    })),
    ...sessions.map(s => ({
      type: "session" as const,
      data: s,
      timestamp: s.session_start,
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Value/Info</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Context</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allResults.map((result, index) => (
            <TableRow key={index}>
              <TableCell>
                {result.type === "metric" ? (
                  <Badge variant="default">
                    <Activity className="h-3 w-3 mr-1" />
                    Metric
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    Session
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {result.type === "metric" ? (
                  <div>
                    <Badge
                      variant={getMetricBadgeVariant(result.data.metric_type)}
                    >
                      {result.data.metric_type}
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{result.data.device_type}</div>
                    <div className="text-sm text-muted-foreground">
                      v{result.data.app_version}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {result.type === "metric" ? (
                  formatMetricValue(
                    result.data.metric_value,
                    result.data.metric_type
                  )
                ) : (
                  <div>
                    <div>
                      Duration:{" "}
                      {formatDuration(
                        result.data.session_end
                          ? Math.round(
                              (new Date(result.data.session_end).getTime() -
                                new Date(result.data.session_start).getTime()) /
                                1000
                            )
                          : null
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      OS: {result.data.os_version}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                {result.type === "metric" ? (
                  <div className="max-w-xs">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {result.data.session_id?.substring(0, 8)}...
                    </code>
                  </div>
                ) : (
                  <div className="max-w-xs">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {result.data.anonymous_user_id?.substring(0, 8) || "N/A"}
                      ...
                    </code>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Metrics-only Table
function MetricsTable({
  metrics,
  formatMetricValue,
  getMetricBadgeVariant,
}: {
  metrics: SearchMetric[]
  formatMetricValue: (value: number, type: string) => string
  getMetricBadgeVariant: (
    type: string
  ) => "default" | "secondary" | "destructive" | "outline"
}) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No metrics found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Session ID</TableHead>
            <TableHead>Context</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric, index) => (
            <TableRow key={index}>
              <TableCell>
                <Badge variant={getMetricBadgeVariant(metric.metric_type)}>
                  {metric.metric_type}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">
                {formatMetricValue(metric.metric_value, metric.metric_type)}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(metric.timestamp).toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {metric.session_id?.substring(0, 12)}...
                </code>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  {metric.context ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        View context
                      </summary>
                      <pre className="text-xs mt-2 p-2 bg-muted rounded">
                        {JSON.stringify(metric.context, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No context
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Sessions-only Table
function SessionsTable({
  sessions,
  formatDuration,
}: {
  sessions: SearchSession[]
  formatDuration: (duration: number | null) => string
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sessions found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>App Version</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session, index) => (
            <TableRow key={index}>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {session.id.substring(0, 12)}...
                </code>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{session.device_type}</div>
                  <div className="text-xs text-muted-foreground">
                    OS: {session.os_version}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">v{session.app_version}</Badge>
              </TableCell>
              <TableCell>
                {formatDuration(
                  session.session_end
                    ? Math.round(
                        (new Date(session.session_end).getTime() -
                          new Date(session.session_start).getTime()) /
                          1000
                      )
                    : null
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(session.session_start).toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {session.anonymous_user_id?.substring(0, 8) || "N/A"}...
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
