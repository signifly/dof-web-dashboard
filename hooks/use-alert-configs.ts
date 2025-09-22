/**
 * React hook for managing alert configurations
 * Provides CRUD operations for alert configs with real-time updates
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AlertConfig,
  CreateAlertConfigRequest,
  UpdateAlertConfigRequest,
  UseAlertConfigsReturn,
} from "@/types/alerts"

export function useAlertConfigs(): UseAlertConfigsReturn {
  const [configs, setConfigs] = useState<AlertConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("alert_configs")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setConfigs(data || [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch alert configs"
      setError(errorMessage)
      console.error("Error fetching alert configs:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createConfig = useCallback(
    async (config: CreateAlertConfigRequest): Promise<AlertConfig> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("User not authenticated")
        }

        const { data, error: createError } = await supabase
          .from("alert_configs")
          .insert({
            ...config,
            created_by: user.id,
          })
          .select()
          .single()

        if (createError) {
          throw new Error(createError.message)
        }

        // Update local state optimistically
        setConfigs(prev => [data, ...prev])

        return data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create alert config"
        setError(errorMessage)
        console.error("Error creating alert config:", err)
        throw err
      }
    },
    [supabase]
  )

  const updateConfig = useCallback(
    async (config: UpdateAlertConfigRequest): Promise<AlertConfig> => {
      try {
        const { id, ...updateData } = config

        const { data, error: updateError } = await supabase
          .from("alert_configs")
          .update(updateData)
          .eq("id", id)
          .select()
          .single()

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Update local state optimistically
        setConfigs(prev => prev.map(c => (c.id === id ? data : c)))

        return data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update alert config"
        setError(errorMessage)
        console.error("Error updating alert config:", err)
        throw err
      }
    },
    [supabase]
  )

  const deleteConfig = useCallback(
    async (configId: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from("alert_configs")
          .delete()
          .eq("id", configId)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        // Update local state optimistically
        setConfigs(prev => prev.filter(c => c.id !== configId))
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete alert config"
        setError(errorMessage)
        console.error("Error deleting alert config:", err)
        throw err
      }
    },
    [supabase]
  )

  const refetch = useCallback(async () => {
    await fetchConfigs()
  }, [fetchConfigs])

  // Initial fetch
  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("alert_config_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alert_configs",
        },
        payload => {
          console.log("Alert config change detected:", payload)

          // Handle real-time updates based on event type
          if (payload.eventType === "INSERT" && payload.new) {
            setConfigs(prev => {
              // Check if already exists to avoid duplicates
              const exists = prev.some(c => c.id === payload.new.id)
              return exists ? prev : [payload.new as AlertConfig, ...prev]
            })
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setConfigs(prev =>
              prev.map(c =>
                c.id === payload.new.id ? (payload.new as AlertConfig) : c
              )
            )
          } else if (payload.eventType === "DELETE" && payload.old) {
            setConfigs(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return {
    configs,
    loading,
    error,
    refetch,
    createConfig,
    updateConfig,
    deleteConfig,
  }
}
