"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    name: "Metrics",
    href: "/metrics",
    icon: "📈",
  },
  {
    name: "Devices",
    href: "/devices",
    icon: "📱",
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <Card className={cn("h-full w-64 p-6", className)}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">DOF</span>
        </div>
        <nav className="space-y-2">
          {navigationItems.map(item => (
            <Link key={item.href} href={item.href as any}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                className="w-full justify-start space-x-2"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </Card>
  )
}
