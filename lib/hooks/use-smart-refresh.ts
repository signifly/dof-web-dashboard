"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useInteractionDetector } from "./use-interaction-detector"
import {
  RefreshOptions,
  RefreshState,
  normalizeRefreshOptions,
  getRefreshInterval,
  getNextRefreshTime,
  getRetryInterval,
  shouldPauseRefresh,
  createRefreshState,
  loadRefreshConfig,
} from "@/lib/utils/refresh-config"

interface UseSmartRefreshReturn<T> {
  data: T | null
  isRefreshing: boolean
  lastUpdated: Date | null
  nextRefresh: Date | null
  error: Error | null
  isEnabled: boolean
  isPaused: boolean
  retryCount: number
  refresh: () => Promise<void>
  enable: () => void
  disable: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}

/**
 * Smart refresh hook with intelligent polling that respects user interaction
 * and provides configurable refresh intervals for different data types
 */
export function useSmartRefresh<T>(
  fetchFn: () => Promise<T>,
  options: RefreshOptions = {},
  initialData: T | null = null
): UseSmartRefreshReturn<T> {
  const normalizedOptions = useMemo(
    () => normalizeRefreshOptions(options),
    [options]
  )

  const [data, setData] = useState<T | null>(initialData)
  const [state, setState] = useState<RefreshState>(() =>
    createRefreshState(normalizedOptions.enabled)
  )

  const refreshConfig = useMemo(() => loadRefreshConfig(), [])
  const fetchFnRef = useRef(fetchFn)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Update fetch function reference
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  // User interaction detection
  const { isUserActive, timeSinceLastActivity } = useInteractionDetector({
    timeout: 5000, // 5 seconds to consider user inactive
    enabled: normalizedOptions.pauseOnInteraction,
  })

  // Page visibility detection
  const [isPageVisible, setIsPageVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Calculate current refresh interval based on state
  const currentInterval = useMemo(() => {
    if (state.retryCount > 0) {
      return getRetryInterval(
        normalizedOptions.interval,
        state.retryCount,
        normalizedOptions.backoffMultiplier,
        normalizedOptions.maxBackoffInterval
      )
    }

    return getRefreshInterval(
      normalizedOptions.type,
      refreshConfig,
      isUserActive,
      isPageVisible
    )
  }, [
    normalizedOptions,
    refreshConfig,
    isUserActive,
    isPageVisible,
    state.retryCount,
  ])

  // Check if refresh should be paused
  const shouldPause = useMemo(() => {
    return shouldPauseRefresh(
      normalizedOptions.pauseOnInteraction,
      isUserActive,
      timeSinceLastActivity
    )
  }, [
    normalizedOptions.pauseOnInteraction,
    isUserActive,
    timeSinceLastActivity,
  ])

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    setState(prevState => {
      if (prevState.isRefreshing) return prevState

      return {
        ...prevState,
        isRefreshing: true,
        error: null,
      }
    })

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const result = await fetchFnRef.current()

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      setData(result)
      setState(prev => {
        const interval = getRefreshInterval(
          normalizedOptions.type,
          refreshConfig,
          isUserActive,
          isPageVisible
        )

        return {
          ...prev,
          isRefreshing: false,
          lastRefresh: new Date(),
          nextRefresh: getNextRefreshTime(interval),
          error: null,
          retryCount: 0,
        }
      })
    } catch (error) {
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      const refreshError =
        error instanceof Error ? error : new Error("Refresh failed")

      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: refreshError,
        retryCount: normalizedOptions.retryOnError
          ? Math.min(prev.retryCount + 1, normalizedOptions.maxRetries)
          : prev.retryCount,
      }))

      console.error(
        `Smart refresh failed for key "${normalizedOptions.key}":`,
        refreshError
      )
    } finally {
      abortControllerRef.current = null
    }
  }, [normalizedOptions, refreshConfig, isUserActive, isPageVisible])

  // Schedule next refresh - stable version without state dependencies
  const scheduleRefreshRef = useRef<() => void>()

  scheduleRefreshRef.current = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setState(prevState => {
      // Don't schedule if disabled, paused, or at max retries
      if (
        !prevState.isEnabled ||
        prevState.isPaused ||
        shouldPause ||
        (prevState.retryCount >= normalizedOptions.maxRetries &&
          !normalizedOptions.retryOnError)
      ) {
        return { ...prevState, nextRefresh: null }
      }

      const interval = currentInterval
      const nextRefresh = getNextRefreshTime(interval, prevState.lastRefresh)

      // Schedule the timeout
      timeoutRef.current = setTimeout(() => {
        refresh()
      }, interval)

      return { ...prevState, nextRefresh }
    })
  }

  const scheduleRefresh = useCallback(() => {
    scheduleRefreshRef.current?.()
  }, [])

  // Control functions
  const enable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }))
    // Schedule refresh after enabling
    setTimeout(() => scheduleRefreshRef.current?.(), 0)
  }, [])

  const disable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false, nextRefresh: null }))
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true, nextRefresh: null }))
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }))
    // Schedule refresh after resuming
    setTimeout(() => scheduleRefreshRef.current?.(), 0)
  }, [])

  const reset = useCallback(() => {
    setState(createRefreshState(normalizedOptions.enabled))
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Schedule refresh after reset if enabled
    if (normalizedOptions.enabled) {
      setTimeout(() => scheduleRefreshRef.current?.(), 0)
    }
  }, [normalizedOptions.enabled])

  // Schedule refresh when external conditions change (not state)
  useEffect(() => {
    scheduleRefreshRef.current?.()
  }, [
    shouldPause,
    currentInterval,
    normalizedOptions.maxRetries,
    normalizedOptions.retryOnError,
  ])

  // Initial refresh
  useEffect(() => {
    if (normalizedOptions.enabled && initialData === null) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - explicitly ignore dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    isRefreshing: state.isRefreshing,
    lastUpdated: state.lastRefresh,
    nextRefresh: state.nextRefresh,
    error: state.error,
    isEnabled: state.isEnabled,
    isPaused: state.isPaused || shouldPause,
    retryCount: state.retryCount,
    refresh,
    enable,
    disable,
    pause,
    resume,
    reset,
  }
}
