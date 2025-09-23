import {
  getPerformanceSummaryClient,
  getPerformanceTrendsClient,
  getDashboardDataClient,
} from "@/lib/performance-data-client"

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe("performance-data-client", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("getPerformanceSummaryClient", () => {
    it("should fetch performance summary from API", async () => {
      const mockSummary = {
        avgFps: 58.5,
        avgCpu: 45.2,
        avgMemory: 256.8,
        totalSessions: 25,
        totalMetrics: 1250,
        deviceCount: 8,
        platformBreakdown: [],
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSummary),
      } as any)

      const result = await getPerformanceSummaryClient()

      expect(mockFetch).toHaveBeenCalledWith("/api/performance/summary")
      expect(result).toEqual(mockSummary)
    })

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as any)

      await expect(getPerformanceSummaryClient()).rejects.toThrow(
        "Failed to fetch performance summary: 500 Internal Server Error"
      )
    })

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"))

      await expect(getPerformanceSummaryClient()).rejects.toThrow(
        "Network error"
      )
    })

    it("should handle JSON parsing errors", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as any)

      await expect(getPerformanceSummaryClient()).rejects.toThrow(
        "Invalid JSON"
      )
    })
  })

  describe("getPerformanceTrendsClient", () => {
    it("should fetch performance trends with default limit", async () => {
      const mockTrends = [
        {
          timestamp: "2023-01-01T12:00:00Z",
          fps: 60,
          cpu_usage: 45,
          memory_usage: 256,
          load_time: 1200,
          screen_name: "HomeScreen",
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTrends),
      } as any)

      const result = await getPerformanceTrendsClient()

      expect(mockFetch).toHaveBeenCalledWith("/api/performance/trends?limit=50")
      expect(result).toEqual(mockTrends)
    })

    it("should fetch performance trends with custom limit", async () => {
      const mockTrends = []

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTrends),
      } as any)

      const result = await getPerformanceTrendsClient(100)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/performance/trends?limit=100"
      )
      expect(result).toEqual(mockTrends)
    })

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as any)

      await expect(getPerformanceTrendsClient()).rejects.toThrow(
        "Failed to fetch performance trends: 404 Not Found"
      )
    })

    it("should handle zero limit", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      } as any)

      await getPerformanceTrendsClient(0)

      expect(mockFetch).toHaveBeenCalledWith("/api/performance/trends?limit=0")
    })

    it("should handle negative limit", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
      } as any)

      await getPerformanceTrendsClient(-10)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/performance/trends?limit=-10"
      )
    })
  })

  describe("getDashboardDataClient", () => {
    it("should fetch both summary and trends data", async () => {
      const mockSummary = {
        avgFps: 58.5,
        avgCpu: 45.2,
        avgMemory: 256.8,
        totalSessions: 25,
        totalMetrics: 1250,
        deviceCount: 8,
        platformBreakdown: [],
      }

      const mockTrends = [
        {
          timestamp: "2023-01-01T12:00:00Z",
          fps: 60,
          cpu_usage: 45,
          memory_usage: 256,
          load_time: 1200,
          screen_name: "HomeScreen",
        },
      ]

      // Mock multiple fetch calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSummary),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockTrends),
        } as any)

      const result = await getDashboardDataClient()

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/performance/summary")
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/performance/trends?limit=50"
      )
      expect(result).toEqual({
        summary: mockSummary,
        trends: mockTrends,
      })
    })

    it("should fetch with custom trends limit", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
        } as any)

      await getDashboardDataClient(150)

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/performance/trends?limit=150"
      )
    })

    it("should handle errors from summary API", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
        } as any)

      await expect(getDashboardDataClient()).rejects.toThrow(
        "Failed to fetch performance summary"
      )
    })

    it("should handle errors from trends API", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as any)

      await expect(getDashboardDataClient()).rejects.toThrow(
        "Failed to fetch performance trends"
      )
    })

    it("should handle network errors during summary fetch", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
        } as any)

      await expect(getDashboardDataClient()).rejects.toThrow("Network error")
    })

    it("should handle network errors during trends fetch", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        } as any)
        .mockRejectedValueOnce(new Error("Network error"))

      await expect(getDashboardDataClient()).rejects.toThrow("Network error")
    })

    it("should handle both APIs returning empty data", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(null),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
        } as any)

      const result = await getDashboardDataClient()

      expect(result).toEqual({
        summary: null,
        trends: [],
      })
    })

    it("should execute both requests in parallel", async () => {
      const summaryPromise = new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: jest.fn().mockResolvedValue({}),
            }),
          100
        )
      )

      const trendsPromise = new Promise(resolve =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: jest.fn().mockResolvedValue([]),
            }),
          100
        )
      )

      mockFetch
        .mockReturnValueOnce(summaryPromise as any)
        .mockReturnValueOnce(trendsPromise as any)

      const startTime = Date.now()
      await getDashboardDataClient()
      const endTime = Date.now()

      // Should complete in roughly 100ms (parallel), not 200ms (sequential)
      expect(endTime - startTime).toBeLessThan(150)
    })
  })

  describe("error handling edge cases", () => {
    it("should handle undefined response", async () => {
      mockFetch.mockResolvedValue(undefined as any)

      await expect(getPerformanceSummaryClient()).rejects.toThrow()
    })

    it("should handle response without json method", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      } as any)

      await expect(getPerformanceSummaryClient()).rejects.toThrow()
    })

    it("should handle fetch timeout", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 1000)
          )
      )

      await expect(getPerformanceSummaryClient()).rejects.toThrow(
        "Request timeout"
      )
    })
  })
})
