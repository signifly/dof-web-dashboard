/**
 * Alert Stats Component
 * Displays alert statistics in card format
 */

"use client"

import { AlertInstance, AlertStats } from "@/types/alerts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, Bell } from "lucide-react"

interface AlertStatsProps {
  alerts: AlertInstance[]
  className?: string
}

export function AlertStatsCards({ alerts, className }: AlertStatsProps) {
  const calculateStats = (alerts: AlertInstance[]): AlertStats => {
    const total = alerts.length
    const active = alerts.filter(a => a.status === "active").length
    const acknowledged = alerts.filter(a => a.status === "acknowledged").length
    const resolved = alerts.filter(a => a.status === "resolved").length
    const critical = alerts.filter(a => a.severity === "critical").length
    const warning = alerts.filter(a => a.severity === "warning").length

    return {
      total,
      active,
      acknowledged,
      resolved,
      critical,
      warning,
    }
  }

  const stats = calculateStats(alerts)

  const statCards = [
    {
      title: "Total Alerts",
      value: stats.total,
      icon: Bell,
      description: "Last 24 hours",
      color: "text-blue-600",
    },
    {
      title: "Active",
      value: stats.active,
      icon: AlertTriangle,
      description: "Require attention",
      color: "text-orange-600",
    },
    {
      title: "Critical",
      value: stats.critical,
      icon: AlertTriangle,
      description: "High priority",
      color: "text-red-600",
    },
    {
      title: "Warnings",
      value: stats.warning,
      icon: AlertTriangle,
      description: "Monitor closely",
      color: "text-yellow-600",
    },
    {
      title: "Acknowledged",
      value: stats.acknowledged,
      icon: Clock,
      description: "Being handled",
      color: "text-blue-600",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      description: "Successfully handled",
      color: "text-green-600",
    },
  ]

  return (
    <div className={`grid gap-4 md:grid-cols-3 lg:grid-cols-6 ${className}`}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Alternative compact stats display
export function AlertStatsCompact({ alerts, className }: AlertStatsProps) {
  const stats = alerts.reduce(
    (acc, alert) => {
      acc.total++
      if (alert.status === "active") acc.active++
      if (alert.severity === "critical") acc.critical++
      if (alert.severity === "warning") acc.warning++
      if (alert.status === "resolved") acc.resolved++
      return acc
    },
    { total: 0, active: 0, critical: 0, warning: 0, resolved: 0 }
  )

  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      <div className="flex items-center space-x-2">
        <Bell className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">{stats.total} Total</span>
      </div>

      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium">{stats.active} Active</span>
      </div>

      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium">{stats.critical} Critical</span>
      </div>

      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium">{stats.warning} Warnings</span>
      </div>

      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium">{stats.resolved} Resolved</span>
      </div>
    </div>
  )
}
