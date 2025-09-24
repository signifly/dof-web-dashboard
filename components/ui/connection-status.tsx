"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdate: Date | null
  error: Error | null
  onReconnect?: () => void
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function ConnectionStatus({
  isConnected,
  lastUpdate,
  error,
  onReconnect,
  className,
  showLabel = true,
  size = "md",
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (error) return "bg-red-500"
    if (isConnected) return "bg-green-500"
    return "bg-yellow-500"
  }

  const getStatusText = () => {
    if (error) return "Disconnected"
    if (isConnected) return "Live"
    return "Connecting..."
  }

  const getLastUpdateText = () => {
    if (!lastUpdate) return null

    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      return lastUpdate.toLocaleTimeString()
    }
  }

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Status indicator dot */}
      <div className="flex items-center space-x-1">
        <div
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            getStatusColor(),
            isConnected && "animate-none"
          )}
          title={error?.message || getStatusText()}
        />

        {showLabel && (
          <span className={cn("font-medium", textSizeClasses[size])}>
            {getStatusText()}
          </span>
        )}
      </div>

      {/* Last update time */}
      {lastUpdate && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          {getLastUpdateText()}
        </span>
      )}

      {/* Reconnect button for errors */}
      {error && onReconnect && (
        <Button
          onClick={onReconnect}
          variant="outline"
          size="sm"
          className={cn("h-6 px-2", size === "sm" && "h-5 px-1 text-xs")}
        >
          Reconnect
        </Button>
      )}
    </div>
  )
}

interface ConnectionStatusBadgeProps {
  isConnected: boolean
  error?: Error | null
  onReconnect?: () => void
  className?: string
}

export function ConnectionStatusBadge({
  isConnected,
  error,
  onReconnect,
  className,
}: ConnectionStatusBadgeProps) {
  const _getVariant = () => {
    if (error) return "destructive"
    if (isConnected) return "default"
    return "secondary"
  }

  const getText = () => {
    if (error) return "Offline"
    if (isConnected) return "Live"
    return "Connecting"
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          error && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          isConnected &&
            !error &&
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          !isConnected &&
            !error &&
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        )}
      >
        <div
          className={cn(
            "mr-1.5 h-2 w-2 rounded-full",
            error && "bg-red-400",
            isConnected && !error && "bg-green-400",
            !isConnected && !error && "bg-yellow-400 animate-pulse"
          )}
        />
        {getText()}
      </div>

      {error && onReconnect && (
        <Button
          onClick={onReconnect}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  )
}
