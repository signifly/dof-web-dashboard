import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/types/database"
import { QUERY_LIMITS } from "@/constants/data/limits"

export type SearchMetric = Tables<"performance_metrics">
export type SearchSession = Tables<"performance_sessions">

// Core search interfaces
export interface SearchQuery {
  text?: string
  devices?: string[]
  dateRange?: { start: Date; end: Date }
  metrics?: {
    fps?: { min?: number; max?: number }
    cpu?: { min?: number; max?: number }
    memory?: { min?: number; max?: number }
    loadTime?: { min?: number; max?: number }
  }
  sessions?: string[]
  platforms?: string[]
  appVersions?: string[]
  metricTypes?: string[]
  sortBy?: "timestamp" | "metric_value" | "created_at"
  sortOrder?: "asc" | "desc"
  limit?: number
  offset?: number
}

export interface SearchResults {
  metrics: SearchMetric[]
  sessions: SearchSession[]
  total: number
  hasMore: boolean
  facets: {
    metricTypes: { type: string; count: number }[]
    platforms: { platform: string; count: number }[]
    appVersions: { version: string; count: number }[]
    devices: { deviceId: string; count: number }[]
  }
  executionTime: number
}

export interface SearchSuggestion {
  type: "metric_type" | "platform" | "app_version" | "device" | "screen"
  value: string
  label: string
  count: number
}

/**
 * Advanced search service for performance monitoring data
 * Provides comprehensive search capabilities across metrics and sessions
 */
export class SearchService {
  private supabase = createClient()

