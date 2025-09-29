import { getServerAuthContext } from "@/lib/auth/server-context"
import { ServerHeader } from "./server-header"
import { ClientProviders } from "./client-providers"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  user?: never // Remove user prop - we'll get it from server context
}

/**
 * Server Component DashboardLayout
 * Optimized for performance with minimal client-side hydration
 */
export async function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  // Get authenticated user using cached server context
  const { user } = await getServerAuthContext()

  return (
    <div className="min-h-screen bg-background">
      {/* Wrap entire layout content that needs client context */}
      <ClientProviders user={user}>
        {/* Server-rendered header with client components properly scoped */}
        <ServerHeader title={title} user={user} />

        {/* Main content area */}
        <main className="p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </ClientProviders>
    </div>
  )
}
