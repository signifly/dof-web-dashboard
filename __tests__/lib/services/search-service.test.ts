import { SearchService } from "@/lib/services/search-service"
import { SearchQuery, SearchResults } from "@/lib/services/search-service"
import { createClient } from "@/lib/supabase/server"

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => ({
                contains: jest.fn(() => ({
                  textSearch: jest.fn(() => ({
                    order: jest.fn(() => ({
                      range: jest.fn(() => ({
                        limit: jest.fn(() => ({
                          data: [],
                          error: null,
                        })),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "test-uuid-123"),
  },
})

describe("SearchService", () => {
  let searchService: SearchService
  let mockSupabaseClient: any

  beforeEach(() => {
    searchService = new SearchService()
    mockSupabaseClient = createClient()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("search", () => {
    const mockMetrics = [
      {
        id: "metric-1",
        session_id: "session-1",
        metric_type: "fps",
        metric_value: 45,
        metric_unit: "fps",
        context: { screen_name: "home" },
        timestamp: "2024-01-01T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "metric-2",
        session_id: "session-2",
        metric_type: "memory_usage",
        metric_value: 300,
        metric_unit: "mb",
        context: { screen_name: "profile" },
        timestamp: "2024-01-02T00:00:00Z",
        created_at: "2024-01-02T00:00:00Z",
      },
    ]

    const mockSessions = [
      {
        id: "session-1",
        anonymous_user_id: "user-1",
        session_start: "2024-01-01T00:00:00Z",
        session_end: "2024-01-01T01:00:00Z",
        app_version: "1.0.0",
        device_type: "android",
        os_version: "13.0",
        created_at: "2024-01-01T00:00:00Z",
      },
    ]

    beforeEach(() => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          textSearch: jest.fn(() => ({
            eq: jest.fn(() => ({
              in: jest.fn(() => ({
                gte: jest.fn(() => ({
                  lte: jest.fn(() => ({
                    contains: jest.fn(() => ({
                      order: jest.fn(() => ({
                        range: jest.fn(() => ({
                          limit: jest.fn(() =>
                            Promise.resolve({
                              data: mockMetrics,
                              error: null,
                            })
                          ),
                        })),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })
    })

    it("should perform basic text search", async () => {
      const query: SearchQuery = { text: "fps" }
      const results = await searchService.search(query)

      expect(results).toBeDefined()
      expect(results.metrics).toHaveLength(2)
      expect(results.total).toBeGreaterThan(0)
      expect(results.executionTime).toBeGreaterThan(0)
    })

    it("should filter by device types", async () => {
      const query: SearchQuery = {
        platforms: ["android"],
        limit: 10,
        offset: 0,
      }

      const results = await searchService.search(query)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "performance_metrics"
      )
      expect(results).toBeDefined()
      expect(results.metrics).toEqual(mockMetrics)
    })

    it("should filter by date range", async () => {
      const query: SearchQuery = {
        dateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-02"),
        },
      }

      const results = await searchService.search(query)

      expect(results).toBeDefined()
      expect(results.metrics).toHaveLength(2)
    })

    it("should filter by metric value ranges", async () => {
      const query: SearchQuery = {
        metrics: {
          fps: { min: 40, max: 60 },
        },
      }

      const results = await searchService.search(query)

      expect(results).toBeDefined()
      expect(results.metrics).toHaveLength(2)
    })

    it("should handle empty search results", async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          textSearch: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: [],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        })),
      })

      const query: SearchQuery = { text: "nonexistent" }
      const results = await searchService.search(query)

      expect(results.metrics).toHaveLength(0)
      expect(results.sessions).toHaveLength(0)
      expect(results.total).toBe(0)
    })

    it("should handle search errors gracefully", async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          textSearch: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => ({
                limit: jest.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: "Database error" },
                  })
                ),
              })),
            })),
          })),
        })),
      })

      const query: SearchQuery = { text: "error" }
      const results = await searchService.search(query)

      expect(results.metrics).toHaveLength(0)
      expect(results.sessions).toHaveLength(0)
      expect(results.total).toBe(0)
    })

    it("should calculate facets correctly", async () => {
      const results = await searchService.search({ text: "test" })

      expect(results.facets).toBeDefined()
      expect(results.facets.metricTypes).toBeDefined()
      expect(results.facets.platforms).toBeDefined()
      expect(results.facets.appVersions).toBeDefined()
      expect(results.facets.devices).toBeDefined()
    })

    it("should support pagination", async () => {
      const query: SearchQuery = {
        text: "test",
        limit: 5,
        offset: 10,
      }

      const results = await searchService.search(query)

      expect(results).toBeDefined()
      expect(results.hasMore).toBeDefined()
    })

    it("should support sorting", async () => {
      const query: SearchQuery = {
        text: "test",
        sortBy: "timestamp",
        sortOrder: "desc",
      }

      const results = await searchService.search(query)

      expect(results).toBeDefined()
      expect(results.metrics).toHaveLength(2)
    })
  })

  describe("getSuggestions", () => {
    beforeEach(() => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          ilike: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({
                data: [{ metric_type: "fps" }, { metric_type: "memory_usage" }],
                error: null,
              })
            ),
          })),
        })),
      })
    })

    it("should return search suggestions", async () => {
      const suggestions = await searchService.getSuggestions("fp")

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0]).toEqual({
        text: "fps",
        type: "metric_type",
        count: 0,
      })
    })

    it("should handle empty input", async () => {
      const suggestions = await searchService.getSuggestions("")

      expect(suggestions).toHaveLength(0)
    })

    it("should limit suggestions count", async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          ilike: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({
                data: Array(20).fill({ metric_type: "test" }),
                error: null,
              })
            ),
          })),
        })),
      })

      const suggestions = await searchService.getSuggestions("test")

      expect(suggestions.length).toBeLessThanOrEqual(10)
    })
  })

  describe("getFilterOptions", () => {
    beforeEach(() => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() =>
          Promise.resolve({
            data: [
              { device_type: "android", anonymous_user_id: "user-1" },
              { device_type: "ios", anonymous_user_id: "user-2" },
            ],
            error: null,
          })
        ),
      })
    })

    it("should return available filter options", async () => {
      const options = await searchService.getFilterOptions()

      expect(options).toBeDefined()
      expect(options.platforms).toContain("android")
      expect(options.platforms).toContain("ios")
      expect(options.devices).toContain("user-1")
      expect(options.devices).toContain("user-2")
    })

    it("should handle errors in filter options", async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: "Database error" },
          })
        ),
      })

      const options = await searchService.getFilterOptions()

      expect(options.platforms).toHaveLength(0)
      expect(options.devices).toHaveLength(0)
      expect(options.appVersions).toHaveLength(0)
    })
  })
})
