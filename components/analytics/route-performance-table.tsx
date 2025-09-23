"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoutePerformanceData } from "@/types/route-performance"
import { ArrowUpDown, Download, Search, Filter } from "lucide-react"

interface RoutePerformanceTableProps {
  routes: RoutePerformanceData[]
}

type SortField = "routeName" | "performanceScore" | "avgFps" | "avgMemory" | "avgCpu" | "totalSessions"
type SortDirection = "asc" | "desc"
type RiskFilter = "all" | "low" | "medium" | "high"

export function RoutePerformanceTable({ routes }: RoutePerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("performanceScore")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")

  const filteredAndSortedRoutes = routes
    .filter(route => {
      const matchesSearch =
        route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.routePattern.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRisk = riskFilter === "all" || route.riskLevel === riskFilter

      return matchesSearch && matchesRisk
    })
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "routeName":
          aValue = a.routeName
          bValue = b.routeName
          break
        case "performanceScore":
          aValue = a.performanceScore
          bValue = b.performanceScore
          break
        case "avgFps":
          aValue = a.avgFps
          bValue = b.avgFps
          break
        case "avgMemory":
          aValue = a.avgMemory
          bValue = b.avgMemory
          break
        case "avgCpu":
          aValue = a.avgCpu
          bValue = b.avgCpu
          break
        case "totalSessions":
          aValue = a.totalSessions
          bValue = b.totalSessions
          break
        default:
          aValue = a.performanceScore
          bValue = b.performanceScore
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Route Name",
      "Route Pattern",
      "Performance Score",
      "Risk Level",
      "Avg FPS",
      "Avg Memory (MB)",
      "Avg CPU (%)",
      "Total Sessions",
      "Unique Devices",
      "Avg Duration (ms)"
    ]

    const csvData = filteredAndSortedRoutes.map(route => [
      route.routeName,
      route.routePattern,
      route.performanceScore,
      route.riskLevel,
      route.avgFps,
      route.avgMemory,
      route.avgCpu,
      route.totalSessions,
      route.uniqueDevices,
      route.avgScreenDuration
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `route-performance-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "secondary"
      case "medium":
        return "outline"
      case "high":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈"
      case "degrading":
        return "📉"
      case "stable":
      default:
        return "➡️"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Route Performance Analysis</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
              className="w-32 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              <option value="all">All Risk</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedRoutes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="border-b">
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("routeName")}
                      className="h-auto p-0 font-semibold"
                    >
                      Route
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">Pattern</th>
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("performanceScore")}
                      className="h-auto p-0 font-semibold"
                    >
                      Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">Risk</th>
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("avgFps")}
                      className="h-auto p-0 font-semibold"
                    >
                      FPS
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("avgMemory")}
                      className="h-auto p-0 font-semibold"
                    >
                      Memory
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("avgCpu")}
                      className="h-auto p-0 font-semibold"
                    >
                      CPU
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("totalSessions")}
                      className="h-auto p-0 font-semibold"
                    >
                      Sessions
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="border border-border p-3 text-left">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRoutes.map((route) => (
                  <tr key={`${route.routeName}-${route.routePattern}`} className="border-b hover:bg-muted/50">
                    <td className="border border-border p-3">
                      <div>
                        <div className="font-medium">{route.routeName}</div>
                        <div className="text-xs text-muted-foreground">
                          {route.uniqueDevices} devices
                        </div>
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {route.routePattern}
                      </code>
                    </td>
                    <td className="border border-border p-3">
                      <div className="font-bold text-lg">
                        {route.performanceScore}
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <Badge variant={getRiskBadgeVariant(route.riskLevel)}>
                        {route.riskLevel}
                      </Badge>
                    </td>
                    <td className="border border-border p-3">
                      <div>{route.avgFps}</div>
                      <div className="text-xs text-muted-foreground">
                        {route.relativePerformance.fpsVsAverage > 0 ? "+" : ""}
                        {route.relativePerformance.fpsVsAverage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <div>{route.avgMemory} MB</div>
                      <div className="text-xs text-muted-foreground">
                        {route.relativePerformance.memoryVsAverage > 0 ? "+" : ""}
                        {route.relativePerformance.memoryVsAverage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <div>{route.avgCpu}%</div>
                      <div className="text-xs text-muted-foreground">
                        {route.relativePerformance.cpuVsAverage > 0 ? "+" : ""}
                        {route.relativePerformance.cpuVsAverage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <div>{route.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">
                        {(route.avgScreenDuration / 1000).toFixed(1)}s avg
                      </div>
                    </td>
                    <td className="border border-border p-3">
                      <div className="flex items-center gap-1">
                        <span>{getTrendIcon(route.performanceTrend)}</span>
                        <span className="text-xs capitalize">
                          {route.performanceTrend}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {routes.length === 0
                ? "No route performance data available. Make sure screen_time metrics are being collected."
                : "No routes match the current filters."
              }
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAndSortedRoutes.length} of {routes.length} routes
        </div>
      </CardContent>
    </Card>
  )
}