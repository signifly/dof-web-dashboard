import Link from "next/link"
import { Card } from "@/components/ui/card"
import { ClientNavigation, MobileClientNavigation } from "./client-navigation"
import { ClientRealtimeStatus } from "./client-realtime-status"
import { GlobalSearch } from "@/components/search/global-search"
import { UserMenu } from "./user-menu"
import type { AuthUser } from "@/lib/env"

interface ServerHeaderProps {
  title?: string
  user: AuthUser | null
  showConnectionStatus?: boolean
}

/**
 * Server Component Header
 * Renders static parts on server, uses client components only for interactivity
 */
export function ServerHeader({
  title = "Dashboard",
  user,
  showConnectionStatus = true,
}: ServerHeaderProps) {
  return (
    <Card className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Logo/Brand - Server rendered */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">DOF</span>
          </Link>

          {/* Desktop Navigation - Client component for active state */}
          <ClientNavigation className="hidden md:flex" />

          {/* Mobile Navigation - Client component for active state */}
          <MobileClientNavigation className="md:hidden" />
        </div>

        <div className="flex items-center space-x-4">
          {/* Global Search - Server rendered */}
          <div className="hidden lg:block">
            <GlobalSearch variant="button" className="w-[280px]" />
          </div>

          {/* Connection Status - Client component for realtime status */}
          <ClientRealtimeStatus
            showConnectionStatus={showConnectionStatus}
          />

          {/* User Menu - Client component for auth interactions */}
          <UserMenu />
        </div>
      </div>
    </Card>
  )
}