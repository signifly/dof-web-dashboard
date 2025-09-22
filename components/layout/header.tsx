"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Metrics",
    href: "/metrics",
  },
  {
    name: "Devices",
    href: "/devices",
  },
  {
    name: "Analytics",
    href: "/analytics",
  },
]

interface HeaderProps {
  title?: string
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const pathname = usePathname()

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
          {/* Right side content if needed */}
        </div>
      </div>
    </Card>
  )
}
