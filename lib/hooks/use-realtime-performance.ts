"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { MetricsTrend } from "@/lib/performance-data"
import { Tables } from "@/types/database"
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js"

type PerformanceMetric = Tables<"performance_metrics">

interface UseRealtimePerformanceOptions {
  initialData?: MetricsTrend[]
  maxDataPoints?: number
  reconnectInterval?: number
}

interface UseRealtimePerformanceReturn {
  data: MetricsTrend[]
  isConnected: boolean
  lastUpdate: Date | null
  error: Error | null
  reconnect: () => void
}

export function useRealtimePerformance({
  initialData = [],
  maxDataPoints = 100,
  reconnectInterval = 3000,
}: UseRealtimePerformanceOptions = {}): UseRealtimePerformanceReturn {
  const [data, setData] = useState<MetricsTrend[]>(initialData)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingMetricsRef = useRef<Map<string, Partial<MetricsTrend>>>(
    new Map()
  )

  // Convert database metric to trend data
  const convertMetricToTrendPoint = useCallback(
    (metric: PerformanceMetric): Partial<MetricsTrend> => {
      const timestamp = metric.timestamp
      const screenName = (metric.context as any)?.screen_name || "Unknown"

      const update: Partial<MetricsTrend> = {
        timestamp,
        screen_name: screenName,
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
    []
  )

  // Merge pending metrics into complete trend points
  const processPendingMetrics = useCallback(() => {
    const completeTrends: MetricsTrend[] = []
    const currentTime = Date.now()

    // Process metrics that are older than 1 second (allowing time for related metrics to arrive)
    pendingMetricsRef.current.forEach((pendingMetric, timestamp) => {
      const metricTime = new Date(timestamp).getTime()
      if (currentTime - metricTime > 1000) {
        // Create complete trend point with defaults
        const completeTrend: MetricsTrend = {
          timestamp,
          fps: pendingMetric.fps || 0,
          memory_usage: pendingMetric.memory_usage || 0,
          cpu_usage: pendingMetric.cpu_usage || 0,
          load_time: pendingMetric.load_time || 0,
          screen_name: pendingMetric.screen_name || "Unknown",
        }

        completeTrends.push(completeTrend)
        pendingMetricsRef.current.delete(timestamp)
      }
    })

    if (completeTrends.length > 0) {
      setData(prevData => {
        const newData = [...prevData, ...completeTrends]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(-maxDataPoints) // Keep only the latest data points

        return newData
      })
      setLastUpdate(new Date())
    }
  }, [maxDataPoints])

  // Handle incoming realtime events
  const handleMetricUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<PerformanceMetric>) => {
      if (payload.eventType === "INSERT" && payload.new) {
        const metric = payload.new
        const trendUpdate = convertMetricToTrendPoint(metric)

        if (trendUpdate.timestamp) {
          // Get or create pending metric for this timestamp
          const existing =
            pendingMetricsRef.current.get(trendUpdate.timestamp) || {}
          const merged = { ...existing, ...trendUpdate }
          pendingMetricsRef.current.set(trendUpdate.timestamp, merged)

          // Process pending metrics
          processPendingMetrics()
        }
      }
    },
    [convertMetricToTrendPoint, processPendingMetrics]
  )

  // Setup realtime subscription
  const setupSubscription = useCallback(() => {
    const supabase = supabaseRef.current

    // Clean up existing subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new channel
    const channel = supabase
      .channel("performance_metrics_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "performance_metrics",
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
          setError(new Error(`Connection failed: ${status}`))
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
  }, [handleMetricUpdate, reconnectInterval])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setError(null)
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setupSubscription()
  }, [setupSubscription])

  // Setup subscription on mount
  useEffect(() => {
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
  }, [setupSubscription, processPendingMetrics])

  return {
    data,
    isConnected,
    lastUpdate,
    error,
    reconnect,
  }
}
