/**
 * Client-side Dashboard Layout Wrapper
 * Handles interactive elements and auth state
 */

"use client"

import {
  SimpleAuthProvider,
  useRequireAuth,
} from "@/components/auth/simple-auth-provider"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { User } from "@/lib/auth/json-auth"

interface DashboardLayoutClientProps {
  children: React.ReactNode
  title?: string
  user: User
}

function DashboardContent({
  children,
  title,
}: {
  children: React.ReactNode
  title?: string
}) {
  // This will redirect to login if not authenticated
  useRequireAuth()

  return (
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
  )
}

export function DashboardLayoutClient({
  children,
  title,
  user,
}: DashboardLayoutClientProps) {
  return (
    <SimpleAuthProvider initialUser={user}>
      <DashboardContent title={title}>{children}</DashboardContent>
    </SimpleAuthProvider>
  )
}
