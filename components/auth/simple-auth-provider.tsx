/**
 * Simple Auth Provider
 * Provides authentication context using table-based auth
 */

"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "@/lib/auth/json-auth"
import { logoutAction } from "@/lib/actions/auth-actions"

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: User | null
}

export function SimpleAuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)

  useEffect(() => {
    // If we have an initial user from the server, set loading to false
    if (initialUser !== undefined) {
      setUser(initialUser)
      setLoading(false)
    }
  }, [initialUser])

  const logout = async () => {
    try {
      await logoutAction()
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const value = {
    user,
    loading,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a SimpleAuthProvider")
  }
  return context
}

// Helper hook to require authentication (disabled for local development)
export function useRequireAuth() {
  const { user, loading } = useAuth()

  // No authentication required for local development
  return { user, loading }
}