  /**
   * Execute a comprehensive search across performance data
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now()

    try {
      // Build the base queries
      const metricsQuery = this.buildMetricsQuery(query)
      const sessionsQuery = this.buildSessionsQuery(query)

      // Execute queries in parallel
      const [metricsResult, sessionsResult, facetsResult] = await Promise.all([
        metricsQuery,
        sessionsQuery,
        this.buildSearchFacets(query),
      ])

      if (metricsResult.error) {
        console.error("Metrics search error:", metricsResult.error)
      }

      if (sessionsResult.error) {
        console.error("Sessions search error:", sessionsResult.error)
      }

      const metrics = metricsResult.data || []
      const sessions = sessionsResult.data || []

      // Calculate total and pagination info
      const total = metrics.length + sessions.length
      const hasMore = total >= (query.limit || 100)

      const executionTime = Date.now() - startTime

      return {
        metrics,
        sessions,
        total,
        hasMore,
        facets: facetsResult,
        executionTime,
      }
    } catch (error) {
      console.error("Search service error:", error)
      return {
        metrics: [],
        sessions: [],
        total: 0,
        hasMore: false,
        facets: {
          metricTypes: [],
          platforms: [],
          appVersions: [],
          devices: [],
        },
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSuggestions(
    input: string,
    limit = QUERY_LIMITS.RECENT_ITEMS_LIMIT / 2
  ): Promise<SearchSuggestion[]> {
    // 10 suggestions
    const suggestions: SearchSuggestion[] = []

    try {
      // Get metric types
      const { data: metricTypes } = await this.supabase
        .from("performance_metrics")
        .select("metric_type")
        .ilike("metric_type", `%${input}%`)
        .limit(limit)

      // Get platforms from sessions
      const { data: platforms } = await this.supabase
        .from("performance_sessions")
        .select("device_type")
        .ilike("device_type", `%${input}%`)
        .limit(limit)

      // Get app versions
      const { data: appVersions } = await this.supabase
        .from("performance_sessions")
        .select("app_version")
        .ilike("app_version", `%${input}%`)
        .limit(limit)

      // Process metric types
      const metricTypeCounts = new Map<string, number>()
      metricTypes?.forEach((item: { metric_type: string }) => {
        const type = item.metric_type
        if (type) {
          metricTypeCounts.set(type, (metricTypeCounts.get(type) || 0) + 1)
        }
      })

      metricTypeCounts.forEach((count, type) => {
        suggestions.push({
          type: "metric_type",
          value: type,
          label: `${type} (${count} metrics)`,
          count,
        })
      })

      // Process platforms
      const platformCounts = new Map<string, number>()
      platforms?.forEach((item: { device_type: string }) => {
        const platform = item.device_type
        if (platform) {
          platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1)
        }
      })

      platformCounts.forEach((count, platform) => {
        suggestions.push({
          type: "platform",
          value: platform,
          label: `${platform} (${count} sessions)`,
          count,
        })
      })

      // Process app versions
      const versionCounts = new Map<string, number>()
      appVersions?.forEach((item: { app_version: string }) => {
        const version = item.app_version
        if (version) {
          versionCounts.set(version, (versionCounts.get(version) || 0) + 1)
        }
      })

      versionCounts.forEach((count, version) => {
        suggestions.push({
          type: "app_version",
          value: version,
          label: `${version} (${count} sessions)`,
          count,
        })
      })

      // Sort by relevance (exact matches first, then by count)
      return suggestions
        .sort((a, b) => {
          const aExact = a.value.toLowerCase().startsWith(input.toLowerCase())
          const bExact = b.value.toLowerCase().startsWith(input.toLowerCase())

          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1

          return b.count - a.count
        })
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting search suggestions:", error)
      return []
    }
  }

  /**
   * Get unique values for filter options
   */
  async getFilterOptions(): Promise<{
    metricTypes: string[]
    platforms: string[]
    appVersions: string[]
    screenNames: string[]
    devices: string[]
  }> {
    try {
      const [
        metricTypesResult,
        platformsResult,
        versionsResult,
        screenNamesResult,
        devicesResult,
      ] = await Promise.all([
        this.supabase
          .from("performance_metrics")
          .select("metric_type")
          .order("metric_type"),
        this.supabase
          .from("performance_sessions")
          .select("device_type")
          .order("device_type"),
        this.supabase
          .from("performance_sessions")
          .select("app_version")
          .order("app_version"),
        this.supabase
          .from("performance_metrics")
          .select("context")
          .not("context", "is", null),
        this.supabase
          .from("performance_sessions")
          .select("anonymous_user_id")
          .order("anonymous_user_id"),
      ])

      // Extract unique metric types
      const metricTypes = Array.from(
        new Set(
          (metricTypesResult.data || [])
            .map((item: { metric_type: string }) => item.metric_type)
            .filter(Boolean)
        )
      )

      // Extract unique platforms
      const platforms = Array.from(
        new Set(
          (platformsResult.data || [])
            .map((item: { device_type: string }) => item.device_type)
            .filter(Boolean)
        )
      )

      // Extract unique app versions
      const appVersions = Array.from(
        new Set(
          (versionsResult.data || [])
            .map((item: { app_version: string }) => item.app_version)
            .filter(Boolean)
        )
      )

      // Extract screen names from context JSON
      const screenNames = new Set<string>()
      screenNamesResult.data?.forEach((item: { context: any }) => {
        if (item.context && typeof item.context === "object") {
          const context = item.context as { screen_name?: string }
          if (context.screen_name && typeof context.screen_name === "string") {
            screenNames.add(context.screen_name)
          }
        }
      })

      // Extract unique devices
      const devices = Array.from(
        new Set(
          (devicesResult.data || [])
            .map((item: { anonymous_user_id: string }) => item.anonymous_user_id)
            .filter(Boolean)
        )
      )

      return {
        metricTypes,
        platforms,
        appVersions,
        screenNames: Array.from(screenNames),
        devices,
      }
    } catch (error) {
      console.error("Error getting filter options:", error)
      return {
        metricTypes: [],
        platforms: [],
        appVersions: [],
        screenNames: [],
        devices: [],
      }
    }
  }

