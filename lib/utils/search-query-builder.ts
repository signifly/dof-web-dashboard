import { SearchQuery } from "@/lib/services/search-service"

/**
 * URL parameter names for search query serialization
 */
export const SEARCH_PARAMS = {
  TEXT: "q",
  DEVICES: "devices",
  DATE_START: "start",
  DATE_END: "end",
  FPS_MIN: "fps_min",
  FPS_MAX: "fps_max",
  CPU_MIN: "cpu_min",
  CPU_MAX: "cpu_max",
  MEMORY_MIN: "memory_min",
  MEMORY_MAX: "memory_max",
  LOAD_TIME_MIN: "load_min",
  LOAD_TIME_MAX: "load_max",
  SESSIONS: "sessions",
  PLATFORMS: "platforms",
  APP_VERSIONS: "versions",
  METRIC_TYPES: "types",
  SORT_BY: "sort",
  SORT_ORDER: "order",
  LIMIT: "limit",
  OFFSET: "offset",
} as const

/**
 * Default search query values
 */
export const DEFAULT_SEARCH_QUERY: SearchQuery = {
  sortBy: "timestamp",
  sortOrder: "desc",
  limit: 100,
  offset: 0,
}

/**
 * Query builder utilities for search functionality
 */
export class SearchQueryBuilder {
  /**
   * Serialize a SearchQuery object to URL search parameters
   */
  static toURLParams(query: SearchQuery): URLSearchParams {
    const params = new URLSearchParams()

    // Text search
    if (query.text) {
      params.set(SEARCH_PARAMS.TEXT, query.text)
    }

    // Device filters
    if (query.devices && query.devices.length > 0) {
      params.set(SEARCH_PARAMS.DEVICES, query.devices.join(","))
    }

    // Date range
    if (query.dateRange) {
      params.set(SEARCH_PARAMS.DATE_START, query.dateRange.start.toISOString())
      params.set(SEARCH_PARAMS.DATE_END, query.dateRange.end.toISOString())
    }

    // Metric range filters
    if (query.metrics) {
      if (query.metrics.fps) {
        if (query.metrics.fps.min !== undefined) {
          params.set(SEARCH_PARAMS.FPS_MIN, query.metrics.fps.min.toString())
        }
        if (query.metrics.fps.max !== undefined) {
          params.set(SEARCH_PARAMS.FPS_MAX, query.metrics.fps.max.toString())
        }
      }

      if (query.metrics.cpu) {
        if (query.metrics.cpu.min !== undefined) {
          params.set(SEARCH_PARAMS.CPU_MIN, query.metrics.cpu.min.toString())
        }
        if (query.metrics.cpu.max !== undefined) {
          params.set(SEARCH_PARAMS.CPU_MAX, query.metrics.cpu.max.toString())
        }
      }

      if (query.metrics.memory) {
        if (query.metrics.memory.min !== undefined) {
          params.set(
            SEARCH_PARAMS.MEMORY_MIN,
            query.metrics.memory.min.toString()
          )
        }
        if (query.metrics.memory.max !== undefined) {
          params.set(
            SEARCH_PARAMS.MEMORY_MAX,
            query.metrics.memory.max.toString()
          )
        }
      }

      if (query.metrics.loadTime) {
        if (query.metrics.loadTime.min !== undefined) {
          params.set(
            SEARCH_PARAMS.LOAD_TIME_MIN,
            query.metrics.loadTime.min.toString()
          )
        }
        if (query.metrics.loadTime.max !== undefined) {
          params.set(
            SEARCH_PARAMS.LOAD_TIME_MAX,
            query.metrics.loadTime.max.toString()
          )
        }
      }
    }

    // Sessions filter
    if (query.sessions && query.sessions.length > 0) {
      params.set(SEARCH_PARAMS.SESSIONS, query.sessions.join(","))
    }

    // Platforms filter
    if (query.platforms && query.platforms.length > 0) {
      params.set(SEARCH_PARAMS.PLATFORMS, query.platforms.join(","))
    }

    // App versions filter
    if (query.appVersions && query.appVersions.length > 0) {
      params.set(SEARCH_PARAMS.APP_VERSIONS, query.appVersions.join(","))
    }

    // Metric types filter
    if (query.metricTypes && query.metricTypes.length > 0) {
      params.set(SEARCH_PARAMS.METRIC_TYPES, query.metricTypes.join(","))
    }

    // Sorting
    if (query.sortBy && query.sortBy !== DEFAULT_SEARCH_QUERY.sortBy) {
      params.set(SEARCH_PARAMS.SORT_BY, query.sortBy)
    }

    if (query.sortOrder && query.sortOrder !== DEFAULT_SEARCH_QUERY.sortOrder) {
      params.set(SEARCH_PARAMS.SORT_ORDER, query.sortOrder)
    }

    // Pagination
    if (query.limit && query.limit !== DEFAULT_SEARCH_QUERY.limit) {
      params.set(SEARCH_PARAMS.LIMIT, query.limit.toString())
    }

    if (query.offset && query.offset !== DEFAULT_SEARCH_QUERY.offset) {
      params.set(SEARCH_PARAMS.OFFSET, query.offset.toString())
    }

    return params
  }

