/**
 * Alert Configuration Page
 * Interface for managing alert rules and thresholds
 */

"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAlertConfigs } from "@/hooks/use-alert-configs"
import { AlertConfig, MetricType } from "@/types/alerts"
import { Settings, Plus, Edit, Trash2, Power, PowerOff } from "lucide-react"

export default function AlertConfigPage() {
  const { configs, loading, error, updateConfig, deleteConfig } =
    useAlertConfigs()
  const [selectedConfig, setSelectedConfig] = useState<AlertConfig | null>(null)

  const handleToggleConfig = async (config: AlertConfig) => {
    try {
      await updateConfig({
        id: config.id,
        is_active: !config.is_active,
      })
    } catch (error) {
      console.error("Failed to toggle config:", error)
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    if (confirm("Are you sure you want to delete this alert configuration?")) {
      try {
        await deleteConfig(configId)
      } catch (error) {
        console.error("Failed to delete config:", error)
      }
    }
  }

  const formatMetricType = (metricType: MetricType): string => {
    return metricType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatThreshold = (value: number, metricType: MetricType): string => {
    switch (metricType) {
      case "cpu_usage":
      case "memory_usage":
        return `${value}%`
      case "page_load_time":
      case "response_time":
        return `${value}ms`
      case "bundle_size":
        return `${(value / 1024).toFixed(1)}KB`
      default:
        return value.toString()
    }
  }

  if (error) {
    return (
      <DashboardLayout title="Alert Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Error Loading Configurations
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Alert Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Alert Configuration
            </h2>
            <p className="text-muted-foreground">
              Manage performance alert rules and notification settings.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Global Settings
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Alert Rule
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{configs.length}</div>
              <p className="text-xs text-muted-foreground">
                Configured alert rules
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Power className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configs.filter(c => c.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently monitoring
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <PowerOff className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configs.filter(c => !c.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Temporarily disabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Metric Types
              </CardTitle>
              <Badge variant="outline" className="h-4 px-1 text-xs">
                {new Set(configs.map(c => c.metric_type)).size}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(configs.map(c => c.metric_type)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different metric types
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Configurations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">
                  Loading configurations...
                </div>
              </div>
            ) : configs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  No Alert Rules Configured
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first alert rule to start monitoring performance.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert Rule
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Metric Type</TableHead>
                      <TableHead>Warning Threshold</TableHead>
                      <TableHead>Critical Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map(config => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {config.id.slice(0, 8)}...
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {formatMetricType(config.metric_type)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono text-sm">
                            {formatThreshold(
                              config.threshold_warning,
                              config.metric_type
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-mono text-sm">
                            {formatThreshold(
                              config.threshold_critical,
                              config.metric_type
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleConfig(config)}
                            className="p-1"
                          >
                            {config.is_active ? (
                              <Badge
                                variant="default"
                                className="flex items-center gap-1"
                              >
                                <Power className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <PowerOff className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </Button>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {new Date(config.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(config.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedConfig(config)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConfig(config.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add CPU Monitor</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add Memory Monitor</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add Load Time Monitor</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Settings className="h-6 w-6 mb-2" />
                <span>Import/Export Rules</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle>About Alert Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Metric Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>CPU Usage:</strong> Monitor system CPU utilization
                  </li>
                  <li>
                    • <strong>Memory Usage:</strong> Track memory consumption
                  </li>
                  <li>
                    • <strong>Page Load Time:</strong> Monitor web page
                    performance
                  </li>
                  <li>
                    • <strong>Response Time:</strong> API and service response
                    times
                  </li>
                  <li>
                    • <strong>Bundle Size:</strong> JavaScript bundle size
                    monitoring
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Alert Thresholds</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Warning:</strong> First level notification
                  </li>
                  <li>
                    • <strong>Critical:</strong> High priority alert requiring
                    immediate attention
                  </li>
                  <li>
                    • <strong>Auto-resolve:</strong> Alerts resolve when metrics
                    return to normal
                  </li>
                  <li>
                    • <strong>Regression Detection:</strong> Automatic
                    performance regression alerts
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
