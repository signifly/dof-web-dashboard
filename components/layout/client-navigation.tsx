"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard" as const,
  },
  {
    name: "Search",
    href: "/search" as const,
  },
  {
    name: "Metrics",
    href: "/metrics" as const,
  },
  {
    name: "Routes",
    href: "/routes" as const,
  },
  {
    name: "Devices",
    href: "/devices" as const,
  },
  {
    name: "Analytics",
    href: "/analytics" as const,
  },
  {
    name: "Insights",
    href: "/insights" as const,
  },
  {
    name: "Feedback",
    href: "/feedback" as const,
  },
] as const

interface ClientNavigationProps {
  className?: string
}

export function ClientNavigation({ className }: ClientNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center space-x-2", className)}>
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
  )
}

interface MobileClientNavigationProps {
  className?: string
}

export function MobileClientNavigation({
  className,
}: MobileClientNavigationProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex items-center space-x-1", className)}>
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
  )
}