  /**
   * Parse URL search parameters into a SearchQuery object
   */
  static fromURLParams(params: URLSearchParams): SearchQuery {
    const query: SearchQuery = { ...DEFAULT_SEARCH_QUERY }

    // Text search
    const text = params.get(SEARCH_PARAMS.TEXT)
    if (text) {
      query.text = text
    }

    // Device filters
    const devices = params.get(SEARCH_PARAMS.DEVICES)
    if (devices) {
      query.devices = devices.split(",").filter(Boolean)
    }

    // Date range
    const startDate = params.get(SEARCH_PARAMS.DATE_START)
    const endDate = params.get(SEARCH_PARAMS.DATE_END)
    if (startDate && endDate) {
      try {
        query.dateRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        }
      } catch (error) {
        console.warn("Invalid date range in search params:", error)
      }
    }

    // Metric range filters
    const fpsMin = params.get(SEARCH_PARAMS.FPS_MIN)
    const fpsMax = params.get(SEARCH_PARAMS.FPS_MAX)
    const cpuMin = params.get(SEARCH_PARAMS.CPU_MIN)
    const cpuMax = params.get(SEARCH_PARAMS.CPU_MAX)
    const memoryMin = params.get(SEARCH_PARAMS.MEMORY_MIN)
    const memoryMax = params.get(SEARCH_PARAMS.MEMORY_MAX)
    const loadTimeMin = params.get(SEARCH_PARAMS.LOAD_TIME_MIN)
    const loadTimeMax = params.get(SEARCH_PARAMS.LOAD_TIME_MAX)

    if (
      fpsMin ||
      fpsMax ||
      cpuMin ||
      cpuMax ||
      memoryMin ||
      memoryMax ||
      loadTimeMin ||
      loadTimeMax
    ) {
      query.metrics = {}

      if (fpsMin || fpsMax) {
        query.metrics.fps = {}
        if (fpsMin) query.metrics.fps.min = parseFloat(fpsMin)
        if (fpsMax) query.metrics.fps.max = parseFloat(fpsMax)
      }

      if (cpuMin || cpuMax) {
        query.metrics.cpu = {}
        if (cpuMin) query.metrics.cpu.min = parseFloat(cpuMin)
        if (cpuMax) query.metrics.cpu.max = parseFloat(cpuMax)
      }

      if (memoryMin || memoryMax) {
        query.metrics.memory = {}
        if (memoryMin) query.metrics.memory.min = parseFloat(memoryMin)
        if (memoryMax) query.metrics.memory.max = parseFloat(memoryMax)
      }

      if (loadTimeMin || loadTimeMax) {
        query.metrics.loadTime = {}
        if (loadTimeMin) query.metrics.loadTime.min = parseFloat(loadTimeMin)
        if (loadTimeMax) query.metrics.loadTime.max = parseFloat(loadTimeMax)
      }
    }

    // Sessions filter
    const sessions = params.get(SEARCH_PARAMS.SESSIONS)
    if (sessions) {
      query.sessions = sessions.split(",").filter(Boolean)
    }

    // Platforms filter
    const platforms = params.get(SEARCH_PARAMS.PLATFORMS)
    if (platforms) {
      query.platforms = platforms.split(",").filter(Boolean)
    }

    // App versions filter
    const appVersions = params.get(SEARCH_PARAMS.APP_VERSIONS)
    if (appVersions) {
      query.appVersions = appVersions.split(",").filter(Boolean)
    }

    // Metric types filter
    const metricTypes = params.get(SEARCH_PARAMS.METRIC_TYPES)
    if (metricTypes) {
      query.metricTypes = metricTypes.split(",").filter(Boolean)
    }

    // Sorting
    const sortBy = params.get(SEARCH_PARAMS.SORT_BY) as SearchQuery["sortBy"]
    if (
      sortBy &&
      ["timestamp", "metric_value", "created_at"].includes(sortBy)
    ) {
      query.sortBy = sortBy
    }

