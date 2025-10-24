/**
 * @jest-environment node
 */
import { GET } from "@/app/api/performance/trends/route"
import { getPerformanceTrends } from "@/lib/performance-data"
import { NextRequest } from "next/server"

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: () => Promise.resolve(data),
      status: options.status || 200,
      headers: new Map([["content-type", "application/json"]]),
    })),
  },
  NextRequest: jest.fn(),
}))

// Mock the performance data function
jest.mock("@/lib/performance-data", () => ({
  getPerformanceTrends: jest.fn(),
}))

const mockGetPerformanceTrends = getPerformanceTrends as jest.MockedFunction<
  typeof getPerformanceTrends
>

// Helper to create mock NextRequest
function createMockRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/performance/trends")
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return new NextRequest(url)
}

describe("/api/performance/trends", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return performance trends data with default limit", async () => {
    const mockTrends = [
      {
        timestamp: "2023-01-01T12:00:00Z",
        fps: 60,
        cpu_usage: 45,
        memory_usage: 256,
        load_time: 1200,
        cache_size: 100,
        screen_name: "HomeScreen",
      },
      {
        timestamp: "2023-01-01T12:01:00Z",
        fps: 58,
        cpu_usage: 48,
        memory_usage: 260,
        load_time: 1150,
        cache_size: 110,
        screen_name: "ProfileScreen",
      },
    ]

    mockGetPerformanceTrends.mockResolvedValue(mockTrends)

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockTrends)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(50) // Default limit
  })

  it("should use custom limit from query parameter", async () => {
    const mockTrends = [
      {
        timestamp: "2023-01-01T12:00:00Z",
        fps: 60,
        cpu_usage: 45,
        memory_usage: 256,
        load_time: 1200,
        cache_size: 100,
        screen_name: "HomeScreen",
      },
    ]

    mockGetPerformanceTrends.mockResolvedValue(mockTrends)

    const request = createMockRequest({ limit: "100" })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockTrends)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(100)
  })

  it("should handle invalid limit parameter", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({ limit: "invalid" })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(50) // Falls back to default
  })

  it("should handle negative limit parameter", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({ limit: "-10" })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(50) // Falls back to default
  })

  it("should handle zero limit parameter", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({ limit: "0" })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(50) // Falls back to default
  })

  it("should enforce maximum limit", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({ limit: "2000" })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(1000) // Capped at maximum
  })

  it("should handle errors and return 500 status", async () => {
    const error = new Error("Database connection failed")
    mockGetPerformanceTrends.mockRejectedValue(error)

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: "Failed to fetch performance trends",
    })
  })

  it("should handle generic errors", async () => {
    mockGetPerformanceTrends.mockRejectedValue("Unexpected error")

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: "Failed to fetch performance trends",
    })
  })

  it("should return proper Content-Type header", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest()
    const response = await GET(request)

    expect(response.headers.get("content-type")).toContain("application/json")
  })

  it("should handle empty trends data", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it("should handle null trends data", async () => {
    mockGetPerformanceTrends.mockResolvedValue(null as any)

    const request = createMockRequest()
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toBe(null)
  })

  it("should handle multiple query parameters correctly", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({
      limit: "75",
      other: "ignored",
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(75)
  })

  it("should handle decimal limit values", async () => {
    mockGetPerformanceTrends.mockResolvedValue([])

    const request = createMockRequest({ limit: "50.7" })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetPerformanceTrends).toHaveBeenCalledWith(50) // Should be parsed as integer
  })
})
