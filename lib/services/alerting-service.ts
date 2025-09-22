/**
 * Core Alerting Service
 * Handles performance monitoring, alert creation, and alert management
 */

import { createClient } from "@/lib/supabase/server"
import {
  AlertConfig,
  AlertInstance,
  PerformanceMetric,
  AlertSeverity,
  CreateAlertConfigRequest,
  UpdateAlertConfigRequest,
  AlertAction,
  MetricType,
} from "@/types/alerts"

export class AlertingService {
  private supabase = createClient()

  /**
   * Check performance metrics against configured thresholds
   * Returns any alerts that should be triggered
   */
  async checkPerformanceMetrics(): Promise<AlertInstance[]> {
    try {
      // Get active alert configurations
      const { data: configs, error: configError } = await this.supabase
        .from("alert_configs")
        .select("*")
        .eq("is_active", true)

      if (configError) {
        throw new Error(`Failed to fetch alert configs: ${configError.message}`)
      }

      if (!configs || configs.length === 0) {
        return []
      }

      const triggeredAlerts: AlertInstance[] = []

      // Check each configuration against recent metrics
      for (const config of configs) {
        const recentAlert = await this.checkRecentAlert(config.id)

        // Skip if already has an active alert for this config
        if (recentAlert) {
          continue
        }

        const latestMetric = await this.getLatestMetric(config.metric_type)

        if (latestMetric) {
          const alert = await this.evaluateMetricAgainstThresholds(
            config,
            latestMetric
          )
          if (alert) {
            triggeredAlerts.push(alert)
          }
        }
      }

      return triggeredAlerts
    } catch (error) {
      console.error("Error checking performance metrics:", error)
      throw error
    }
  }

  /**
   * Check if there's already an active alert for this config
   */
  private async checkRecentAlert(
    configId: string
  ): Promise<AlertInstance | null> {
    const { data, error } = await this.supabase
      .from("alert_history")
      .select("*")
      .eq("config_id", configId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking recent alert:", error)
      return null
    }

    return data
  }

  /**
   * Get the latest metric for a specific type
   */
  private async getLatestMetric(
    metricType: MetricType
  ): Promise<PerformanceMetric | null> {
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select("*")
      .eq("metric_type", metricType)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error(`Error fetching latest ${metricType} metric:`, error)
      return null
    }

