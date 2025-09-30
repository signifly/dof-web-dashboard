"use client"

import { AuthProvider } from "@/components/auth/auth-provider"
import { RealtimeProvider } from "@/lib/contexts/realtime-context"
import type { AuthUser } from "@/lib/env"

interface ClientProvidersProps {
  children: React.ReactNode
  user: AuthUser | null
}

/**
 * Client-side providers for components that need auth and realtime context
 * This wraps only the parts of the layout that require client-side state
 */
export function ClientProviders({ children, user }: ClientProvidersProps) {
  return (
    <AuthProvider initialUser={user}>
      <RealtimeProvider>{children}</RealtimeProvider>
    </AuthProvider>
  )
}
