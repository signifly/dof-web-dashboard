/**
 * Server Component Dashboard Layout
 * Fetches user data and passes to client component
 */

import { DashboardLayoutClient } from "./dashboard-layout-client"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export async function DashboardLayout({
  children,
  title,
}: DashboardLayoutProps) {
  // No authentication required - create a mock user
  const mockUser = {
    id: "1",
    email: "local@user.com",
    name: "Local User",
    role: "admin" as const,
    is_active: true,
    created_at: new Date().toISOString(),
  }

  return (
    <DashboardLayoutClient title={title} user={mockUser}>
      {children}
    </DashboardLayoutClient>
  )
}
