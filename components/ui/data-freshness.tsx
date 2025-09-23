"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Clock, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataFreshnessProps {
  /** When the data was last updated */
  lastUpdated: Date | null
  /** Whether data is currently being refreshed */
  isRefreshing: boolean
  /** When the next refresh will occur */
  nextRefresh?: Date | null
  /** Error state */
  error?: Error | null
  /** Whether auto-refresh is enabled */
  isEnabled?: boolean
  /** Whether refresh is paused (e.g., due to user interaction) */
  isPaused?: boolean
  /** Manual refresh function */
  onRefresh?: () => void
  /** Compact display mode */
  compact?: boolean
  /** Show next refresh countdown */
  showNextRefresh?: boolean
  /** Custom className */
  className?: string
}

export function DataFreshness({
  lastUpdated,
  isRefreshing,
  nextRefresh,
  error,
  isEnabled = true,
  isPaused = false,
  onRefresh,
  compact = false,
  showNextRefresh = true,
  className,
}: DataFreshnessProps) {
  const [now, setNow] = useState(new Date())
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number | null>(null)

  // Use refs to avoid dependency issues
  const nextRefreshRef = useRef(nextRefresh)
  const isEnabledRef = useRef(isEnabled)
  const isPausedRef = useRef(isPaused)

  // Update refs when props change
  useEffect(() => {
    nextRefreshRef.current = nextRefresh
  }, [nextRefresh])

  useEffect(() => {
    isEnabledRef.current = isEnabled
  }, [isEnabled])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  // Stable update function
  const updateTimeAndRefresh = useCallback(() => {
    const currentTime = new Date()
    setNow(currentTime)

    // Calculate time until next refresh using refs
    const currentNextRefresh = nextRefreshRef.current
    const currentIsEnabled = isEnabledRef.current
    const currentIsPaused = isPausedRef.current

    if (currentNextRefresh && currentIsEnabled && !currentIsPaused) {
      const timeLeft = currentNextRefresh.getTime() - currentTime.getTime()
      const newTimeUntilRefresh = timeLeft > 0 ? timeLeft : null
      setTimeUntilRefresh(newTimeUntilRefresh)
    } else {
      setTimeUntilRefresh(null)
    }
  }, [])

  // Effect for time updates - no dependencies that change
  useEffect(() => {
    // Initial calculation
    updateTimeAndRefresh()

    // Set up interval for updates
    const interval = setInterval(updateTimeAndRefresh, 1000)

    return () => clearInterval(interval)
  }, [updateTimeAndRefresh])

  // Format relative time (e.g., "2 minutes ago") - memoized to prevent recalculation
  const formatRelativeTime = useCallback(
    (date: Date): string => {
      const diffMs = now.getTime() - date.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)

      if (diffSeconds < 60) {
        return "just now"
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`
      } else if (diffHours < 24) {
        return `${diffHours}h ago`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d ago`
      }
    },
    [now]
  )

  // Format countdown time (e.g., "2m 30s") - pure function
  const formatCountdown = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }, [])

  // Get status badge variant and content - memoized
  const getStatusBadge = useCallback(() => {
    if (error) {
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        text: "Error",
      }
    }

    if (isRefreshing) {
      return {
        variant: "secondary" as const,
        icon: RefreshCw,
        text: "Updating",
      }
    }

    if (!isEnabled) {
      return {
        variant: "outline" as const,
        icon: WifiOff,
        text: "Disabled",
      }
    }

    if (isPaused) {
      return {
        variant: "outline" as const,
        icon: Clock,
        text: "Paused",
      }
    }

    return {
      variant: "default" as const,
      icon: Wifi,
      text: "Live",
    }
  }, [error, isRefreshing, isEnabled, isPaused])

  const status = getStatusBadge()
  const StatusIcon = status.icon

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className
        )}
      >
        <StatusIcon
          className={cn(
            "h-3 w-3",
            isRefreshing && "animate-spin",
            error && "text-destructive",
            !isEnabled && "text-muted-foreground"
          )}
        />
        {lastUpdated && <span>{formatRelativeTime(lastUpdated)}</span>}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-5 px-1 text-xs"
          >
            <RefreshCw
              className={cn("h-3 w-3", isRefreshing && "animate-spin")}
            />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className="flex items-center gap-1">
          <StatusIcon
            className={cn("h-3 w-3", isRefreshing && "animate-spin")}
          />
          {status.text}
        </Badge>

        <div className="text-sm text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error.message}</span>
          ) : lastUpdated ? (
            <span>Last updated {formatRelativeTime(lastUpdated)}</span>
          ) : (
            <span>No data</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showNextRefresh &&
          timeUntilRefresh !== null &&
          timeUntilRefresh > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Next: {formatCountdown(timeUntilRefresh)}</span>
            </div>
          )}

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
        )}
      </div>
    </div>
  )
}