  /**
   * Build metrics query based on search parameters
   */
  private async buildMetricsQuery(query: SearchQuery) {
    let metricsQuery = this.supabase.from("performance_metrics").select("*")

    // Text search across metric_type and context
    if (query.text) {
      const searchText = `%${query.text}%`
      metricsQuery = metricsQuery.or(
        `metric_type.ilike.${searchText},context.cs.{"screen_name":"${query.text}"}`
      )
    }

    // Filter by metric types
    if (query.metricTypes && query.metricTypes.length > 0) {
      metricsQuery = metricsQuery.in("metric_type", query.metricTypes)
    }

    // Filter by sessions
    if (query.sessions && query.sessions.length > 0) {
      metricsQuery = metricsQuery.in("session_id", query.sessions)
    }

    // Date range filter
    if (query.dateRange) {
      metricsQuery = metricsQuery
        .gte("timestamp", query.dateRange.start.toISOString())
        .lte("timestamp", query.dateRange.end.toISOString())
    }

    // Metrics range filtering
    if (query.metrics) {
      const conditions: string[] = []

      if (query.metrics.fps) {
        if (query.metrics.fps.min !== undefined) {
          conditions.push(
            `and(metric_type.eq.fps,metric_value.gte.${query.metrics.fps.min})`
          )
        }
        if (query.metrics.fps.max !== undefined) {
          conditions.push(
            `and(metric_type.eq.fps,metric_value.lte.${query.metrics.fps.max})`
          )
        }
      }

      if (query.metrics.memory) {
        if (query.metrics.memory.min !== undefined) {
          conditions.push(
            `and(metric_type.eq.memory_usage,metric_value.gte.${query.metrics.memory.min})`
          )
        }
        if (query.metrics.memory.max !== undefined) {
          conditions.push(
            `and(metric_type.eq.memory_usage,metric_value.lte.${query.metrics.memory.max})`
          )
        }
      }

      if (query.metrics.cpu) {
        if (query.metrics.cpu.min !== undefined) {
          conditions.push(
            `and(metric_type.eq.cpu_usage,metric_value.gte.${query.metrics.cpu.min})`
          )
        }
        if (query.metrics.cpu.max !== undefined) {
          conditions.push(
            `and(metric_type.eq.cpu_usage,metric_value.lte.${query.metrics.cpu.max})`
          )
        }
      }

      if (query.metrics.loadTime) {
        const loadTimeTypes = ["navigation_time", "screen_load", "load_time"]
        if (query.metrics.loadTime.min !== undefined) {
          loadTimeTypes.forEach(type => {
            conditions.push(
              `and(metric_type.eq.${type},metric_value.gte.${query.metrics!.loadTime!.min})`
            )
          })
        }
        if (query.metrics.loadTime.max !== undefined) {
          loadTimeTypes.forEach(type => {
            conditions.push(
              `and(metric_type.eq.${type},metric_value.lte.${query.metrics!.loadTime!.max})`
            )
          })
        }
      }

      if (conditions.length > 0) {
        metricsQuery = metricsQuery.or(conditions.join(","))
      }
    }

    // Sorting
    const sortBy = query.sortBy || "timestamp"
    const sortOrder = query.sortOrder || "desc"
    metricsQuery = metricsQuery.order(sortBy, {
      ascending: sortOrder === "asc",
    })

    // Pagination
    const limit = Math.min(query.limit || 100, 1000) // Cap at 1000 for performance
    const offset = query.offset || 0
    metricsQuery = metricsQuery.range(offset, offset + limit - 1)

    return metricsQuery
  }

  /**
   * Build sessions query based on search parameters
   */
  private async buildSessionsQuery(query: SearchQuery) {
    let sessionsQuery = this.supabase.from("performance_sessions").select("*")

    // Text search across app_version and device_type
    if (query.text) {
      const searchText = `%${query.text}%`
      sessionsQuery = sessionsQuery.or(
        `app_version.ilike.${searchText},device_type.ilike.${searchText},os_version.ilike.${searchText}`
      )
    }

    // Filter by specific devices
    if (query.devices && query.devices.length > 0) {
      sessionsQuery = sessionsQuery.in("anonymous_user_id", query.devices)
    }

    // Filter by platforms
    if (query.platforms && query.platforms.length > 0) {
      sessionsQuery = sessionsQuery.in("device_type", query.platforms)
    }

    // Filter by app versions
    if (query.appVersions && query.appVersions.length > 0) {
      sessionsQuery = sessionsQuery.in("app_version", query.appVersions)
    }

    // Date range filter
    if (query.dateRange) {
      sessionsQuery = sessionsQuery
        .gte("session_start", query.dateRange.start.toISOString())
        .lte("session_start", query.dateRange.end.toISOString())
    }

    // Sorting
    const sortBy =
      query.sortBy === "timestamp"
        ? "session_start"
        : query.sortBy || "created_at"
    const sortOrder = query.sortOrder || "desc"
    sessionsQuery = sessionsQuery.order(sortBy, {
      ascending: sortOrder === "asc",
    })

    // Pagination
    const limit = Math.min(query.limit || 100, 1000) // Cap at 1000 for performance
    const offset = query.offset || 0
    sessionsQuery = sessionsQuery.range(offset, offset + limit - 1)

    return sessionsQuery
  }

