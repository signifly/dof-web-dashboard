/**
 * @jest-environment node
 */

import { PerformanceService } from "@/lib/services/performance-service"
import { createClient } from "@/lib/supabase/server"

// Mock Supabase client
jest.mock("@/lib/supabase/server")
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>

const mockSupabase = {
  from: jest.fn(),
}

const mockQuery = {
  select: jest.fn(),
  insert: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  lt: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn(),
  delete: jest.fn(),
}

// Chain the query methods
Object.keys(mockQuery).forEach(key => {
  ;(mockQuery as any)[key].mockReturnValue(mockQuery)
})

const mockMetric = {
  id: "metric-1",
  metric_type: "cpu_usage",
  value: 85.5,
  source: "system_monitor",
  metadata: { timestamp: "2024-01-15T14:30:00Z" },
  recorded_at: "2024-01-15T14:30:00Z",
}

describe("PerformanceService", () => {
  let performanceService: PerformanceService

  beforeEach(() => {
    mockCreateClient.mockReturnValue(mockSupabase as any)
    mockSupabase.from.mockReturnValue(mockQuery)
    performanceService = new PerformanceService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("recordMetric", () => {
    it("records single metric successfully", async () => {
      const metricData = {
        metric_type: "cpu_usage",
        value: 85.5,
        source: "system_monitor",
        metadata: { test: true },
      }

      mockQuery.single.mockResolvedValue({
        data: {
          ...metricData,
          id: "metric-1",
          recorded_at: "2024-01-15T14:30:00Z",
        },
        error: null,
      })

      const result = await performanceService.recordMetric(metricData)

      expect(result.id).toBe("metric-1")
      expect(result.metric_type).toBe("cpu_usage")
      expect(mockQuery.insert).toHaveBeenCalledWith(metricData)
    })

    it("handles record metric error", async () => {
      const metricData = {
        metric_type: "cpu_usage",
        value: 85.5,
        source: "system_monitor",
      }

      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      })

      await expect(performanceService.recordMetric(metricData)).rejects.toThrow(
        "Failed to record metric: Insert failed"
      )
    })
  })

  describe("recordMetrics", () => {
    it("records multiple metrics in batch", async () => {
      const metricsData = [
        {
          metric_type: "cpu_usage",
          value: 85.5,
          source: "system_monitor",
        },
        {
          metric_type: "memory_usage",
          value: 67.2,
          source: "system_monitor",
        },
      ]

      const expectedResult = metricsData.map((m, i) => ({
        ...m,
        id: `metric-${i + 1}`,
        recorded_at: "2024-01-15T14:30:00Z",
      }))

      mockQuery.select.mockResolvedValue({
        data: expectedResult,
        error: null,
      })

      const result = await performanceService.recordMetrics(metricsData)

      expect(result).toHaveLength(2)
      expect(mockQuery.insert).toHaveBeenCalledWith(metricsData)
    })
  })

  describe("getMetricHistory", () => {
    it("fetches metric history for time range", async () => {
      const timeRange = {
        start: "2024-01-15T00:00:00Z",
        end: "2024-01-15T23:59:59Z",
      }

      const mockHistory = [mockMetric]

      mockQuery.limit.mockResolvedValue({
        data: mockHistory,
        error: null,
      })

      const result = await performanceService.getMetricHistory(
        "cpu_usage",
        timeRange
      )

      expect(result).toEqual(mockHistory)
      expect(mockQuery.eq).toHaveBeenCalledWith("metric_type", "cpu_usage")
      expect(mockQuery.gte).toHaveBeenCalledWith("recorded_at", timeRange.start)
      expect(mockQuery.lte).toHaveBeenCalledWith("recorded_at", timeRange.end)
      expect(mockQuery.order).toHaveBeenCalledWith("recorded_at", {
        ascending: false,
      })
      expect(mockQuery.limit).toHaveBeenCalledWith(100)
    })

    it("applies custom limit", async () => {
      const timeRange = {
        start: "2024-01-15T00:00:00Z",
        end: "2024-01-15T23:59:59Z",
      }

      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      await performanceService.getMetricHistory("cpu_usage", timeRange, 50)

      expect(mockQuery.limit).toHaveBeenCalledWith(50)
    })
  })

  describe("getLatestMetrics", () => {
    it("fetches latest metrics for all types", async () => {
      const metricTypes = [
        { metric_type: "cpu_usage" },
        { metric_type: "memory_usage" },
        { metric_type: "cpu_usage" }, // Duplicate
      ]

      const latestCpuMetric = { ...mockMetric, metric_type: "cpu_usage" }
      const latestMemoryMetric = {
        ...mockMetric,
        metric_type: "memory_usage",
        value: 67.8,
      }

      // Mock getting metric types
      mockQuery.order.mockResolvedValueOnce({
        data: metricTypes,
        error: null,
      })

      // Mock getting latest metric for each type
      mockQuery.single
        .mockResolvedValueOnce({
          data: latestCpuMetric,
          error: null,
        })
        .mockResolvedValueOnce({
          data: latestMemoryMetric,
          error: null,
        })

      const result = await performanceService.getLatestMetrics()

      expect(result).toHaveLength(2)
      expect(result[0].metric_type).toBe("cpu_usage")
      expect(result[1].metric_type).toBe("memory_usage")
    })

    it("handles no metric types found", async () => {
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await performanceService.getLatestMetrics()

      expect(result).toEqual([])
    })

    it("skips metrics with errors", async () => {
      const metricTypes = [{ metric_type: "cpu_usage" }]

      mockQuery.order.mockResolvedValueOnce({
        data: metricTypes,
        error: null,
      })

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      })

      const result = await performanceService.getLatestMetrics()

      expect(result).toEqual([])
    })
  })

  describe("getMetricStats", () => {
    it("calculates correct statistics", async () => {
      const mockMetrics = [
        { ...mockMetric, value: 90 },
        { ...mockMetric, value: 80 },
        { ...mockMetric, value: 85 },
        { ...mockMetric, value: 95 },
      ]

      // Mock getMetricHistory
      jest
        .spyOn(performanceService, "getMetricHistory")
        .mockResolvedValue(mockMetrics)

      const timeRange = {
        start: "2024-01-15T00:00:00Z",
        end: "2024-01-15T23:59:59Z",
      }

      const result = await performanceService.getMetricStats(
        "cpu_usage",
        timeRange
      )

      expect(result.average).toBe(87.5)
      expect(result.min).toBe(80)
      expect(result.max).toBe(95)
      expect(result.count).toBe(4)
      expect(result.latest).toBe(90) // First item due to DESC order
    })

    it("handles empty metrics", async () => {
      jest.spyOn(performanceService, "getMetricHistory").mockResolvedValue([])

      const timeRange = {
        start: "2024-01-15T00:00:00Z",
        end: "2024-01-15T23:59:59Z",
      }

      const result = await performanceService.getMetricStats(
        "cpu_usage",
        timeRange
      )

      expect(result.average).toBe(0)
      expect(result.min).toBe(0)
      expect(result.max).toBe(0)
      expect(result.count).toBe(0)
      expect(result.latest).toBeNull()
    })
  })

  describe("getDashboardMetrics", () => {
    it("aggregates metrics by type and hour", async () => {
      const now = new Date()
      const mockMetrics = [
        {
          metric_type: "cpu_usage",
          value: 90,
          recorded_at: new Date(
            now.getTime() - 2 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          metric_type: "cpu_usage",
          value: 85,
          recorded_at: new Date(
            now.getTime() - 1 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          metric_type: "memory_usage",
          value: 70,
          recorded_at: new Date(
            now.getTime() - 1 * 60 * 60 * 1000
          ).toISOString(),
        },
      ]

      mockQuery.order.mockResolvedValue({
        data: mockMetrics,
        error: null,
      })

      const result = await performanceService.getDashboardMetrics(24)

      expect(result).toHaveProperty("cpu_usage")
      expect(result).toHaveProperty("memory_usage")
      expect(result.cpu_usage.current).toBe(85) // Latest value
      expect(result.memory_usage.current).toBe(70)
      expect(result.cpu_usage.data).toBeInstanceOf(Array)
    })

    it("handles no metrics", async () => {
      mockQuery.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await performanceService.getDashboardMetrics()

      expect(result).toEqual({})
    })
  })

  describe("cleanupOldMetrics", () => {
    it("deletes old metrics successfully", async () => {
      mockQuery.delete.mockResolvedValue({
        count: 150,
        error: null,
      })

      const result = await performanceService.cleanupOldMetrics(30)

      expect(result.deletedCount).toBe(150)
      expect(mockQuery.delete).toHaveBeenCalledWith({ count: "exact" })
      expect(mockQuery.lt).toHaveBeenCalledWith(
        "recorded_at",
        expect.any(String)
      )
    })

    it("handles cleanup error", async () => {
      mockQuery.delete.mockResolvedValue({
        count: null,
        error: { message: "Delete failed" },
      })

      await expect(performanceService.cleanupOldMetrics()).rejects.toThrow(
        "Failed to cleanup old metrics: Delete failed"
      )
    })
  })

  describe("generateSampleMetrics", () => {
    it("generates sample metrics for testing", async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock recordMetrics
      jest.spyOn(performanceService, "recordMetrics").mockResolvedValue([])

      await performanceService.generateSampleMetrics()

      expect(performanceService.recordMetrics).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metric_type: "cpu_usage",
            source: "system_monitor",
          }),
          expect.objectContaining({
            metric_type: "memory_usage",
            source: "system_monitor",
          }),
          expect.objectContaining({
            metric_type: "page_load_time",
            source: "lighthouse",
          }),
        ])
      )
    })
  })
})
