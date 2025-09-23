"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/lib/contexts/realtime-context"
import { ConnectionStatus } from "@/components/ui/connection-status"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard" as const,
  },
  {
    name: "Metrics",
    href: "/metrics" as const,
  },
  {
    name: "Devices",
    href: "/devices" as const,
  },
  {
    name: "Analytics",
    href: "/analytics" as const,
  },
] as const

interface HeaderProps {
  title?: string
  showConnectionStatus?: boolean
}

export function Header({
  title = "Dashboard",
  showConnectionStatus = true,
}: HeaderProps) {
  const pathname = usePathname()

  // Get shared realtime connection status
  const { isConnected, lastUpdate, error, reconnect } = useRealtime()

  return (
    <Card className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">DOF</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigationItems.map(item => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                >
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-1">
            {navigationItems.map(item => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  <span>{item.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          {showConnectionStatus && (
            <ConnectionStatus
              isConnected={isConnected}
              lastUpdate={lastUpdate}
              error={error}
              onReconnect={reconnect}
              size="sm"
              className="hidden sm:flex"
            />
          )}

          {/* Mobile connection status (badge only) */}
          {showConnectionStatus && (
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
          )}
        </div>
      </div>
    </Card>
  )
}