  /**
   * Build search facets for result filtering
   */
  private async buildSearchFacets(
    query: SearchQuery
  ): Promise<SearchResults["facets"]> {
    try {
      // Build base queries with current filters (excluding facet-specific filters)
      let baseMetricsQuery = this.supabase
        .from("performance_metrics")
        .select("metric_type, session_id")

      let baseSessionsQuery = this.supabase
        .from("performance_sessions")
        .select("device_type, app_version, anonymous_user_id")

      // Apply text search to both
      if (query.text) {
        const searchText = `%${query.text}%`
        baseMetricsQuery = baseMetricsQuery.or(
          `metric_type.ilike.${searchText},context.cs.{"screen_name":"${query.text}"}`
        )
        baseSessionsQuery = baseSessionsQuery.or(
          `app_version.ilike.${searchText},device_type.ilike.${searchText},os_version.ilike.${searchText}`
        )
      }

      // Apply date range filters
      if (query.dateRange) {
        baseMetricsQuery = baseMetricsQuery
          .gte("timestamp", query.dateRange.start.toISOString())
          .lte("timestamp", query.dateRange.end.toISOString())
        baseSessionsQuery = baseSessionsQuery
          .gte("session_start", query.dateRange.start.toISOString())
          .lte("session_start", query.dateRange.end.toISOString())
      }

      const [metricsData, sessionsData] = await Promise.all([
        baseMetricsQuery.limit(5000), // Reasonable limit for facet calculation
        baseSessionsQuery.limit(5000),
      ])

      // Calculate metric types facet
      const metricTypeCounts = new Map<string, number>()
      metricsData.data?.forEach((metric: { metric_type: string }) => {
        const type = metric.metric_type
        if (type) {
          metricTypeCounts.set(type, (metricTypeCounts.get(type) || 0) + 1)
        }
      })

      // Calculate platforms facet
      const platformCounts = new Map<string, number>()
      sessionsData.data?.forEach((session: { device_type: string }) => {
        const platform = session.device_type
        if (platform) {
          platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1)
        }
      })

      // Calculate app versions facet
      const versionCounts = new Map<string, number>()
      sessionsData.data?.forEach((session: { app_version: string }) => {
        const version = session.app_version
        if (version) {
          versionCounts.set(version, (versionCounts.get(version) || 0) + 1)
        }
      })

      // Calculate devices facet
      const deviceCounts = new Map<string, number>()
      sessionsData.data?.forEach((session: { anonymous_user_id: string }) => {
        const deviceId = session.anonymous_user_id
        if (deviceId) {
          deviceCounts.set(deviceId, (deviceCounts.get(deviceId) || 0) + 1)
        }
      })

      return {
        metricTypes: Array.from(metricTypeCounts.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        platforms: Array.from(platformCounts.entries())
          .map(([platform, count]) => ({ platform, count }))
          .sort((a, b) => b.count - a.count),
        appVersions: Array.from(versionCounts.entries())
          .map(([version, count]) => ({ version, count }))
          .sort((a, b) => b.count - a.count),
        devices: Array.from(deviceCounts.entries())
          .map(([deviceId, count]) => ({ deviceId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20), // Limit to top 20 devices for UI performance
      }
    } catch (error) {
      console.error("Error building search facets:", error)
      return {
        metricTypes: [],
        platforms: [],
        appVersions: [],
        devices: [],
      }
    }
  }

}

// Export a singleton instance
export const searchService = new SearchService()
