/**
 * Alert List Component
 * Displays a list of alerts in a table format with actions
 */

"use client"

import { AlertInstance } from "@/types/alerts"
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
import { AlertTriangle, CheckCircle, Clock, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AlertListProps {
  alerts: AlertInstance[]
  onAcknowledge?: (alertId: string) => Promise<void>
  onResolve?: (alertId: string) => Promise<void>
  onViewDetails?: (alert: AlertInstance) => void
  loading?: boolean
}

export function AlertList({
  alerts,
  onAcknowledge,
  onResolve,
  onViewDetails,
  loading,
}: AlertListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive" as const
      case "warning":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "default" as const
      case "acknowledged":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  const formatMetricValue = (value: number, metricType?: string): string => {
    if (!metricType) return value.toFixed(2)

    switch (metricType) {
      case "cpu_usage":
      case "memory_usage":
        return `${value.toFixed(1)}%`
      case "page_load_time":
      case "response_time":
        return `${value.toFixed(0)}ms`
      case "bundle_size":
        return `${(value / 1024).toFixed(1)}KB`
      default:
        return value.toFixed(2)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading alerts...</div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium">No alerts found</h3>
        <p className="text-muted-foreground">
          All systems are operating normally
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Alert</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map(alert => (
            <TableRow
              key={alert.id}
              className={alert.status === "resolved" ? "opacity-60" : ""}
            >
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getSeverityIcon(alert.severity)}
                  {getStatusIcon(alert.status)}
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <div className="font-medium">
                    {alert.config?.name || "Performance Alert"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {alert.message}
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <Badge variant={getStatusBadgeVariant(alert.status)}>
                  {alert.status.toUpperCase()}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </TableCell>

              <TableCell>
                <div className="font-mono text-sm">
                  {formatMetricValue(
                    alert.metric_value,
                    alert.config?.metric_type
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Threshold:{" "}
                  {formatMetricValue(
                    alert.threshold_violated,
                    alert.config?.metric_type
                  )}
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm">{alert.source}</span>
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  {new Date(alert.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </div>
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(alert)}>
                        View Details
                      </DropdownMenuItem>
                    )}

                    {alert.status === "active" && onAcknowledge && (
                      <DropdownMenuItem onClick={() => onAcknowledge(alert.id)}>
                        Acknowledge
                      </DropdownMenuItem>
                    )}

                    {(alert.status === "active" ||
                      alert.status === "acknowledged") &&
                      onResolve && (
                        <DropdownMenuItem onClick={() => onResolve(alert.id)}>
                          Resolve
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
