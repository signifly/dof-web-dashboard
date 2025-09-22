/**
 * React hook for managing alerts
 * Provides real-time alert data with Supabase subscriptions
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertInstance, AlertFilters, UseAlertsReturn } from "@/types/alerts"

export function useAlerts(filters?: AlertFilters): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from("alert_history").select(`
          *,
          config:alert_configs(*)
        `)

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status)
      }

      if (filters?.severity && filters.severity.length > 0) {
        query = query.in("severity", filters.severity)
      }

      if (filters?.metric_type && filters.metric_type.length > 0) {
        // Join with alert_configs to filter by metric_type
        query = query.in("config.metric_type", filters.metric_type)
      }

      if (filters?.date_range) {
        query = query
          .gte("created_at", filters.date_range.start)
          .lte("created_at", filters.date_range.end)
      }

      if (filters?.search) {
        query = query.ilike("message", `%${filters.search}%`)
      }

      const { data, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .limit(100)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setAlerts(data || [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch alerts"
      setError(errorMessage)
      console.error("Error fetching alerts:", err)
    } finally {
      setLoading(false)
    }
  }, [filters, supabase])

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        const { error: updateError } = await supabase
          .from("alert_history")
          .update({
            status: "acknowledged",
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: user.id,
          })
          .eq("id", alertId)
          .eq("status", "active")

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update local state optimistically
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === alertId
              ? {
                  ...alert,
                  status: "acknowledged" as const,
                  acknowledged_at: new Date().toISOString(),
                  acknowledged_by: user.id,
                }
              : alert
          )
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to acknowledge alert"
        setError(errorMessage)
        console.error("Error acknowledging alert:", err)
        throw err
      }
    },
    [supabase]
  )

  const resolveAlert = useCallback(
    async (alertId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        const { error: updateError } = await supabase
          .from("alert_history")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolved_by: user.id,
          })
          .eq("id", alertId)
          .in("status", ["active", "acknowledged"])

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update local state optimistically
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === alertId
              ? {
                  ...alert,
                  status: "resolved" as const,
                  resolved_at: new Date().toISOString(),
                  resolved_by: user.id,
                }
              : alert
          )
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to resolve alert"
        setError(errorMessage)
        console.error("Error resolving alert:", err)
        throw err
      }
    },
    [supabase]
  )

  const refetch = useCallback(async () => {
    await fetchAlerts()
  }, [fetchAlerts])

  // Initial fetch
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("alert_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alert_history",
        },
        payload => {
          console.log("Alert change detected:", payload)

          // Refetch alerts when changes occur
          // This is a simple approach; for better performance,
          // we could update the local state based on the payload
          fetchAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchAlerts])

  return {
    alerts,
    loading,
    error,
    refetch,
    acknowledgeAlert,
    resolveAlert,
  }
}
