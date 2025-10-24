"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { SessionMetricsTimeline } from "@/types/session"
import { Tables } from "@/types/database"
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js"

type PerformanceMetric = Tables<"performance_metrics">

interface UseRealtimeSessionMetricsOptions {
  initialData?: SessionMetricsTimeline[]
  maxDataPoints?: number
  reconnectInterval?: number
  aggregationInterval?: number // milliseconds to group metrics
}

interface UseRealtimeSessionMetricsReturn {
  metrics: SessionMetricsTimeline[]
  isLive: boolean
  isConnected: boolean
  lastUpdate: Date | null
  error: Error | null
  reconnect: () => void
  totalMetrics: number
}

export function useRealtimeSessionMetrics(
  sessionId: string,
  {
    initialData = [],
    maxDataPoints = 100,
    reconnectInterval = 3000,
    aggregationInterval = 5000,
  }: UseRealtimeSessionMetricsOptions = {}
): UseRealtimeSessionMetricsReturn {
  const [metrics, setMetrics] = useState<SessionMetricsTimeline[]>(initialData)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [totalMetrics, setTotalMetrics] = useState(0)

  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingMetricsRef = useRef<
    Map<string, Partial<SessionMetricsTimeline>>
  >(new Map())

  // Convert database metric to session timeline point
  const convertMetricToTimelinePoint = useCallback(
    (metric: PerformanceMetric): Partial<SessionMetricsTimeline> => {
      const timestamp = metric.timestamp
      const screenName = (metric.context as any)?.screen_name || "Unknown"

      // Round timestamp to aggregation interval
      const roundedTimestamp = roundToNearestInterval(
        timestamp,
        aggregationInterval
      )

      const update: Partial<SessionMetricsTimeline> = {
        timestamp: roundedTimestamp,
        screen_name: screenName,
        metric_count: 1,
      }

      switch (metric.metric_type) {
        case "fps":
          update.fps = metric.metric_value
          break
        case "memory_usage":
          update.memory_usage = metric.metric_value
          break
        case "navigation_time":
        case "screen_load":
          update.load_time = metric.metric_value
          break
        case "cpu_usage":
          update.cpu_usage = metric.metric_value
          break
      }

      return update
    },
    [aggregationInterval]
  )

  // Merge pending metrics into complete timeline points
  const processPendingMetrics = useCallback(() => {
    const completeTimelines: SessionMetricsTimeline[] = []
    const currentTime = Date.now()

    // Process metrics that are older than 2 seconds (allowing time for related metrics to arrive)
    pendingMetricsRef.current.forEach((pendingMetric, timestamp) => {
      const metricTime = new Date(timestamp).getTime()
      if (currentTime - metricTime > 2000) {
        // Create complete timeline point with defaults
        const completeTimeline: SessionMetricsTimeline = {
          timestamp,
          fps: pendingMetric.fps || 0,
          memory_usage: pendingMetric.memory_usage || 0,
          cpu_usage: pendingMetric.cpu_usage || 0,
          load_time: pendingMetric.load_time || 0,
          cache_size: pendingMetric.cache_size || null,
          screen_name: pendingMetric.screen_name || "Unknown",
          metric_count: pendingMetric.metric_count || 1,
        }

        completeTimelines.push(completeTimeline)
        pendingMetricsRef.current.delete(timestamp)
      }
    })

    if (completeTimelines.length > 0) {
      setMetrics(prevMetrics => {
        const newMetrics = [...prevMetrics, ...completeTimelines]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(-maxDataPoints) // Keep only the latest data points

        return newMetrics
      })
      setLastUpdate(new Date())
    }
  }, [maxDataPoints])

  // Handle incoming realtime events
  const handleMetricUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<PerformanceMetric>) => {
      if (
        payload.eventType === "INSERT" &&
        payload.new &&
        payload.new.session_id === sessionId
      ) {
        const metric = payload.new
        const timelineUpdate = convertMetricToTimelinePoint(metric)

        if (timelineUpdate.timestamp) {
          // Get or create pending metric for this timestamp
          const existing =
            pendingMetricsRef.current.get(timelineUpdate.timestamp) || {}

          // Merge the new metric data
          const merged: Partial<SessionMetricsTimeline> = {
            ...existing,
            ...timelineUpdate,
            metric_count: (existing.metric_count || 0) + 1,
          }

          pendingMetricsRef.current.set(timelineUpdate.timestamp, merged)

          // Update total metrics counter
          setTotalMetrics(prev => prev + 1)

          // Process pending metrics
          processPendingMetrics()
        }
      }
    },
    [sessionId, convertMetricToTimelinePoint, processPendingMetrics]
  )

  // Setup realtime subscription
  const setupSubscription = useCallback(() => {
    const supabase = supabaseRef.current

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new channel with session-specific filter
    const channel = supabase
      .channel(`session_${sessionId}_metrics`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "performance_metrics",
          filter: `session_id=eq.${sessionId}`,
        },
        handleMetricUpdate
      )
      .subscribe(status => {
        setIsConnected(status === "SUBSCRIBED")

        if (status === "SUBSCRIBED") {
          setError(null)
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError(new Error(`Session realtime connection failed: ${status}`))
          setIsConnected(false)

          // Schedule reconnection
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              setupSubscription()
            }, reconnectInterval)
          }
        }
      })

    channelRef.current = channel
  }, [sessionId, handleMetricUpdate, reconnectInterval])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setError(null)
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setupSubscription()
  }, [setupSubscription])

  // Determine if session is "live" (receiving metrics recently)
  const isLive = useMemo(() => {
    if (metrics.length === 0) return false

    const lastMetric = metrics[metrics.length - 1]
    const timeSinceLastMetric =
      Date.now() - new Date(lastMetric.timestamp).getTime()

    // Consider session live if we received metrics within the last 30 seconds
    return timeSinceLastMetric < 30000
  }, [metrics])

  // Setup subscription on mount and when sessionId changes
  useEffect(() => {
    if (!sessionId) return

    setupSubscription()

    // Process pending metrics periodically
    const processingInterval = setInterval(processPendingMetrics, 2000)

    return () => {
      // Cleanup
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      clearInterval(processingInterval)
      pendingMetricsRef.current.clear()
    }
  }, [sessionId, setupSubscription, processPendingMetrics])

  // Initialize total metrics count from initial data
  useEffect(() => {
    setTotalMetrics(initialData.reduce((sum, m) => sum + m.metric_count, 0))
  }, [initialData])

  return {
    metrics,
    isLive,
    isConnected,
    lastUpdate,
    error,
    reconnect,
    totalMetrics,
  }
}

// Helper function to round timestamp to nearest interval
function roundToNearestInterval(timestamp: string, intervalMs: number): string {
  const date = new Date(timestamp)
  const rounded = new Date(Math.round(date.getTime() / intervalMs) * intervalMs)
  return rounded.toISOString()
}
