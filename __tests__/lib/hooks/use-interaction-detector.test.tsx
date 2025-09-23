import { renderHook, act } from "@testing-library/react"
import { useInteractionDetector } from "@/lib/hooks/use-interaction-detector"

describe("useInteractionDetector", () => {
  let mockAddEventListener: jest.SpyInstance
  let mockRemoveEventListener: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    mockAddEventListener = jest.spyOn(document, "addEventListener")
    mockRemoveEventListener = jest.spyOn(document, "removeEventListener")
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    mockAddEventListener.mockRestore()
    mockRemoveEventListener.mockRestore()
  })

  it("should initialize with user active state", () => {
    const { result } = renderHook(() => useInteractionDetector())

    expect(result.current.isUserActive).toBe(true)
    expect(result.current.lastActivity).toBeInstanceOf(Date)
    expect(result.current.timeSinceLastActivity).toBe(0)
  })

  it("should set up event listeners on mount", () => {
    const { unmount } = renderHook(() => useInteractionDetector())

    // Should add event listeners for default events
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true }
    )

    unmount()

    // Should remove event listeners on unmount
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(5)
  })

  it("should handle custom events", () => {
    const customEvents = ["click", "focus"]
    renderHook(() => useInteractionDetector({ events: customEvents }))

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "focus",
      expect.any(Function),
      { passive: true }
    )
    expect(mockAddEventListener).toHaveBeenCalledTimes(2)
  })

  it("should detect user activity and update state", () => {
    const { result } = renderHook(() =>
      useInteractionDetector({ timeout: 5000 })
    )

    // Get the mousemove event handler
    const mousemoveHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === "mousemove"
    )?.[1]

    expect(mousemoveHandler).toBeDefined()

    // Initial state
    expect(result.current.isUserActive).toBe(true)

    // Advance time past timeout
    act(() => {
      jest.advanceTimersByTime(6000)
    })

    expect(result.current.isUserActive).toBe(false)
    expect(result.current.timeSinceLastActivity).toBeGreaterThanOrEqual(6000)

    // Simulate user activity
    act(() => {
      mousemoveHandler!(new Event("mousemove"))
    })

    expect(result.current.isUserActive).toBe(true)
    expect(result.current.timeSinceLastActivity).toBe(0)
  })

  it("should respect custom timeout", () => {
    const customTimeout = 10000
    const { result } = renderHook(() =>
      useInteractionDetector({ timeout: customTimeout })
    )

    // Advance time just before timeout
    act(() => {
      jest.advanceTimersByTime(customTimeout - 1000)
    })

    expect(result.current.isUserActive).toBe(true)

    // Advance time past timeout
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(result.current.isUserActive).toBe(false)
  })

  it("should not set up listeners when disabled", () => {
    renderHook(() => useInteractionDetector({ enabled: false }))

    expect(mockAddEventListener).not.toHaveBeenCalled()
  })

  it("should update timeSinceLastActivity continuously", () => {
    const { result } = renderHook(() =>
      useInteractionDetector({ timeout: 10000 })
    )

    // Initial state
    expect(result.current.timeSinceLastActivity).toBe(0)

    // Advance time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(result.current.timeSinceLastActivity).toBeGreaterThanOrEqual(3000)
    expect(result.current.isUserActive).toBe(true) // Still within timeout

    // Advance time by another 8 seconds (total 11 seconds)
    act(() => {
      jest.advanceTimersByTime(8000)
    })

    expect(result.current.timeSinceLastActivity).toBeGreaterThanOrEqual(11000)
    expect(result.current.isUserActive).toBe(false) // Past timeout
  })

  it("should throttle activity detection", () => {
    const { result } = renderHook(() => useInteractionDetector())

    const mousemoveHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === "mousemove"
    )?.[1]

    const initialActivity = result.current.lastActivity

    // Trigger multiple events in quick succession
    act(() => {
      mousemoveHandler!(new Event("mousemove"))
      mousemoveHandler!(new Event("mousemove"))
      mousemoveHandler!(new Event("mousemove"))
    })

    // Should only update once due to throttling
    expect(result.current.lastActivity).not.toBe(initialActivity)

    const afterFirstUpdate = result.current.lastActivity

    // Immediately trigger another event
    act(() => {
      mousemoveHandler!(new Event("mousemove"))
    })

    // Should not update again due to throttling (100ms default)
    expect(result.current.lastActivity).toBe(afterFirstUpdate)
  })

  it("should handle cleanup properly on unmount", () => {
    const { unmount } = renderHook(() => useInteractionDetector())

    // Verify listeners were added
    expect(mockAddEventListener).toHaveBeenCalledTimes(5)

    unmount()

    // Verify listeners were removed
    expect(mockRemoveEventListener).toHaveBeenCalledTimes(5)
  })

  it("should work with empty events array", () => {
    const { result } = renderHook(() => useInteractionDetector({ events: [] }))

    expect(mockAddEventListener).not.toHaveBeenCalled()
    expect(result.current.isUserActive).toBe(true)
  })

  it("should handle multiple simultaneous event types", () => {
    const { result } = renderHook(() => useInteractionDetector())

    const mousemoveHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === "mousemove"
    )?.[1]
    const keydownHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === "keydown"
    )?.[1]

    // Advance time to make user inactive
    act(() => {
      jest.advanceTimersByTime(6000)
    })

    expect(result.current.isUserActive).toBe(false)

    // Trigger keydown event
    act(() => {
      keydownHandler!(new Event("keydown"))
    })

    expect(result.current.isUserActive).toBe(true)

    // Advance time again
    act(() => {
      jest.advanceTimersByTime(6000)
    })

    expect(result.current.isUserActive).toBe(false)

    // Trigger mousemove event
    act(() => {
      mousemoveHandler!(new Event("mousemove"))
    })

    expect(result.current.isUserActive).toBe(true)
  })
})
