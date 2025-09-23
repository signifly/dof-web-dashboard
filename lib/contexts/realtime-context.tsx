"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { MetricsTrend } from "@/lib/performance-data"
import { RealtimeChannel } from "@supabase/supabase-js"

interface RealtimeContextValue {
  data: MetricsTrend[]
  isConnected: boolean
  lastUpdate: Date | null
  error: Error | null
  reconnect: () => void
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined
)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MetricsTrend[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  const setupRealtime = () => {
    try {
      setError(null)

      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }

      const channel = supabaseRef.current
        .channel("performance-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "performance_metrics",
          },
          payload => {
            console.log("Realtime update received:", payload)

            // Transform the new metric into trend format
            if (payload.new && typeof payload.new === "object") {
              const metric = payload.new as any
              const timestamp = metric.timestamp

              setData(prevData => {
                // Find or create data point for this timestamp
                const existingIndex = prevData.findIndex(
                  d => d.timestamp === timestamp
                )

                if (existingIndex >= 0) {
                  // Update existing data point
                  const newData = [...prevData]
                  const point = { ...newData[existingIndex] }

                  // Update the specific metric
                  switch (metric.metric_type) {
                    case "fps":
                      point.fps = metric.metric_value
                      break
                    case "memory_usage":
                    case "memory":
                      point.memory_usage = metric.metric_value
                      break
                    case "cpu_usage":
                    case "cpu":
                      point.cpu_usage = metric.metric_value
                      break
                    case "navigation_time":
                    case "screen_load":
                    case "load_time":
                      point.load_time = metric.metric_value
                      break
                  }

                  newData[existingIndex] = point
                  return newData
                } else {
                  // Create new data point
                  const newPoint: MetricsTrend = {
                    timestamp,
                    fps: metric.metric_type === "fps" ? metric.metric_value : 0,
                    memory_usage:
                      metric.metric_type === "memory_usage" ||
                      metric.metric_type === "memory"
                        ? metric.metric_value
                        : 0,
                    cpu_usage:
                      metric.metric_type === "cpu_usage" ||
                      metric.metric_type === "cpu"
                        ? metric.metric_value
                        : 0,
                    load_time:
                      metric.metric_type === "navigation_time" ||
                      metric.metric_type === "screen_load" ||
                      metric.metric_type === "load_time"
                        ? metric.metric_value
                        : 0,
                    screen_name:
                      (metric.context as any)?.screen_name || "Unknown",
                  }

                  return [...prevData, newPoint].slice(-50) // Keep last 50 points
                }
              })

              setLastUpdate(new Date())
            }
          }
        )
        .subscribe(status => {
          console.log("Realtime subscription status:", status)

          if (status === "SUBSCRIBED") {
            setIsConnected(true)
            setError(null)
          } else if (status === "CHANNEL_ERROR") {
            setIsConnected(false)
            setError(new Error("Channel subscription failed"))
          } else if (status === "TIMED_OUT") {
            setIsConnected(false)
            setError(new Error("Connection timed out"))
          } else if (status === "CLOSED") {
            setIsConnected(false)
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.error("Error setting up realtime:", err)
      setError(
        err instanceof Error ? err : new Error("Failed to setup realtime")
      )
      setIsConnected(false)
    }
  }

  const reconnect = () => {
    console.log("Reconnecting realtime...")
    setupRealtime()
  }

  useEffect(() => {
    setupRealtime()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  const value: RealtimeContextValue = {
    data,
    isConnected,
    lastUpdate,
    error,
    reconnect,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}
