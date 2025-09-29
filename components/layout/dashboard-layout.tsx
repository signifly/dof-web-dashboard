"use client"

import { Header } from "./header"
import { RealtimeProvider } from "@/lib/contexts/realtime-context"
import { AuthProvider } from "@/components/auth/auth-provider"
import type { AuthUser } from "@/lib/env"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  user?: AuthUser | null
}

export function DashboardLayout({ children, title, user }: DashboardLayoutProps) {
  return (
    <AuthProvider initialUser={user}>
      <RealtimeProvider>
        <div className="min-h-screen bg-background">
          <Header title={title} />
          {/* Main Content - Full Width */}
          <main className="p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </RealtimeProvider>
    </AuthProvider>
  )
}
