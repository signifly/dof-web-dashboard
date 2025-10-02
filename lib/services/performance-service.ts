import { createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"
import { QUERY_LIMITS } from "@/constants/data/limits"

type PerformanceMetric =
  Database["public"]["Tables"]["performance_metrics"]["Row"]
type PerformanceSession =
  Database["public"]["Tables"]["performance_sessions"]["Row"]

/**
 * Service for fetching performance data from Supabase
 * Used by the dashboard to display read-only performance metrics
 */
export class PerformanceService {
  private supabase = createServiceClient()

  /**
   * Get recent performance metrics
   */
  async getRecentMetrics(limit = QUERY_LIMITS.DEFAULT_PAGE_SIZE) {
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent metrics:", error)
      throw new Error(`Failed to fetch recent metrics: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get performance metrics for a specific session
   */
  async getSessionMetrics(sessionId: string) {
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Error fetching session metrics:", error)
      throw new Error(`Failed to fetch session metrics: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get all performance sessions
   */
  async getSessions(limit = QUERY_LIMITS.DEFAULT_PAGE_SIZE) {
    const { data, error } = await this.supabase
      .from("performance_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching sessions:", error)
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data as PerformanceSession[]
  }

  /**
   * Get performance metrics grouped by time period
   */
  async getMetricsByTimePeriod(
    _period: "hour" | "day" | "week" = "day",
    limit = QUERY_LIMITS.RECENT_ITEMS_LIMIT
  ) {
    // Get metrics using the normalized schema
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select(
        `
        created_at,
        metric_type,
        metric_value,
        metric_unit,
        context
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit * 50) // Get more data to group

    if (error) {
      console.error("Error fetching metrics by time period:", error)
      throw new Error(
        `Failed to fetch metrics by time period: ${error.message}`
      )
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get performance statistics summary
   */
  async getPerformanceStats() {
    try {
      // Get total metrics count
      const { count: totalMetrics, error: metricsError } = await this.supabase
        .from("performance_metrics")
        .select("*", { count: "exact", head: true })

      if (metricsError) {
        throw metricsError
      }

      // Get total sessions count
      const { count: totalSessions, error: sessionsError } = await this.supabase
        .from("performance_sessions")
        .select("*", { count: "exact", head: true })

      if (sessionsError) {
        throw sessionsError
      }

      // Get recent metrics for averages using normalized schema
      const { data: recentMetrics, error: recentError } = await this.supabase
        .from("performance_metrics")
        .select("metric_type, metric_value")
        .order("created_at", { ascending: false })
        .limit(1000)

      if (recentError) {
        throw recentError
      }

      // Calculate averages from normalized data
      const metricsByType =
        recentMetrics?.reduce(
          (acc, metric) => {
            if (!acc[metric.metric_type]) {
              acc[metric.metric_type] = []
            }
            acc[metric.metric_type].push(metric.metric_value)
            return acc
          },
          {} as Record<string, number[]>
        ) || {}

      const avgStats = {
        avgFps: metricsByType.fps?.length
          ? metricsByType.fps.reduce((sum, val) => sum + val, 0) /
            metricsByType.fps.length
          : 0,
        avgMemory: metricsByType.memory_usage?.length
          ? metricsByType.memory_usage.reduce((sum, val) => sum + val, 0) /
            metricsByType.memory_usage.length
          : 0,
        avgCpu: metricsByType.cpu_usage?.length
          ? metricsByType.cpu_usage.reduce((sum, val) => sum + val, 0) /
            metricsByType.cpu_usage.length
          : 0,
        avgLoadTime: metricsByType.load_time?.length
          ? metricsByType.load_time.reduce((sum, val) => sum + val, 0) /
            metricsByType.load_time.length
          : 0,
      }

      return {
        totalMetrics: totalMetrics || 0,
        totalSessions: totalSessions || 0,
        ...avgStats,
      }
    } catch (error) {
      console.error("Error fetching performance stats:", error)
      throw new Error(`Failed to fetch performance stats: ${error}`)
    }
  }

  /**
   * Get metrics filtered by platform
   */
  async getMetricsByPlatform(
    _platform: string, // Reserved for future platform filtering implementation
    limit = QUERY_LIMITS.DEFAULT_PAGE_SIZE
  ) {
    // Note: Platform filtering would need to be done via context or session join
    // For now, get all metrics and filter in application layer if needed
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching metrics by platform:", error)
      throw new Error(`Failed to fetch metrics by platform: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get metrics filtered by device model
   */
  async getMetricsByDevice(
    _deviceModel: string, // Reserved for future device filtering implementation
    limit = QUERY_LIMITS.DEFAULT_PAGE_SIZE
  ) {
    // Note: Device filtering would need to be done via context or session join
    // For now, get all metrics and filter in application layer if needed
    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching metrics by device:", error)
      throw new Error(`Failed to fetch metrics by device: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from("performance_metrics")
      .select(
        `
        created_at,
        metric_type,
        metric_value,
        metric_unit
      `
      )
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching performance trends:", error)
      throw new Error(`Failed to fetch performance trends: ${error.message}`)
    }

    return data as Pick<
      PerformanceMetric,
      "created_at" | "metric_type" | "metric_value" | "metric_unit"
    >[]
  }
}
