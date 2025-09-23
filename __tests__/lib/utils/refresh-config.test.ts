import {
  DEFAULT_REFRESH_CONFIG,
  DEFAULT_REFRESH_OPTIONS,
  getRefreshInterval,
  getNextRefreshTime,
  getRetryInterval,
  shouldPauseRefresh,
  normalizeRefreshOptions,
  createRefreshState,
  loadRefreshConfig,
  saveRefreshConfig,
  REFRESH_STORAGE_KEYS,
} from "@/lib/utils/refresh-config"

describe("refresh-config", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe("getRefreshInterval", () => {
    it("should return background interval when page is not visible", () => {
      const interval = getRefreshInterval(
        "active",
        DEFAULT_REFRESH_CONFIG,
        true,
        false
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.background)
    })

    it("should return interactive interval when user is active", () => {
      const interval = getRefreshInterval(
        "active",
        DEFAULT_REFRESH_CONFIG,
        true,
        true
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.interactive)
    })

    it("should return active interval for active type when user is not active", () => {
      const interval = getRefreshInterval(
        "active",
        DEFAULT_REFRESH_CONFIG,
        false,
        true
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.active)
    })

    it("should return summary interval for summary type", () => {
      const interval = getRefreshInterval(
        "summary",
        DEFAULT_REFRESH_CONFIG,
        false,
        true
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.summary)
    })

    it("should return background interval for background type", () => {
      const interval = getRefreshInterval(
        "background",
        DEFAULT_REFRESH_CONFIG,
        true,
        true
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.background)
    })

    it("should default to active interval for invalid type", () => {
      const interval = getRefreshInterval(
        "invalid" as any,
        DEFAULT_REFRESH_CONFIG,
        false,
        true
      )
      expect(interval).toBe(DEFAULT_REFRESH_CONFIG.active)
    })
  })

  describe("getNextRefreshTime", () => {
    it("should calculate next refresh time from current time", () => {
      const interval = 5000
      const before = new Date()
      const nextRefresh = getNextRefreshTime(interval)
      const after = new Date()

      expect(nextRefresh.getTime()).toBeGreaterThanOrEqual(
        before.getTime() + interval
      )
      expect(nextRefresh.getTime()).toBeLessThanOrEqual(
        after.getTime() + interval
      )
    })

    it("should calculate next refresh time from last refresh", () => {
      const interval = 5000
      const lastRefresh = new Date("2023-01-01T00:00:00Z")
      const nextRefresh = getNextRefreshTime(interval, lastRefresh)

      expect(nextRefresh.getTime()).toBe(lastRefresh.getTime() + interval)
    })
  })

  describe("getRetryInterval", () => {
    it("should calculate exponential backoff", () => {
      const baseInterval = 1000
      const backoffMultiplier = 2

      expect(getRetryInterval(baseInterval, 0, backoffMultiplier)).toBe(1000)
      expect(getRetryInterval(baseInterval, 1, backoffMultiplier)).toBe(2000)
      expect(getRetryInterval(baseInterval, 2, backoffMultiplier)).toBe(4000)
      expect(getRetryInterval(baseInterval, 3, backoffMultiplier)).toBe(8000)
    })

    it("should respect maximum interval", () => {
      const baseInterval = 1000
      const backoffMultiplier = 2
      const maxInterval = 5000

      expect(
        getRetryInterval(baseInterval, 10, backoffMultiplier, maxInterval)
      ).toBe(maxInterval)
    })

    it("should use default max interval", () => {
      const baseInterval = 1000
      const backoffMultiplier = 2

      const result = getRetryInterval(baseInterval, 20, backoffMultiplier)
      expect(result).toBe(5 * 60 * 1000) // Default max is 5 minutes
    })
  })

  describe("shouldPauseRefresh", () => {
    it("should not pause when pauseOnInteraction is false", () => {
      expect(shouldPauseRefresh(false, true, 1000)).toBe(false)
    })

    it("should pause when user is active and within grace period", () => {
      expect(shouldPauseRefresh(true, true, 1000)).toBe(true)
    })

    it("should not pause when user is active but outside grace period", () => {
      expect(shouldPauseRefresh(true, true, 5000)).toBe(false)
    })

    it("should not pause when user is not active", () => {
      expect(shouldPauseRefresh(true, false, 1000)).toBe(false)
    })

    it("should use custom grace period", () => {
      const customGracePeriod = 10000
      expect(shouldPauseRefresh(true, true, 5000, customGracePeriod)).toBe(true)
      expect(shouldPauseRefresh(true, true, 15000, customGracePeriod)).toBe(false)
    })
  })

  describe("normalizeRefreshOptions", () => {
    it("should apply defaults for empty options", () => {
      const normalized = normalizeRefreshOptions({})
      expect(normalized).toEqual(DEFAULT_REFRESH_OPTIONS)
    })

    it("should merge provided options with defaults", () => {
      const options = {
        interval: 10000,
        enabled: false,
      }
      const normalized = normalizeRefreshOptions(options)

      expect(normalized.interval).toBe(10000)
      expect(normalized.enabled).toBe(false)
      expect(normalized.pauseOnInteraction).toBe(
        DEFAULT_REFRESH_OPTIONS.pauseOnInteraction
      )
    })

    it("should set interval based on type when interval not provided", () => {
      const normalized = normalizeRefreshOptions({ type: "summary" })
      // When user is active (default), getRefreshInterval returns interactive interval
      expect(normalized.interval).toBe(DEFAULT_REFRESH_CONFIG.interactive)
    })

    it("should enforce minimum interval of 1 second", () => {
      const normalized = normalizeRefreshOptions({ interval: 500 })
      expect(normalized.interval).toBe(1000)
    })

    it("should enforce minimum maxRetries of 0", () => {
      const normalized = normalizeRefreshOptions({ maxRetries: -5 })
      expect(normalized.maxRetries).toBe(0)
    })

    it("should enforce minimum backoffMultiplier of 1", () => {
      const normalized = normalizeRefreshOptions({ backoffMultiplier: 0.5 })
      expect(normalized.backoffMultiplier).toBe(1)
    })
  })

  describe("createRefreshState", () => {
    it("should create default refresh state when enabled", () => {
      const state = createRefreshState(true)
      expect(state).toEqual({
        isRefreshing: false,
        lastRefresh: null,
        nextRefresh: null,
        error: null,
        retryCount: 0,
        isEnabled: true,
        isPaused: false,
      })
    })

    it("should create disabled refresh state", () => {
      const state = createRefreshState(false)
      expect(state.isEnabled).toBe(false)
    })

    it("should default to enabled state", () => {
      const state = createRefreshState()
      expect(state.isEnabled).toBe(true)
    })
  })

  describe("localStorage integration", () => {
    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      })
    })

    describe("loadRefreshConfig", () => {
      it("should return default config when localStorage is empty", () => {
        ;(localStorage.getItem as jest.Mock).mockReturnValue(null)

        const config = loadRefreshConfig()
        expect(config).toEqual(DEFAULT_REFRESH_CONFIG)
      })

      it("should merge stored config with defaults", () => {
        const storedConfig = { active: 15000 }
        ;(localStorage.getItem as jest.Mock).mockReturnValue(
          JSON.stringify(storedConfig)
        )

        const config = loadRefreshConfig()
        expect(config).toEqual({
          ...DEFAULT_REFRESH_CONFIG,
          active: 15000,
        })
      })

      it("should handle JSON parse errors gracefully", () => {
        ;(localStorage.getItem as jest.Mock).mockReturnValue("invalid json")

        const config = loadRefreshConfig()
        expect(config).toEqual(DEFAULT_REFRESH_CONFIG)
      })

      it("should return default config in SSR environment", () => {
        // Simulate SSR environment
        const originalWindow = global.window
        delete (global as any).window

        const config = loadRefreshConfig()
        expect(config).toEqual(DEFAULT_REFRESH_CONFIG)

        global.window = originalWindow
      })
    })

    describe("saveRefreshConfig", () => {
      it("should save partial config to localStorage", () => {
        const mockGetItem = localStorage.getItem as jest.Mock
        const mockSetItem = localStorage.setItem as jest.Mock

        mockGetItem.mockReturnValue(JSON.stringify(DEFAULT_REFRESH_CONFIG))

        const partialConfig = { active: 15000 }
        saveRefreshConfig(partialConfig)

        expect(mockSetItem).toHaveBeenCalledWith(
          REFRESH_STORAGE_KEYS.CONFIG,
          JSON.stringify({
            ...DEFAULT_REFRESH_CONFIG,
            active: 15000,
          })
        )
      })

      it("should handle localStorage errors gracefully", () => {
        ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error("localStorage error")
        })

        expect(() => saveRefreshConfig({ active: 15000 })).not.toThrow()
      })

      it("should do nothing in SSR environment", () => {
        const originalWindow = global.window
        delete (global as any).window

        expect(() => saveRefreshConfig({ active: 15000 })).not.toThrow()

        global.window = originalWindow
      })
    })
  })
})