    const sortOrder = params.get(
      SEARCH_PARAMS.SORT_ORDER
    ) as SearchQuery["sortOrder"]
    if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
      query.sortOrder = sortOrder
    }

    // Pagination
    const limit = params.get(SEARCH_PARAMS.LIMIT)
    if (limit) {
      const parsed = parseInt(limit, 10)
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
        query.limit = parsed
      }
    }

    const offset = params.get(SEARCH_PARAMS.OFFSET)
    if (offset) {
      const parsed = parseInt(offset, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        query.offset = parsed
      }
    }

    return query
  }

  /**
   * Build a search query for common performance metric filters
   */
  static buildPerformanceQuery(options: {
    metricType?: string
    deviceType?: string
    appVersion?: string
    dateRange?: { start: Date; end: Date }
    performanceThreshold?: {
      fps?: number
      memory?: number
      cpu?: number
    }
  }): SearchQuery {
    const query: SearchQuery = { ...DEFAULT_SEARCH_QUERY }

    if (options.metricType) {
      query.metricTypes = [options.metricType]
    }

    if (options.deviceType) {
      query.platforms = [options.deviceType]
    }

    if (options.appVersion) {
      query.appVersions = [options.appVersion]
    }

    if (options.dateRange) {
      query.dateRange = options.dateRange
    }

    if (options.performanceThreshold) {
      query.metrics = {}

      if (options.performanceThreshold.fps !== undefined) {
        query.metrics.fps = { min: options.performanceThreshold.fps }
      }

      if (options.performanceThreshold.memory !== undefined) {
        query.metrics.memory = { max: options.performanceThreshold.memory }
      }

      if (options.performanceThreshold.cpu !== undefined) {
        query.metrics.cpu = { max: options.performanceThreshold.cpu }
      }
    }

    return query
  }

  /**
   * Build a search query for device-specific analysis
   */
  static buildDeviceQuery(
    deviceId: string,
    options?: {
      dateRange?: { start: Date; end: Date }
      metricTypes?: string[]
    }
  ): SearchQuery {
    const query: SearchQuery = {
      ...DEFAULT_SEARCH_QUERY,
      devices: [deviceId],
    }

    if (options?.dateRange) {
      query.dateRange = options.dateRange
    }

    if (options?.metricTypes && options.metricTypes.length > 0) {
      query.metricTypes = options.metricTypes
    }

    return query
  }

  /**
   * Build a search query for session-specific analysis
   */
  static buildSessionQuery(
    sessionId: string,
    options?: {
      metricTypes?: string[]
      sortBy?: SearchQuery["sortBy"]
    }
  ): SearchQuery {
    const query: SearchQuery = {
      ...DEFAULT_SEARCH_QUERY,
      sessions: [sessionId],
    }

    if (options?.metricTypes && options.metricTypes.length > 0) {
      query.metricTypes = options.metricTypes
    }

    if (options?.sortBy) {
      query.sortBy = options.sortBy
    }

    return query
  }

  /**
   * Build a search query for performance regression analysis
   */
  static buildRegressionQuery(options: {
    baseVersion: string
    compareVersion: string
    metricType?: string
    threshold?: number
  }): SearchQuery {
    const query: SearchQuery = {
      ...DEFAULT_SEARCH_QUERY,
      appVersions: [options.baseVersion, options.compareVersion],
      sortBy: "timestamp",
      sortOrder: "asc",
    }

    if (options.metricType) {
      query.metricTypes = [options.metricType]
    }

    // Add performance threshold filtering if specified
    if (options.threshold !== undefined && options.metricType) {
      query.metrics = {}

      switch (options.metricType) {
        case "fps":
          query.metrics.fps = { min: options.threshold }
          break
        case "memory_usage":
          query.metrics.memory = { max: options.threshold }
          break
        case "cpu_usage":
          query.metrics.cpu = { max: options.threshold }
          break
        case "load_time":
        case "navigation_time":
        case "screen_load":
          query.metrics.loadTime = { max: options.threshold }
          break
      }
    }

    return query
  }

  /**
   * Merge multiple search queries (useful for combining filters)
   */
  static mergeQueries(...queries: Partial<SearchQuery>[]): SearchQuery {
    const merged: SearchQuery = { ...DEFAULT_SEARCH_QUERY }

    for (const query of queries) {
      if (query.text) merged.text = query.text

      if (query.devices) {
        merged.devices = merged.devices
          ? Array.from(new Set([...merged.devices, ...query.devices]))
          : query.devices
      }

      if (query.dateRange) merged.dateRange = query.dateRange

      if (query.metrics) {
        merged.metrics = { ...merged.metrics, ...query.metrics }
      }

      if (query.sessions) {
        merged.sessions = merged.sessions
          ? Array.from(new Set([...merged.sessions, ...query.sessions]))
          : query.sessions
      }

      if (query.platforms) {
        merged.platforms = merged.platforms
          ? Array.from(new Set([...merged.platforms, ...query.platforms]))
          : query.platforms
      }

      if (query.appVersions) {
        merged.appVersions = merged.appVersions
          ? Array.from(new Set([...merged.appVersions, ...query.appVersions]))
          : query.appVersions
      }

      if (query.metricTypes) {
        merged.metricTypes = merged.metricTypes
          ? Array.from(new Set([...merged.metricTypes, ...query.metricTypes]))
          : query.metricTypes
      }

      // For sorting and pagination, use the last non-default value
      if (query.sortBy) merged.sortBy = query.sortBy
      if (query.sortOrder) merged.sortOrder = query.sortOrder
      if (query.limit) merged.limit = query.limit
      if (query.offset) merged.offset = query.offset
    }

    return merged
  }

  /**
   * Validate a search query for common issues
   */
  static validateQuery(query: SearchQuery): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check date range validity
    if (query.dateRange) {
      if (query.dateRange.start >= query.dateRange.end) {
        errors.push("Start date must be before end date")
      }

      const daysDiff =
        Math.abs(
          query.dateRange.end.getTime() - query.dateRange.start.getTime()
        ) /
        (1000 * 60 * 60 * 24)

      if (daysDiff > 365) {
        warnings.push("Date range spans more than a year, results may be slow")
      }
    }

    // Check metric ranges
    if (query.metrics) {
      Object.entries(query.metrics).forEach(([metricType, range]) => {
        if (range.min !== undefined && range.max !== undefined) {
          if (range.min >= range.max) {
            errors.push(`${metricType} min value must be less than max value`)
          }
        }

        // Check for reasonable ranges
        if (metricType === "fps") {
          if (range.min !== undefined && range.min < 0) {
            warnings.push(
              "FPS minimum is below 0, which may not yield meaningful results"
            )
          }
          if (range.max !== undefined && range.max > 240) {
            warnings.push(
              "FPS maximum is very high, consider adjusting for realistic results"
            )
          }
        }

        if (metricType === "memory" || metricType === "cpu") {
          if (range.min !== undefined && range.min < 0) {
            warnings.push(
              `${metricType} minimum is below 0, which may not yield meaningful results`
            )
          }
        }
      })
    }

    // Check pagination limits
    if (query.limit && query.limit > 1000) {
      errors.push("Limit cannot exceed 1000 for performance reasons")
    }

    if (query.offset && query.offset < 0) {
      errors.push("Offset cannot be negative")
    }

    // Check array filters
    if (query.devices && query.devices.length > 100) {
      warnings.push("Filtering by more than 100 devices may impact performance")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

/**
 * Helper functions for common search operations
 */

/**
 * Create a search query for the last N days of data
 */
export function createRecentDataQuery(
  days = 7,
  additionalFilters?: Partial<SearchQuery>
): SearchQuery {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  return SearchQueryBuilder.mergeQueries(
    {
      dateRange: { start: startDate, end: endDate },
    },
    additionalFilters || {}
  )
}

/**
 * Create a search query for poor performance metrics
 */
export function createPoorPerformanceQuery(
  additionalFilters?: Partial<SearchQuery>
): SearchQuery {
  return SearchQueryBuilder.mergeQueries(
    {
      metrics: {
        fps: { max: 30 }, // Low FPS
        memory: { min: 500 }, // High memory usage
        cpu: { min: 80 }, // High CPU usage
        loadTime: { min: 2000 }, // Slow load times
      },
    },
    additionalFilters || {}
  )
}

/**
 * Create a search query for excellent performance metrics
 */
export function createExcellentPerformanceQuery(
  additionalFilters?: Partial<SearchQuery>
): SearchQuery {
  return SearchQueryBuilder.mergeQueries(
    {
      metrics: {
        fps: { min: 55 }, // High FPS
        memory: { max: 200 }, // Low memory usage
        cpu: { max: 30 }, // Low CPU usage
        loadTime: { max: 1000 }, // Fast load times
      },
    },
    additionalFilters || {}
  )
}

/**
 * Create a shareable URL from a search query
 */
export function createSearchURL(
  query: SearchQuery,
  baseUrl = "/search"
): string {
  const params = SearchQueryBuilder.toURLParams(query)
  const paramString = params.toString()
  return paramString ? `${baseUrl}?${paramString}` : baseUrl
}
