/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react"
import { useAlerts } from "@/hooks/use-alerts"
import { createClient } from "@/lib/supabase/client"

// Mock Supabase client
jest.mock("@/lib/supabase/client")
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  channel: jest.fn(),
  removeChannel: jest.fn(),
}

const mockQuery = {
  select: jest.fn(),
  in: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  ilike: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  eq: jest.fn(),
  update: jest.fn(),
}

// Chain the query methods
Object.keys(mockQuery).forEach(key => {
  if (key !== "update") {
    ;(mockQuery as any)[key].mockReturnValue(mockQuery)
  }
})

const mockData = [
  {
    id: "alert-1",
    config_id: "config-1",
    severity: "critical",
    metric_value: 95.5,
    threshold_violated: 90,
    message: "CPU usage exceeded threshold",
    source: "system_monitor",
    status: "active",
    created_at: "2024-01-15T14:30:00Z",
    config: {
      id: "config-1",
      name: "CPU Usage Monitor",
      metric_type: "cpu_usage",
      threshold_warning: 80,
      threshold_critical: 90,
      notification_channels: [],
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  },
]

describe("useAlerts", () => {
  beforeEach(() => {
    mockCreateClient.mockReturnValue(mockSupabase as any)
    mockSupabase.from.mockReturnValue(mockQuery)
    mockQuery.limit.mockResolvedValue({
      data: mockData,
      error: null,
    })
    mockSupabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("fetches alerts on mount", async () => {
    const { result } = renderHook(() => useAlerts())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.alerts).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it("applies status filter correctly", async () => {
    const filters = { status: ["active"] as const }
    renderHook(() => useAlerts(filters))

    await waitFor(() => {
      expect(mockQuery.in).toHaveBeenCalledWith("status", ["active"])
    })
  })

  it("applies severity filter correctly", async () => {
    const filters = { severity: ["critical"] as const }
    renderHook(() => useAlerts(filters))

    await waitFor(() => {
      expect(mockQuery.in).toHaveBeenCalledWith("severity", ["critical"])
    })
  })

  it("applies date range filter correctly", async () => {
    const filters = {
      date_range: {
        start: "2024-01-15T00:00:00Z",
        end: "2024-01-15T23:59:59Z",
      },
    }
    renderHook(() => useAlerts(filters))

    await waitFor(() => {
      expect(mockQuery.gte).toHaveBeenCalledWith(
        "created_at",
        filters.date_range.start
      )
      expect(mockQuery.lte).toHaveBeenCalledWith(
        "created_at",
        filters.date_range.end
      )
    })
  })

  it("applies search filter correctly", async () => {
    const filters = { search: "CPU" }
    renderHook(() => useAlerts(filters))

    await waitFor(() => {
      expect(mockQuery.ilike).toHaveBeenCalledWith("message", "%CPU%")
    })
  })

  it("acknowledges alert successfully", async () => {
    mockQuery.update.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.acknowledgeAlert("alert-1")

    expect(mockQuery.update).toHaveBeenCalledWith({
      status: "acknowledged",
      acknowledged_at: expect.any(String),
      acknowledged_by: "user-1",
    })
    expect(mockQuery.eq).toHaveBeenCalledWith("id", "alert-1")
    expect(mockQuery.eq).toHaveBeenCalledWith("status", "active")
  })

  it("resolves alert successfully", async () => {
    mockQuery.update.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.resolveAlert("alert-1")

    expect(mockQuery.update).toHaveBeenCalledWith({
      status: "resolved",
      resolved_at: expect.any(String),
      resolved_by: "user-1",
    })
    expect(mockQuery.eq).toHaveBeenCalledWith("id", "alert-1")
    expect(mockQuery.in).toHaveBeenCalledWith("status", [
      "active",
      "acknowledged",
    ])
  })

  it("handles fetch error gracefully", async () => {
    mockQuery.limit.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    })

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("Database error")
    expect(result.current.alerts).toEqual([])
  })

  it("handles acknowledge error gracefully", async () => {
    mockQuery.update.mockResolvedValue({
      error: { message: "Update failed" },
    })

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(result.current.acknowledgeAlert("alert-1")).rejects.toThrow()
    expect(result.current.error).toBe("Update failed")
  })

  it("handles unauthenticated user gracefully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useAlerts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(result.current.acknowledgeAlert("alert-1")).rejects.toThrow(
      "User not authenticated"
    )
  })

  it("sets up real-time subscription", async () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    }
    mockSupabase.channel.mockReturnValue(mockChannel)

    renderHook(() => useAlerts())

    expect(mockSupabase.channel).toHaveBeenCalledWith("alert_changes")
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alert_history",
      },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})
