/**
 * Performance Monitoring Service
 * Handles recording and retrieving performance metrics
 */

import { createClient } from "@/lib/supabase/server"
import { PerformanceMetric, MetricType } from "@/types/alerts"

export class PerformanceService {
  private supabase = createClient()

  /**
   * Record a new performance metric
   */
  async recordMetric(
    metric: Omit<PerformanceMetric, "id" | "recorded_at">
  ): Promise<PerformanceMetric> {
    try {
      const { data, error } = await this.supabase
        .from("performance_metrics")
        .insert(metric)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to record metric: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error recording performance metric:", error)
      throw error
    }
  }

  /**
   * Record multiple metrics in a batch
   */
  async recordMetrics(
    metrics: Omit<PerformanceMetric, "id" | "recorded_at">[]
  ): Promise<PerformanceMetric[]> {
    try {
      const { data, error } = await this.supabase
        .from("performance_metrics")
        .insert(metrics)
        .select()

      if (error) {
        throw new Error(`Failed to record metrics: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error recording performance metrics:", error)
      throw error
    }
  }

  /**
   * Get metric history for a specific metric type and time range
   */
  async getMetricHistory(
    metricType: MetricType,
    timeRange: {
      start: string
      end: string
    },
    limit: number = 100
  ): Promise<PerformanceMetric[]> {
    try {
      const { data, error } = await this.supabase
        .from("performance_metrics")
        .select("*")
        .eq("metric_type", metricType)
        .gte("recorded_at", timeRange.start)
        .lte("recorded_at", timeRange.end)
        .order("recorded_at", { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch metric history: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error fetching metric history:", error)
      throw error
    }
  }

  /**
   * Get the latest metrics for all metric types
   */
  async getLatestMetrics(): Promise<PerformanceMetric[]> {
    try {
      // Get unique metric types first
      const { data: metricTypes, error: typesError } = await this.supabase
        .from("performance_metrics")
        .select("metric_type")
        .order("metric_type")

      if (typesError) {
        throw new Error(`Failed to fetch metric types: ${typesError.message}`)
      }

      if (!metricTypes || metricTypes.length === 0) {
        return []
      }

      // Get unique metric types
      const uniqueTypes = Array.from(
        new Set(metricTypes.map(m => m.metric_type))
      )

      // Get latest metric for each type
      const latestMetrics: PerformanceMetric[] = []

      for (const metricType of uniqueTypes) {
        const { data, error } = await this.supabase
          .from("performance_metrics")
          .select("*")
          .eq("metric_type", metricType)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error(`Error fetching latest ${metricType}:`, error)
          continue
        }

        if (data) {
          latestMetrics.push(data)
        }
      }

      return latestMetrics
    } catch (error) {
      console.error("Error fetching latest metrics:", error)
      throw error
    }
  }

  /**
   * Get metric statistics for a time period
   */
  async getMetricStats(
    metricType: MetricType,
    timeRange: {
      start: string
      end: string
    }
  ): Promise<{
    average: number
    min: number
    max: number
    count: number
    latest: number | null
  }> {
    try {
      const metrics = await this.getMetricHistory(metricType, timeRange, 1000)

      if (metrics.length === 0) {
        return {
          average: 0,
          min: 0,
          max: 0,
          count: 0,
          latest: null,
        }
      }

      const values = metrics.map(m => m.value)
      const sum = values.reduce((a, b) => a + b, 0)

      return {
        average: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
        latest: metrics[0]?.value || null, // First item is latest due to DESC order
      }
    } catch (error) {
      console.error("Error calculating metric stats:", error)
      throw error
    }
  }

  /**
   * Get metrics for dashboard display (aggregated by hour)
   */
  async getDashboardMetrics(hours: number = 24): Promise<{
    [metricType: string]: {
      current: number
      trend: number // percentage change from previous period
      data: Array<{ timestamp: string; value: number }>
    }
  }> {
    try {
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)

      const { data: metrics, error } = await this.supabase
        .from("performance_metrics")
        .select("*")
        .gte("recorded_at", startTime.toISOString())
        .order("recorded_at", { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch dashboard metrics: ${error.message}`)
      }

      if (!metrics || metrics.length === 0) {
        return {}
      }

      // Group metrics by type and aggregate by hour
      const result: {
        [metricType: string]: {
          current: number
          trend: number
          data: Array<{ timestamp: string; value: number }>
        }
      } = {}

      // Group by metric type
      const metricsByType = metrics.reduce(
        (acc, metric) => {
          if (!acc[metric.metric_type]) {
            acc[metric.metric_type] = []
          }
          acc[metric.metric_type].push(metric)
          return acc
        },
        {} as { [key: string]: PerformanceMetric[] }
      )

      // Process each metric type
      for (const [metricType, typeMetrics] of Object.entries(metricsByType)) {
        const metrics = typeMetrics as PerformanceMetric[]
        // Group by hour
        const hourlyData = this.aggregateMetricsByHour(metrics)

        // Calculate current value (latest)
        const current = metrics[metrics.length - 1]?.value || 0

        // Calculate trend (compare first half vs second half of time period)
        const midpoint = Math.floor(hourlyData.length / 2)
        const firstHalf = hourlyData.slice(0, midpoint)
        const secondHalf = hourlyData.slice(midpoint)

        let trend = 0
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstAvg =
            firstHalf.reduce((sum, item) => sum + item.value, 0) /
            firstHalf.length
          const secondAvg =
            secondHalf.reduce((sum, item) => sum + item.value, 0) /
            secondHalf.length

          if (firstAvg > 0) {
            trend = ((secondAvg - firstAvg) / firstAvg) * 100
          }
        }

        result[metricType] = {
          current,
          trend: Math.round(trend * 100) / 100, // Round to 2 decimal places
          data: hourlyData,
        }
      }

      return result
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error)
      throw error
    }
  }

  /**
   * Aggregate metrics by hour for charting
   */
  private aggregateMetricsByHour(
    metrics: PerformanceMetric[]
  ): Array<{ timestamp: string; value: number }> {
    const hourlyGroups: { [hour: string]: number[] } = {}

    // Group metrics by hour
    metrics.forEach(metric => {
      const hour =
        new Date(metric.recorded_at).toISOString().substring(0, 13) +
        ":00:00.000Z"
      if (!hourlyGroups[hour]) {
        hourlyGroups[hour] = []
      }
      hourlyGroups[hour].push(metric.value)
    })

    // Calculate average for each hour
    return Object.entries(hourlyGroups)
      .map(([hour, values]) => ({
        timestamp: hour,
        value: values.reduce((sum, val) => sum + val, 0) / values.length,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  /**
   * Delete old metrics to keep database size manageable
   */
  async cleanupOldMetrics(
    daysToKeep: number = 30
  ): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString()

      const { count, error } = await this.supabase
        .from("performance_metrics")
        .delete({ count: "exact" })
        .lt("recorded_at", cutoffDate)

      if (error) {
        throw new Error(`Failed to cleanup old metrics: ${error.message}`)
      }

      return { deletedCount: count || 0 }
    } catch (error) {
      console.error("Error cleaning up old metrics:", error)
      throw error
    }
  }

  /**
   * Simulate recording some sample metrics for testing
   */
  async generateSampleMetrics(): Promise<void> {
    try {
      const now = new Date()
      const metrics: Omit<PerformanceMetric, "id" | "recorded_at">[] = []

      // Generate metrics for the last 24 hours
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

        // CPU Usage (30-90%)
        metrics.push({
          metric_type: "cpu_usage",
          value: 30 + Math.random() * 60,
          source: "system_monitor",
          metadata: { timestamp: timestamp.toISOString() },
        })

        // Memory Usage (40-80%)
        metrics.push({
          metric_type: "memory_usage",
          value: 40 + Math.random() * 40,
          source: "system_monitor",
          metadata: { timestamp: timestamp.toISOString() },
        })

        // Page Load Time (500-3000ms)
        metrics.push({
          metric_type: "page_load_time",
          value: 500 + Math.random() * 2500,
          source: "lighthouse",
          metadata: { timestamp: timestamp.toISOString() },
        })

        // Response Time (50-500ms)
        metrics.push({
          metric_type: "response_time",
          value: 50 + Math.random() * 450,
          source: "api_monitor",
          metadata: { timestamp: timestamp.toISOString() },
        })

        // Bundle Size (400-800KB)
        metrics.push({
          metric_type: "bundle_size",
          value: 400000 + Math.random() * 400000,
          source: "webpack",
          metadata: { timestamp: timestamp.toISOString() },
        })
      }

      await this.recordMetrics(metrics)
      console.log(`Generated ${metrics.length} sample metrics`)
    } catch (error) {
      console.error("Error generating sample metrics:", error)
      throw error
    }
  }
}
