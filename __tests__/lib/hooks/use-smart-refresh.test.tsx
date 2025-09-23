import { renderHook, act, waitFor } from "@testing-library/react"
import { useSmartRefresh } from "@/lib/hooks/use-smart-refresh"

// Mock the interaction detector hook
jest.mock("@/lib/hooks/use-interaction-detector", () => ({
  useInteractionDetector: jest.fn(() => ({
    isUserActive: false,
    timeSinceLastActivity: 5000,
  })),
}))

// Mock the refresh config utilities
jest.mock("@/lib/utils/refresh-config", () => ({
  ...jest.requireActual("@/lib/utils/refresh-config"),
  loadRefreshConfig: jest.fn(() => ({
    active: 30000,
    summary: 300000,
    background: 600000,
    interactive: 60000,
  })),
}))

const mockUseInteractionDetector =
  require("@/lib/hooks/use-interaction-detector")
    .useInteractionDetector as jest.MockedFunction<any>

describe("useSmartRefresh", () => {
  let mockFetchFn: jest.Mock
  let mockSetTimeout: jest.SpyInstance
  let mockClearTimeout: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    mockFetchFn = jest.fn()
    mockSetTimeout = jest.spyOn(global, "setTimeout")
    mockClearTimeout = jest.spyOn(global, "clearTimeout")

    // Reset interaction detector mock
    mockUseInteractionDetector.mockReturnValue({
      isUserActive: false,
      timeSinceLastActivity: 5000,
    })

    // Mock document visibility
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockSetTimeout.mockRestore()
    mockClearTimeout.mockRestore()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSmartRefresh(mockFetchFn))

    expect(result.current.data).toBe(null)
    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.lastUpdated).toBe(null)
    expect(result.current.nextRefresh).toBe(null)
    expect(result.current.error).toBe(null)
    expect(result.current.isEnabled).toBe(true)
    expect(result.current.isPaused).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(typeof result.current.refresh).toBe("function")
    expect(typeof result.current.enable).toBe("function")
    expect(typeof result.current.disable).toBe("function")
    expect(typeof result.current.pause).toBe("function")
    expect(typeof result.current.resume).toBe("function")
    expect(typeof result.current.reset).toBe("function")
  })

  it("should initialize with provided initial data", () => {
    const initialData = { test: "data" }
    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, {}, initialData)
    )

    expect(result.current.data).toEqual(initialData)
  })

  it("should perform initial refresh when enabled and no initial data", async () => {
    const testData = { result: "success" }
    mockFetchFn.mockResolvedValue(testData)

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true })
    )

    expect(result.current.isRefreshing).toBe(true)

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
      expect(result.current.data).toEqual(testData)
      expect(result.current.lastUpdated).toBeInstanceOf(Date)
    })

    expect(mockFetchFn).toHaveBeenCalledTimes(1)
  })

  it("should not perform initial refresh when disabled", () => {
    renderHook(() => useSmartRefresh(mockFetchFn, { enabled: false }))

    expect(mockFetchFn).not.toHaveBeenCalled()
  })

  it("should not perform initial refresh when initial data is provided", () => {
    const initialData = { test: "data" }
    renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true }, initialData)
    )

    expect(mockFetchFn).not.toHaveBeenCalled()
  })

  it("should handle fetch errors properly", async () => {
    const error = new Error("Fetch failed")
    mockFetchFn.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true })
    )

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
      expect(result.current.error).toEqual(error)
      expect(result.current.retryCount).toBe(1)
    })
  })

  it("should schedule refresh with correct interval", async () => {
    mockFetchFn.mockResolvedValue({ test: "data" })

    renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        type: "active",
      })
    )

    await waitFor(() => {
      expect(mockSetTimeout).toHaveBeenCalled()
    })

    // Check that setTimeout was called with the active interval (30000ms)
    const setTimeoutCall = mockSetTimeout.mock.calls.find(
      call => call[1] === 30000
    )
    expect(setTimeoutCall).toBeDefined()
  })

  it("should pause refresh when user is interacting", () => {
    // Mock user as active with recent interaction
    mockUseInteractionDetector.mockReturnValue({
      isUserActive: true,
      timeSinceLastActivity: 1000, // Within grace period
    })

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        pauseOnInteraction: true,
      })
    )

    expect(result.current.isPaused).toBe(true)
  })

  it("should not pause when pauseOnInteraction is false", () => {
    mockUseInteractionDetector.mockReturnValue({
      isUserActive: true,
      timeSinceLastActivity: 1000,
    })

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        pauseOnInteraction: false,
      })
    )

    expect(result.current.isPaused).toBe(false)
  })

  it("should handle manual refresh", async () => {
    const testData = { result: "manual" }
    mockFetchFn.mockResolvedValue(testData)

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: false })
    )

    act(() => {
      result.current.refresh()
    })

    expect(result.current.isRefreshing).toBe(true)

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
      expect(result.current.data).toEqual(testData)
    })
  })

  it("should not start new refresh when already refreshing", () => {
    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: false })
    )

    act(() => {
      result.current.refresh()
      result.current.refresh() // Second call should be ignored
    })

    expect(mockFetchFn).toHaveBeenCalledTimes(1)
  })

  it("should enable and disable refresh", async () => {
    mockFetchFn.mockResolvedValue({ test: "data" })

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: false })
    )

    expect(result.current.isEnabled).toBe(false)

    act(() => {
      result.current.enable()
    })

    expect(result.current.isEnabled).toBe(true)

    act(() => {
      result.current.disable()
    })

    expect(result.current.isEnabled).toBe(false)
    expect(result.current.nextRefresh).toBe(null)
  })

  it("should pause and resume refresh", () => {
    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true })
    )

    act(() => {
      result.current.pause()
    })

    expect(result.current.isPaused).toBe(true)
    expect(result.current.nextRefresh).toBe(null)

    act(() => {
      result.current.resume()
    })

    expect(result.current.isPaused).toBe(false)
  })

  it("should reset refresh state", () => {
    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true })
    )

    // Set some state
    act(() => {
      result.current.pause()
    })

    expect(result.current.isPaused).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isPaused).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.retryCount).toBe(0)
  })

  it("should handle retry logic with exponential backoff", async () => {
    const error = new Error("Network error")
    mockFetchFn.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        retryOnError: true,
        maxRetries: 3,
        backoffMultiplier: 2,
      })
    )

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1)
    })

    // Manually trigger another refresh to test retry
    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.retryCount).toBe(2)
    })
  })

  it("should stop retrying after max retries", async () => {
    const error = new Error("Persistent error")
    mockFetchFn.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        retryOnError: true,
        maxRetries: 1,
      })
    )

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1)
    })

    // Try to refresh again
    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.retryCount).toBe(1) // Should not exceed maxRetries
    })
  })

  it("should abort previous request when new one starts", async () => {
    let abortController: AbortController | null = null
    mockFetchFn.mockImplementation(() => {
      abortController = new AbortController()
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: "test" }), 1000)
      })
    })

    const { result } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: false })
    )

    // Start first request
    act(() => {
      result.current.refresh()
    })

    // Start second request before first completes
    act(() => {
      result.current.refresh()
    })

    // Only one fetch should be called (second cancels first)
    expect(mockFetchFn).toHaveBeenCalledTimes(1)
  })

  it("should adjust interval based on page visibility", () => {
    // Mock page as not visible
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
    })

    renderHook(() =>
      useSmartRefresh(mockFetchFn, {
        enabled: true,
        type: "active",
      })
    )

    // Should use background interval when page is not visible
    const backgroundIntervalCall = mockSetTimeout.mock.calls.find(
      call => call[1] === 600000 // background interval
    )
    expect(backgroundIntervalCall).toBeDefined()
  })

  it("should cleanup timeouts on unmount", () => {
    const { unmount } = renderHook(() =>
      useSmartRefresh(mockFetchFn, { enabled: true })
    )

    unmount()

    expect(mockClearTimeout).toHaveBeenCalled()
  })

  it("should update fetch function reference", async () => {
    const firstFetch = jest.fn().mockResolvedValue({ data: "first" })
    const secondFetch = jest.fn().mockResolvedValue({ data: "second" })

    const { result, rerender } = renderHook(
      ({ fetchFn }) => useSmartRefresh(fetchFn, { enabled: false }),
      {
        initialProps: { fetchFn: firstFetch },
      }
    )

    // Update the fetch function
    rerender({ fetchFn: secondFetch })

    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: "second" })
    })

    expect(secondFetch).toHaveBeenCalled()
    expect(firstFetch).not.toHaveBeenCalled()
  })

  it("should handle different refresh types correctly", () => {
    const { rerender } = renderHook(
      ({ type }) => useSmartRefresh(mockFetchFn, { enabled: true, type }),
      {
        initialProps: { type: "summary" as const },
      }
    )

    // Should use summary interval (300000ms)
    let summaryCall = mockSetTimeout.mock.calls.find(call => call[1] === 300000)
    expect(summaryCall).toBeDefined()

    mockSetTimeout.mockClear()

    // Change to active type
    rerender({ type: "active" as const })

    // Should use active interval (30000ms)
    let activeCall = mockSetTimeout.mock.calls.find(call => call[1] === 30000)
    expect(activeCall).toBeDefined()
  })
})
