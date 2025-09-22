/**
 * Alert Banner Component
 * Displays a prominent alert notification with action buttons
 */

"use client"

import { AlertInstance } from "@/types/alerts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertBannerProps {
  alert: AlertInstance
  onDismiss?: () => void
  onAcknowledge?: () => Promise<void>
  onResolve?: () => Promise<void>
  className?: string
}

export function AlertBanner({
  alert,
  onDismiss,
  onAcknowledge,
  onResolve,
  className,
}: AlertBannerProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          border: "border-l-red-500",
          background: "bg-red-50",
          text: "text-red-800",
          iconColor: "text-red-600",
        }
      case "warning":
        return {
          border: "border-l-yellow-500",
          background: "bg-yellow-50",
          text: "text-yellow-800",
          iconColor: "text-yellow-600",
        }
      default:
        return {
          border: "border-l-blue-500",
          background: "bg-blue-50",
          text: "text-blue-800",
          iconColor: "text-blue-600",
        }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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

  const styles = getSeverityStyles(alert.severity)
  const isActive = alert.status === "active"
  const isAcknowledged = alert.status === "acknowledged"

  return (
    <Alert
      className={cn(
        "border-l-4",
        styles.border,
        styles.background,
        styles.text,
        "relative",
        className
      )}
    >
      <div className="flex items-start space-x-4">
        <div className={cn("mt-0.5", styles.iconColor)}>
          {getStatusIcon(alert.status)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <AlertTitle className="text-base font-semibold">
              {alert.config?.name || "Performance Alert"}
            </AlertTitle>

            <div className="flex items-center space-x-2">
              <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                {alert.severity.toUpperCase()}
              </Badge>

              <Badge variant="outline">{alert.status.toUpperCase()}</Badge>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <AlertDescription className="text-sm mb-3">
            {alert.message}
          </AlertDescription>

          <div className="flex items-center justify-between">
            <div className="text-xs opacity-75">
              <span className="font-medium">Source:</span> {alert.source} •{" "}
              <span className="font-medium">Value:</span>{" "}
              {alert.metric_value.toFixed(2)} •{" "}
              <span className="font-medium">Time:</span>{" "}
              {new Date(alert.created_at).toLocaleString()}
            </div>

            <div className="flex space-x-2">
              {isActive && onAcknowledge && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAcknowledge}
                  className="h-8 px-3"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Acknowledge
                </Button>
              )}

              {(isActive || isAcknowledged) && onResolve && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResolve}
                  className="h-8 px-3"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Alert>
  )
}
