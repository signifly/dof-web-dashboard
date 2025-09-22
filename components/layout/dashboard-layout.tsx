"use client"

import { AuthProvider } from "@/components/auth/auth-provider"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header title={title} />
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 p-4">
            <Sidebar />
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
