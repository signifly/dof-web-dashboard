import { SearchQueryBuilder } from "@/lib/utils/search-query-builder"
import { SearchQuery } from "@/lib/services/search-service"

describe("SearchQueryBuilder", () => {
  describe("toURLParams", () => {
    it("should serialize basic search query to URL params", () => {
      const query: SearchQuery = {
        text: "performance test",
        limit: 10,
        offset: 20,
      }

      const params = SearchQueryBuilder.toURLParams(query)
      expect(params.get("text")).toBe("performance test")
      expect(params.get("limit")).toBe("10")
      expect(params.get("offset")).toBe("20")
    })

    it("should serialize array fields correctly", () => {
      const query: SearchQuery = {
        devices: ["device-1", "device-2"],
        platforms: ["android", "ios"],
        metricTypes: ["fps", "memory_usage"],
      }

      const params = SearchQueryBuilder.toURLParams(query)
      expect(params.get("devices")).toBe("device-1,device-2")
      expect(params.get("platforms")).toBe("android,ios")
      expect(params.get("metricTypes")).toBe("fps,memory_usage")
    })

    it("should serialize date range correctly", () => {
      const query: SearchQuery = {
        dateRange: {
          start: new Date("2024-01-01T00:00:00Z"),
          end: new Date("2024-01-31T23:59:59Z"),
        },
      }

      const params = SearchQueryBuilder.toURLParams(query)
      expect(params.get("dateStart")).toBe("2024-01-01T00:00:00.000Z")
      expect(params.get("dateEnd")).toBe("2024-01-31T23:59:59.000Z")
    })

    it("should serialize metric ranges correctly", () => {
      const query: SearchQuery = {
        metrics: {
          fps: { min: 30, max: 60 },
          memory: { min: 100, max: 500 },
          cpu: { min: 0, max: 80 },
          loadTime: { min: 500, max: 3000 },
        },
      }

      const params = SearchQueryBuilder.toURLParams(query)
      expect(params.get("fpsMin")).toBe("30")
      expect(params.get("fpsMax")).toBe("60")
      expect(params.get("memoryMin")).toBe("100")
      expect(params.get("memoryMax")).toBe("500")
      expect(params.get("cpuMin")).toBe("0")
      expect(params.get("cpuMax")).toBe("80")
      expect(params.get("loadTimeMin")).toBe("500")
      expect(params.get("loadTimeMax")).toBe("3000")
    })

    it("should handle empty query", () => {
      const params = SearchQueryBuilder.toURLParams({})
      expect(params.toString()).toBe("")
    })

    it("should handle partial metric ranges", () => {
      const query: SearchQuery = {
        metrics: {
          fps: { min: 30 }, // Only min value
          memory: { max: 500 }, // Only max value
        },
      }

      const params = SearchQueryBuilder.toURLParams(query)
      expect(params.get("fpsMin")).toBe("30")
      expect(params.get("fpsMax")).toBe(null)
      expect(params.get("memoryMin")).toBe(null)
      expect(params.get("memoryMax")).toBe("500")
    })
  })

  describe("fromURLParams", () => {
    it("should deserialize basic URL params to search query", () => {
      const params = new URLSearchParams({
        text: "performance test",
        limit: "10",
        offset: "20",
        sortBy: "timestamp",
        sortOrder: "desc",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.text).toBe("performance test")
      expect(query.limit).toBe(10)
      expect(query.offset).toBe(20)
      expect(query.sortBy).toBe("timestamp")
      expect(query.sortOrder).toBe("desc")
    })

    it("should deserialize array fields correctly", () => {
      const params = new URLSearchParams({
        devices: "device-1,device-2",
        platforms: "android,ios",
        metricTypes: "fps,memory_usage",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.devices).toEqual(["device-1", "device-2"])
      expect(query.platforms).toEqual(["android", "ios"])
      expect(query.metricTypes).toEqual(["fps", "memory_usage"])
    })

    it("should deserialize date range correctly", () => {
      const params = new URLSearchParams({
        dateStart: "2024-01-01T00:00:00.000Z",
        dateEnd: "2024-01-31T23:59:59.000Z",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.dateRange).toBeDefined()
      expect(query.dateRange!.start).toEqual(
        new Date("2024-01-01T00:00:00.000Z")
      )
      expect(query.dateRange!.end).toEqual(new Date("2024-01-31T23:59:59.000Z"))
    })

    it("should deserialize metric ranges correctly", () => {
      const params = new URLSearchParams({
        fpsMin: "30",
        fpsMax: "60",
        memoryMin: "100",
        memoryMax: "500",
        cpuMin: "0",
        cpuMax: "80",
        loadTimeMin: "500",
        loadTimeMax: "3000",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.metrics?.fps).toEqual({ min: 30, max: 60 })
      expect(query.metrics?.memory).toEqual({ min: 100, max: 500 })
      expect(query.metrics?.cpu).toEqual({ min: 0, max: 80 })
      expect(query.metrics?.loadTime).toEqual({ min: 500, max: 3000 })
    })

    it("should handle empty URLSearchParams", () => {
      const params = new URLSearchParams()
      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query).toEqual({})
    })

    it("should handle invalid numeric values", () => {
      const params = new URLSearchParams({
        limit: "invalid",
        offset: "not-a-number",
        fpsMin: "abc",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.limit).toBeUndefined()
      expect(query.offset).toBeUndefined()
      expect(query.metrics?.fps?.min).toBeUndefined()
    })

    it("should handle invalid dates", () => {
      const params = new URLSearchParams({
        dateStart: "invalid-date",
        dateEnd: "not-a-date",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.dateRange).toBeUndefined()
    })

    it("should handle partial metric ranges", () => {
      const params = new URLSearchParams({
        fpsMin: "30",
        memoryMax: "500",
      })

      const query = SearchQueryBuilder.fromURLParams(params)
      expect(query.metrics?.fps).toEqual({ min: 30 })
      expect(query.metrics?.memory).toEqual({ max: 500 })
    })
  })

  describe("createSearchURL", () => {
    it("should create complete search URL", () => {
      const query: SearchQuery = {
        text: "performance",
        platforms: ["android"],
        limit: 20,
      }

      const url = SearchQueryBuilder.createSearchURL("/search", query)
      expect(url).toContain("/search")
      expect(url).toContain("text=performance")
      expect(url).toContain("platforms=android")
      expect(url).toContain("limit=20")
    })

    it("should handle empty query", () => {
      const url = SearchQueryBuilder.createSearchURL("/search", {})
      expect(url).toBe("/search")
    })
  })

  describe("validateQuery", () => {
    it("should validate correct query without issues", () => {
      const query: SearchQuery = {
        text: "performance",
        platforms: ["android", "ios"],
        limit: 10,
        offset: 0,
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.warnings).toHaveLength(0)
    })

    it("should detect limit exceeding maximum", () => {
      const query: SearchQuery = {
        text: "test",
        limit: 1500, // Exceeds max of 1000
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain("Limit cannot exceed 1000")
    })

    it("should detect invalid offset", () => {
      const query: SearchQuery = {
        text: "test",
        offset: -5,
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain("Offset must be non-negative")
    })

    it("should detect invalid date ranges", () => {
      const query: SearchQuery = {
        text: "test",
        dateRange: {
          start: new Date("2024-01-31"),
          end: new Date("2024-01-01"), // End before start
        },
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain("Date range end must be after start")
    })

    it("should detect invalid metric ranges", () => {
      const query: SearchQuery = {
        text: "test",
        metrics: {
          fps: { min: 100, max: 50 }, // Min > Max
        },
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain(
        "FPS range: minimum cannot be greater than maximum"
      )
    })

    it("should warn about very broad searches", () => {
      const query: SearchQuery = {
        text: "a", // Very short search term
        limit: 1000, // Very high limit
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain(
        "Very short search terms may return many results"
      )
      expect(validation.warnings).toContain("High limit may impact performance")
    })

    it("should warn about future date ranges", () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const query: SearchQuery = {
        text: "test",
        dateRange: {
          start: new Date(),
          end: futureDate,
        },
      }

      const validation = SearchQueryBuilder.validateQuery(query)
      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain(
        "Date range extends into the future"
      )
    })
  })

  describe("mergeQueries", () => {
    it("should merge two queries correctly", () => {
      const base: SearchQuery = {
        text: "performance",
        platforms: ["android"],
        limit: 10,
      }

      const override: SearchQuery = {
        platforms: ["ios", "android"],
        offset: 20,
        sortBy: "timestamp",
      }

      const merged = SearchQueryBuilder.mergeQueries(base, override)

      expect(merged.text).toBe("performance")
      expect(merged.platforms).toEqual(["ios", "android"])
      expect(merged.limit).toBe(10)
      expect(merged.offset).toBe(20)
      expect(merged.sortBy).toBe("timestamp")
    })

    it("should merge metric ranges", () => {
      const base: SearchQuery = {
        metrics: {
          fps: { min: 30, max: 60 },
          memory: { min: 100 },
        },
      }

      const override: SearchQuery = {
        metrics: {
          fps: { max: 120 },
          cpu: { min: 0, max: 100 },
        },
      }

      const merged = SearchQueryBuilder.mergeQueries(base, override)

      expect(merged.metrics?.fps).toEqual({ min: 30, max: 120 })
      expect(merged.metrics?.memory).toEqual({ min: 100 })
      expect(merged.metrics?.cpu).toEqual({ min: 0, max: 100 })
    })

    it("should handle empty queries", () => {
      const base: SearchQuery = { text: "test" }
      const override: SearchQuery = {}

      const merged = SearchQueryBuilder.mergeQueries(base, override)
      expect(merged).toEqual({ text: "test" })
    })
  })

  describe("predefined queries", () => {
    it("should create recent data query", () => {
      const query = SearchQueryBuilder.createRecentDataQuery(7)

      expect(query.dateRange).toBeDefined()
      expect(query.sortBy).toBe("timestamp")
      expect(query.sortOrder).toBe("desc")

      const daysDiff = Math.floor(
        (Date.now() - query.dateRange!.start.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBeLessThanOrEqual(7)
    })

    it("should create poor performance query", () => {
      const query = SearchQueryBuilder.createPoorPerformanceQuery()

      expect(query.metrics?.fps?.max).toBe(20)
      expect(query.metrics?.memory?.min).toBe(800)
      expect(query.sortBy).toBe("timestamp")
      expect(query.sortOrder).toBe("desc")
    })

    it("should create excellent performance query", () => {
      const query = SearchQueryBuilder.createExcellentPerformanceQuery()

      expect(query.metrics?.fps?.min).toBe(55)
      expect(query.metrics?.memory?.max).toBe(300)
      expect(query.metrics?.loadTime?.max).toBe(1000)
      expect(query.sortBy).toBe("metric_value")
      expect(query.sortOrder).toBe("desc")
    })
  })
})