    return data
  }

  /**
   * Evaluate a metric against alert thresholds
   */
  private async evaluateMetricAgainstThresholds(
    config: AlertConfig,
    metric: PerformanceMetric
  ): Promise<AlertInstance | null> {
    const { value } = metric
    let severity: AlertSeverity | null = null
    let thresholdViolated: number = 0

    // Determine severity based on threshold violations
    if (value >= config.threshold_critical) {
      severity = "critical"
      thresholdViolated = config.threshold_critical
    } else if (value >= config.threshold_warning) {
      severity = "warning"
      thresholdViolated = config.threshold_warning
    }

    if (!severity) {
      return null // No threshold violated
    }

    // Create alert instance
    return await this.createAlert({
      config_id: config.id,
      severity,
      metric_value: value,
      threshold_violated: thresholdViolated,
      message: this.generateAlertMessage(config, value, severity),
      source: metric.source,
      metadata: {
        metric_id: metric.id,
        recorded_at: metric.recorded_at,
        ...metric.metadata,
      },
    })
  }

  /**
   * Create a new alert instance
   */
  async createAlert(
    alertData: Omit<AlertInstance, "id" | "created_at" | "status">
  ): Promise<AlertInstance> {
    try {
      const { data, error } = await this.supabase
        .from("alert_history")
        .insert({
          ...alertData,
          status: "active",
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create alert: ${error.message}`)
      }

      // Trigger notifications
      await this.triggerNotifications(data)

      return data
    } catch (error) {
      console.error("Error creating alert:", error)
      throw error
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("alert_history")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId,
        })
        .eq("id", alertId)
        .eq("status", "active") // Only allow acknowledging active alerts

      if (error) {
        throw new Error(`Failed to acknowledge alert: ${error.message}`)
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      throw error
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("alert_history")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq("id", alertId)
        .in("status", ["active", "acknowledged"]) // Allow resolving active or acknowledged alerts

      if (error) {
        throw new Error(`Failed to resolve alert: ${error.message}`)
      }
    } catch (error) {
      console.error("Error resolving alert:", error)
      throw error
    }
  }

  /**
   * Get alert configurations
   */
  async getAlertConfigs(): Promise<AlertConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from("alert_configs")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch alert configs: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error fetching alert configs:", error)
      throw error
    }
  }

  /**
   * Create alert configuration
   */
  async createAlertConfig(
    config: CreateAlertConfigRequest,
    userId: string
  ): Promise<AlertConfig> {
    try {
      const { data, error } = await this.supabase
        .from("alert_configs")
        .insert({
          ...config,
          created_by: userId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create alert config: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error creating alert config:", error)
      throw error
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(
    config: UpdateAlertConfigRequest
  ): Promise<AlertConfig> {
    try {
      const { id, ...updateData } = config

      const { data, error } = await this.supabase
        .from("alert_configs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update alert config: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error updating alert config:", error)
      throw error
    }
  }

  /**
   * Delete alert configuration
   */
  async deleteAlertConfig(configId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("alert_configs")
        .delete()
        .eq("id", configId)

      if (error) {
        throw new Error(`Failed to delete alert config: ${error.message}`)
      }
    } catch (error) {
      console.error("Error deleting alert config:", error)
      throw error
    }
  }

  /**
   * Get alert history with optional filters
   */
  async getAlertHistory(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      status?: string[]
      severity?: string[]
      configId?: string
    }
  ): Promise<{ alerts: AlertInstance[]; total: number }> {
    try {
      let query = this.supabase.from("alert_history").select(
        `
          *,
          config:alert_configs(*)
        `,
        { count: "exact" }
      )

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status)
      }

      if (filters?.severity && filters.severity.length > 0) {
        query = query.in("severity", filters.severity)
      }

      if (filters?.configId) {
        query = query.eq("config_id", filters.configId)
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch alert history: ${error.message}`)
      }

      return {
        alerts: data || [],
        total: count || 0,
      }
    } catch (error) {
      console.error("Error fetching alert history:", error)
      throw error
    }
  }

  /**
   * Detect performance regressions by comparing recent metrics to historical averages
   */
  async evaluateRegressions(): Promise<AlertInstance[]> {
    try {
      const metricTypes: MetricType[] = [
        "cpu_usage",
        "memory_usage",
        "page_load_time",
        "response_time",
      ]
      const regressionAlerts: AlertInstance[] = []

      for (const metricType of metricTypes) {
        const regression = await this.detectRegression(metricType)
        if (regression) {
          regressionAlerts.push(regression)
        }
      }

      return regressionAlerts
    } catch (error) {
      console.error("Error evaluating regressions:", error)
      throw error
    }
  }

  /**
   * Detect regression for a specific metric type
   */
  private async detectRegression(
    metricType: MetricType
  ): Promise<AlertInstance | null> {
    try {
      // Get last 24 hours of metrics
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: recentMetrics, error } = await this.supabase
        .from("performance_metrics")
        .select("value, recorded_at")
        .eq("metric_type", metricType)
        .gte("recorded_at", oneDayAgo)
        .order("recorded_at", { ascending: false })

      if (error || !recentMetrics || recentMetrics.length < 10) {
        return null // Not enough data for regression analysis
      }

      // Calculate recent average (last 6 hours) vs historical average (6-24 hours ago)
      const sixHoursAgo = new Date(
        Date.now() - 6 * 60 * 60 * 1000
      ).toISOString()

      const recentValues = recentMetrics
        .filter(m => m.recorded_at >= sixHoursAgo)
        .map(m => m.value)

      const historicalValues = recentMetrics
        .filter(m => m.recorded_at < sixHoursAgo)
        .map(m => m.value)

      if (recentValues.length < 3 || historicalValues.length < 3) {
        return null
      }

      const recentAvg =
        recentValues.reduce((a, b) => a + b, 0) / recentValues.length
      const historicalAvg =
        historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length

      // Consider it a regression if recent average is 20% worse than historical
      const regressionThreshold = 0.2
      const percentageIncrease = (recentAvg - historicalAvg) / historicalAvg

      if (percentageIncrease > regressionThreshold) {
        // Create a regression alert
        return await this.createAlert({
          config_id: "", // Special case for regression alerts
          severity: percentageIncrease > 0.5 ? "critical" : "warning",
          metric_value: recentAvg,
          threshold_violated: historicalAvg * (1 + regressionThreshold),
          message: `Performance regression detected: ${metricType} increased by ${(percentageIncrease * 100).toFixed(1)}%`,
          source: "regression_detector",
          metadata: {
            recent_average: recentAvg,
            historical_average: historicalAvg,
            percentage_increase: percentageIncrease,
            detection_type: "regression",
          },
        })
      }

      return null
    } catch (error) {
      console.error(`Error detecting regression for ${metricType}:`, error)
      return null
    }
  }

  /**
   * Generate alert message based on configuration and metric
   */
  private generateAlertMessage(
    config: AlertConfig,
    value: number,
    severity: AlertSeverity
  ): string {
    const formatValue = (val: number, metricType: MetricType): string => {
      switch (metricType) {
        case "cpu_usage":
        case "memory_usage":
          return `${val.toFixed(1)}%`
        case "page_load_time":
        case "response_time":
          return `${val.toFixed(0)}ms`
        case "bundle_size":
          return `${(val / 1024).toFixed(1)}KB`
        default:
          return val.toString()
      }
    }

    const formattedValue = formatValue(value, config.metric_type)
    const threshold =
      severity === "critical"
        ? config.threshold_critical
        : config.threshold_warning
    const formattedThreshold = formatValue(threshold, config.metric_type)

    return `${severity.toUpperCase()}: ${config.name} - ${config.metric_type.replace("_", " ")} reached ${formattedValue} (threshold: ${formattedThreshold})`
  }

  /**
   * Trigger notifications for an alert
   */
  private async triggerNotifications(alert: AlertInstance): Promise<void> {
    try {
      // Get the alert config to find notification channels
      const { data: config, error } = await this.supabase
        .from("alert_configs")
        .select("notification_channels")
        .eq("id", alert.config_id)
        .single()

      if (error || !config || !config.notification_channels) {
        console.log("No notification channels configured for alert:", alert.id)
        return
      }

      // For now, we'll implement a simple console log
      // In Phase 3, we'll implement actual email and Slack notifications
      console.log("Alert triggered:", {
        alertId: alert.id,
        message: alert.message,
        severity: alert.severity,
        channels: config.notification_channels,
      })

      // TODO: Implement actual notification dispatch in Phase 3
    } catch (error) {
      console.error("Error triggering notifications:", error)
    }
  }
}
