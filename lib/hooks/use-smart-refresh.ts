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
  loadRefreshConfig
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
    enabled: normalizedOptions.pauseOnInteraction
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
    state.retryCount
  ])

  // Check if refresh should be paused
  const shouldPause = useMemo(() => {
    return shouldPauseRefresh(
      normalizedOptions.pauseOnInteraction,
      isUserActive,
      timeSinceLastActivity
    )
  }, [normalizedOptions.pauseOnInteraction, isUserActive, timeSinceLastActivity])

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    if (state.isRefreshing) return

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setState(prev => ({
      ...prev,
      isRefreshing: true,
      error: null
    }))

    try {
      const result = await fetchFnRef.current()

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      setData(result)
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: getNextRefreshTime(currentInterval),
        error: null,
        retryCount: 0
      }))
    } catch (error) {
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return
      }

      const refreshError = error instanceof Error ? error : new Error("Refresh failed")

      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: refreshError,
        retryCount: normalizedOptions.retryOnError
          ? Math.min(prev.retryCount + 1, normalizedOptions.maxRetries)
          : prev.retryCount
      }))

      console.error(`Smart refresh failed for key "${normalizedOptions.key}":`, refreshError)
    } finally {
      abortControllerRef.current = null
    }
  }, [state.isRefreshing, currentInterval, normalizedOptions])

  // Schedule next refresh
  const scheduleRefresh = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Don't schedule if disabled, paused, or at max retries
    if (
      !state.isEnabled ||
      state.isPaused ||
      shouldPause ||
      (state.retryCount >= normalizedOptions.maxRetries && !normalizedOptions.retryOnError)
    ) {
      setState(prev => ({ ...prev, nextRefresh: null }))
      return
    }

    const interval = currentInterval
    const nextRefresh = getNextRefreshTime(interval, state.lastRefresh)

    setState(prev => ({ ...prev, nextRefresh }))

    timeoutRef.current = setTimeout(() => {
      refresh()
    }, interval)
  }, [
    state.isEnabled,
    state.isPaused,
    state.lastRefresh,
    state.retryCount,
    shouldPause,
    currentInterval,
    normalizedOptions.maxRetries,
    normalizedOptions.retryOnError,
    refresh
  ])

  // Control functions
  const enable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }))
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
  }, [])

  const reset = useCallback(() => {
    setState(createRefreshState(normalizedOptions.enabled))
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [normalizedOptions.enabled])

  // Schedule refresh when conditions change
  useEffect(() => {
    scheduleRefresh()
  }, [scheduleRefresh])

  // Initial refresh
  useEffect(() => {
    if (normalizedOptions.enabled && initialData === null) {
      refresh()
    }
  }, []) // Only run on mount

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
    reset
  }
}