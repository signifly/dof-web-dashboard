"use client"

import { useRealtime } from "@/lib/contexts/realtime-context"
import { ConnectionStatus } from "@/components/ui/connection-status"
import { cn } from "@/lib/utils"

interface ClientRealtimeStatusProps {
  showConnectionStatus?: boolean
  className?: string
}

export function ClientRealtimeStatus({
  showConnectionStatus = true,
  className
}: ClientRealtimeStatusProps) {
  const { isConnected, lastUpdate, error, reconnect } = useRealtime()

  if (!showConnectionStatus) {
    return null
  }

  return (
    <>
      {/* Desktop connection status */}
      <ConnectionStatus
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        error={error}
        onReconnect={reconnect}
        size="sm"
        className={cn("hidden sm:flex", className)}
      />

      {/* Mobile connection status (badge only) */}
      <div className="sm:hidden">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            error && "bg-red-500",
            isConnected && !error && "bg-green-500",
            !isConnected && !error && "bg-yellow-500 animate-pulse"
          )}
          title={
            error?.message || (isConnected ? "Live" : "Connecting...")
          }
        />
      </div>
    </>
  )
}