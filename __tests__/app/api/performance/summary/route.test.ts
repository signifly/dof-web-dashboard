/**
 * @jest-environment node
 */
import { GET } from "@/app/api/performance/summary/route"
import { getPerformanceSummary } from "@/lib/performance-data"

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: () => Promise.resolve(data),
      status: options.status || 200,
      headers: new Map([["content-type", "application/json"]]),
    })),
  },
}))

// Mock the performance data function
jest.mock("@/lib/performance-data", () => ({
  getPerformanceSummary: jest.fn(),
}))

const mockGetPerformanceSummary = getPerformanceSummary as jest.MockedFunction<
  typeof getPerformanceSummary
>

describe("/api/performance/summary", () => {
  const mockRequest = new Request(
    "http://localhost:3000/api/performance/summary"
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return performance summary data", async () => {
    const mockSummary = {
      avgFps: 58.5,
      avgCpu: 45.2,
      avgMemory: 256.8,
      avgLoadTime: 1200,
      totalSessions: 25,
      totalMetrics: 1250,
      deviceCount: 8,
      platformBreakdown: [
        { platform: "iOS", count: 15 },
        { platform: "Android", count: 10 },
      ],
      performanceTiers: [
        { tier: "excellent", count: 10 },
        { tier: "good", count: 8 },
        { tier: "average", count: 5 },
        { tier: "poor", count: 2 },
      ],
      recentActivity: [],
      memoryPressure: [
        { level: "low", count: 15 },
        { level: "medium", count: 8 },
        { level: "high", count: 2 },
      ],
      fpsDistribution: [
        { range: "60+", count: 10 },
        { range: "45-59", count: 8 },
        { range: "30-44", count: 5 },
        { range: "<30", count: 2 },
      ],
    }

    mockGetPerformanceSummary.mockResolvedValue(mockSummary)

    const response = await GET(mockRequest as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockSummary)
    expect(mockGetPerformanceSummary).toHaveBeenCalledTimes(1)
  })

  it("should handle errors and return 500 status", async () => {
    const error = new Error("Database connection failed")
    mockGetPerformanceSummary.mockRejectedValue(error)

    const response = await GET(mockRequest as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: "Failed to fetch performance summary",
    })
  })

  it("should handle generic errors", async () => {
    mockGetPerformanceSummary.mockRejectedValue("Unexpected error")

    const response = await GET(mockRequest as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: "Failed to fetch performance summary",
    })
  })

  it("should return proper Content-Type header", async () => {
    mockGetPerformanceSummary.mockResolvedValue({
      avgFps: 60,
      avgCpu: 40,
      avgMemory: 200,
      avgLoadTime: 1000,
      totalSessions: 10,
      totalMetrics: 500,
      deviceCount: 5,
      platformBreakdown: [],
      performanceTiers: [],
      recentActivity: [],
      memoryPressure: [],
      fpsDistribution: [],
    })

    const response = await GET(mockRequest as any)

    expect(response.headers.get("content-type")).toContain("application/json")
  })

  it("should handle null/undefined data gracefully", async () => {
    mockGetPerformanceSummary.mockResolvedValue(null as any)

    const response = await GET(mockRequest as any)

    expect(response.status).toBe(200)
    expect(await response.json()).toBe(null)
  })

  it("should handle empty summary data", async () => {
    const emptySummary = {
      avgFps: 0,
      avgCpu: 0,
      avgMemory: 0,
      avgLoadTime: 0,
      totalSessions: 0,
      totalMetrics: 0,
      deviceCount: 0,
      platformBreakdown: [],
      performanceTiers: [],
      recentActivity: [],
      memoryPressure: [],
      fpsDistribution: [],
    }

    mockGetPerformanceSummary.mockResolvedValue(emptySummary)

    const response = await GET(mockRequest as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(emptySummary)
  })
})
