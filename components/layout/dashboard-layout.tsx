"use client"

import { Header } from "./header"
import { RealtimeProvider } from "@/lib/contexts/realtime-context"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-background">
        <Header title={title} />
        {/* Main Content - Full Width */}
        <main className="p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </RealtimeProvider>
  )
}
