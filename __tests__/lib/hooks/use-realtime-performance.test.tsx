import { renderHook, act, waitFor } from "@testing-library/react"
import { createClient } from "@/lib/supabase/client"

// Unmock the hook for this test file since we want to test the actual implementation
jest.unmock("../../../lib/hooks/use-realtime-performance")
import { useRealtimePerformance } from "@/lib/hooks/use-realtime-performance"

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>

describe("useRealtimePerformance", () => {
  let mockChannel: any
  let mockSupabase: any

  beforeEach(() => {
    jest.useFakeTimers()

    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    }

    mockSupabase = {
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useRealtimePerformance())

    expect(result.current.data).toEqual([])
    expect(result.current.isConnected).toBe(false)
    expect(result.current.lastUpdate).toBe(null)
    expect(result.current.error).toBe(null)
    expect(typeof result.current.reconnect).toBe("function")
  })

  it("should initialize with provided initial data", () => {
    const initialData = [
      {
        timestamp: "2023-01-01T00:00:00Z",
        fps: 60,
        memory_usage: 100,
        cpu_usage: 50,
        load_time: 1000,
      cache_size: 0,
        screen_name: "test",
      },
    ]

    const { result } = renderHook(() => useRealtimePerformance({ initialData }))

    expect(result.current.data).toEqual(initialData)
  })

  it("should set up realtime subscription on mount", () => {
    renderHook(() => useRealtimePerformance())

    expect(mockSupabase.channel).toHaveBeenCalledWith(
      "performance_metrics_realtime"
    )
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "performance_metrics",
      },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function))
  })

  it("should handle connection status changes", async () => {
    const { result } = renderHook(() => useRealtimePerformance())

    // Get the status callback from the subscribe call
    const statusCallback = mockChannel.subscribe.mock.calls[0][0]

    act(() => {
      statusCallback("SUBSCRIBED")
    })

    expect(result.current.isConnected).toBe(true)

    act(() => {
      statusCallback("CLOSED")
    })

    expect(result.current.isConnected).toBe(false)
  })

  it("should handle new metric data and update trends", async () => {
    const { result } = renderHook(() => useRealtimePerformance())

    // Get the data callback from the on call
    const dataCallback = mockChannel.on.mock.calls[0][2]

    const newMetric = {
      new: {
        id: "1",
        timestamp: "2023-01-01T00:00:00Z",
        metric_type: "fps",
        metric_value: 60,
        metric_unit: "fps",
        context: { screen_name: "test" },
      },
    }

    act(() => {
      dataCallback(newMetric)
    })

    // Fast-forward timers to trigger the processing interval (2 seconds)
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    await waitFor(
      () => {
        expect(result.current.data.length).toBeGreaterThan(0)
        expect(result.current.lastUpdate).not.toBe(null)
      },
      { timeout: 3000 }
    )
  })

  it("should handle reconnection", async () => {
    const { result } = renderHook(() => useRealtimePerformance())

    // Simulate disconnection
    const statusCallback = mockChannel.subscribe.mock.calls[0][0]
    act(() => {
      statusCallback("CLOSED")
    })

    expect(result.current.isConnected).toBe(false)

    // Test reconnect function
    act(() => {
      result.current.reconnect()
    })

    // Should set up subscription again
    expect(mockSupabase.channel).toHaveBeenCalledTimes(2)
  })

  it("should limit data points based on maxDataPoints", async () => {
    const maxDataPoints = 2
    const { result } = renderHook(() =>
      useRealtimePerformance({ maxDataPoints })
    )

    const dataCallback = mockChannel.on.mock.calls[0][2]

    // Add multiple metrics
    for (let i = 0; i < 5; i++) {
      const newMetric = {
        new: {
          id: `${i}`,
          timestamp: `2023-01-01T00:0${i}:00Z`,
          metric_type: "fps",
          metric_value: 60 + i,
          metric_unit: "fps",
          context: { screen_name: "test" },
        },
      }

      act(() => {
        dataCallback(newMetric)
      })
    }

    await waitFor(() => {
      expect(result.current.data.length).toBeLessThanOrEqual(maxDataPoints)
    })
  })

  it("should group metrics by timestamp", async () => {
    const { result } = renderHook(() => useRealtimePerformance())

    const dataCallback = mockChannel.on.mock.calls[0][2]
    const timestamp = "2023-01-01T00:00:00Z"

    // Add multiple metrics with the same timestamp
    const metrics = [
      {
        new: {
          id: "1",
          timestamp,
          metric_type: "fps",
          metric_value: 60,
          metric_unit: "fps",
          context: { screen_name: "test" },
        },
      },
      {
        new: {
          id: "2",
          timestamp,
          metric_type: "memory_usage",
          metric_value: 100,
          metric_unit: "MB",
          context: { screen_name: "test" },
        },
      },
    ]

    for (const metric of metrics) {
      act(() => {
        dataCallback(metric)
      })
    }

    await waitFor(() => {
      expect(result.current.data.length).toBe(1) // Should be grouped into one trend point
      const trendPoint = result.current.data[0]
      expect(trendPoint.fps).toBe(60)
      expect(trendPoint.memory_usage).toBe(100)
    })
  })

  it("should cleanup subscription on unmount", () => {
    const { unmount } = renderHook(() => useRealtimePerformance())

    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalled()
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it("should handle errors gracefully", () => {
    mockChannel.subscribe.mockImplementation((callback: any) => {
      callback("CHANNEL_ERROR")
    })

    const { result } = renderHook(() => useRealtimePerformance())

    expect(result.current.error).not.toBe(null)
    expect(result.current.isConnected).toBe(false)
  })
})
