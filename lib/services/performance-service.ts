import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row']
type PerformanceSession = Database['public']['Tables']['performance_sessions']['Row']

/**
 * Service for fetching performance data from Supabase
 * Used by the dashboard to display read-only performance metrics
 */
export class PerformanceService {
  private supabase = createClient()

  /**
   * Get recent performance metrics
   */
  async getRecentMetrics(limit = 100) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent metrics:', error)
      throw new Error(`Failed to fetch recent metrics: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get performance metrics for a specific session
   */
  async getSessionMetrics(sessionId: string) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching session metrics:', error)
      throw new Error(`Failed to fetch session metrics: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get all performance sessions
   */
  async getSessions(limit = 50) {
    const { data, error } = await this.supabase
      .from('performance_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sessions:', error)
      throw new Error(`Failed to fetch sessions: ${error.message}`)
    }

    return data as PerformanceSession[]
  }

  /**
   * Get performance metrics grouped by time period
   */
  async getMetricsByTimePeriod(
    period: 'hour' | 'day' | 'week' = 'day',
    limit = 24
  ) {
    // This will need to be adapted based on your actual data structure
    // For now, let's get metrics grouped by created_at
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select(`
        created_at,
        fps,
        memory_usage,
        cpu_usage,
        load_time,
        platform
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 50) // Get more data to group

    if (error) {
      console.error('Error fetching metrics by time period:', error)
      throw new Error(`Failed to fetch metrics by time period: ${error.message}`)
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
        .from('performance_metrics')
        .select('*', { count: 'exact', head: true })

      if (metricsError) {
        throw metricsError
      }

      // Get total sessions count
      const { count: totalSessions, error: sessionsError } = await this.supabase
        .from('performance_sessions')
        .select('*', { count: 'exact', head: true })

      if (sessionsError) {
        throw sessionsError
      }

      // Get recent metrics for averages
      const { data: recentMetrics, error: recentError } = await this.supabase
        .from('performance_metrics')
        .select('fps, memory_usage, cpu_usage, load_time')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (recentError) {
        throw recentError
      }

      // Calculate averages
      const avgStats = recentMetrics?.length ? {
        avgFps: recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length,
        avgMemory: recentMetrics.reduce((sum, m) => sum + m.memory_usage, 0) / recentMetrics.length,
        avgCpu: recentMetrics.reduce((sum, m) => sum + m.cpu_usage, 0) / recentMetrics.length,
        avgLoadTime: recentMetrics.reduce((sum, m) => sum + m.load_time, 0) / recentMetrics.length,
      } : {
        avgFps: 0,
        avgMemory: 0,
        avgCpu: 0,
        avgLoadTime: 0,
      }

      return {
        totalMetrics: totalMetrics || 0,
        totalSessions: totalSessions || 0,
        ...avgStats,
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error)
      throw new Error(`Failed to fetch performance stats: ${error}`)
    }
  }

  /**
   * Get metrics filtered by platform
   */
  async getMetricsByPlatform(platform: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('*')
      .eq('platform', platform)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching metrics by platform:', error)
      throw new Error(`Failed to fetch metrics by platform: ${error.message}`)
    }

    return data as PerformanceMetric[]
  }

  /**
   * Get metrics filtered by device model
   */
  async getMetricsByDevice(deviceModel: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('*')
      .eq('device_model', deviceModel)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching metrics by device:', error)
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
      .from('performance_metrics')
      .select(`
        created_at,
        fps,
        memory_usage,
        cpu_usage,
        load_time
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching performance trends:', error)
      throw new Error(`Failed to fetch performance trends: ${error.message}`)
    }

    return data as Pick<PerformanceMetric, 'created_at' | 'fps' | 'memory_usage' | 'cpu_usage' | 'load_time'>[]
  }
}