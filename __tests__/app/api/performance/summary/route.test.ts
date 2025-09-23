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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return performance summary data", async () => {
    const mockSummary = {
      avgFps: 58.5,
      avgCpu: 45.2,
      avgMemory: 256.8,
      totalSessions: 25,
      totalMetrics: 1250,
      deviceCount: 8,
      platformBreakdown: [
        { platform: "iOS", count: 15 },
        { platform: "Android", count: 10 },
      ],
    }

    mockGetPerformanceSummary.mockResolvedValue(mockSummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockSummary)
    expect(mockGetPerformanceSummary).toHaveBeenCalledTimes(1)
  })

  it("should handle errors and return 500 status", async () => {
    const error = new Error("Database connection failed")
    mockGetPerformanceSummary.mockRejectedValue(error)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: "Failed to fetch performance summary",
    })
  })

  it("should handle generic errors", async () => {
    mockGetPerformanceSummary.mockRejectedValue("Unexpected error")

    const response = await GET()
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
      totalSessions: 10,
      totalMetrics: 500,
      deviceCount: 5,
      platformBreakdown: [],
    })

    const response = await GET()

    expect(response.headers.get("content-type")).toContain("application/json")
  })

  it("should handle null/undefined data gracefully", async () => {
    mockGetPerformanceSummary.mockResolvedValue(null as any)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toBe(null)
  })

  it("should handle empty summary data", async () => {
    const emptySummary = {
      avgFps: 0,
      avgCpu: 0,
      avgMemory: 0,
      totalSessions: 0,
      totalMetrics: 0,
      deviceCount: 0,
      platformBreakdown: [],
    }

    mockGetPerformanceSummary.mockResolvedValue(emptySummary)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(emptySummary)
  })
})
