/**
 * Enhanced Alerts Page with Real-time Supabase Integration
 * Replaces static data with dynamic alerting system
 */

"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertBanner } from "@/components/alerts/alert-banner"
import { AlertList } from "@/components/alerts/alert-list"
import { AlertStatsCards } from "@/components/alerts/alert-stats"
import { useAlerts } from "@/hooks/use-alerts"
import { AlertInstance, AlertFilters } from "@/types/alerts"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, Filter } from "lucide-react"

export default function AlertsPage() {
  const [filters, setFilters] = useState<AlertFilters>({})
  const [selectedAlert, setSelectedAlert] = useState<AlertInstance | null>(null)

  const { alerts, loading, error, acknowledgeAlert, resolveAlert, refetch } =
    useAlerts(filters)

  // Get active alerts for banner display
  const activeAlerts = alerts.filter(alert => alert.status === "active")
  const criticalAlerts = activeAlerts.filter(
    alert => alert.severity === "critical"
  )

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId)
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId)
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  const handleFilterChange = (newFilters: Partial<AlertFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleViewDetails = (alert: AlertInstance) => {
    setSelectedAlert(alert)
    // TODO: Open alert details modal
  }

  if (error) {
    return (
      <DashboardLayout title="Alert Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Error Loading Alerts
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Alert Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Alert Management
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage system alerts and notifications.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Alert Rule
            </Button>
          </div>
        </div>

        {/* Critical Alert Banners */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-600 flex items-center">
              Critical Alerts Requiring Immediate Attention
              <Badge variant="destructive" className="ml-2">
                {criticalAlerts.length}
              </Badge>
            </h3>
            {criticalAlerts.slice(0, 3).map(alert => (
              <AlertBanner
                key={alert.id}
                alert={alert}
                onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                onResolve={() => handleResolveAlert(alert.id)}
              />
            ))}
            {criticalAlerts.length > 3 && (
              <div className="text-sm text-muted-foreground">
                + {criticalAlerts.length - 3} more critical alerts
              </div>
            )}
          </div>
        )}

        {/* Alert Statistics */}
        <AlertStatsCards alerts={alerts} />

        {/* Quick Actions */}
        {activeAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quick Actions
                <Badge variant="outline">{activeAlerts.length} active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Acknowledge all active alerts
                    activeAlerts.forEach(alert =>
                      handleAcknowledgeAlert(alert.id)
                    )
                  }}
                  disabled={loading}
                >
                  Acknowledge All Active
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Mark all acknowledged as resolved
                    alerts
                      .filter(a => a.status === "acknowledged")
                      .forEach(alert => handleResolveAlert(alert.id))
                  }}
                  disabled={loading}
                >
                  Resolve All Acknowledged
                </Button>
                <Button variant="outline" onClick={refetch} disabled={loading}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Alerts
              <div className="flex items-center space-x-2">
                <Button
                  variant={
                    filters.status?.includes("active") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      status: filters.status?.includes("active")
                        ? []
                        : ["active"],
                    })
                  }
                >
                  Active Only
                </Button>
                <Button
                  variant={
                    filters.severity?.includes("critical")
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      severity: filters.severity?.includes("critical")
                        ? []
                        : ["critical"],
                    })
                  }
                >
                  Critical Only
                </Button>
                {(filters.status || filters.severity) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({})}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertList
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
              onViewDetails={handleViewDetails}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Alert Configuration Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Monitoring Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Performance Monitoring</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Regression Detection</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Real-time Alerts</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Notification Channels</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Dashboard Notifications</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Alerts</span>
                    <Badge variant="secondary">Configuring...</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Slack Integration</span>
                    <Badge variant="secondary">Configuring...</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
