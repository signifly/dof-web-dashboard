'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/env'
import { logoutAction } from '@/lib/auth/actions'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: AuthUser | null
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const router = useRouter()

  const signOut = async () => {
    try {
      setUser(null)
      await logoutAction()
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/auth/login')
    }
  }

  // Check authentication status on mount if no initial user provided
  useEffect(() => {
    if (initialUser === null) {
      // In a real implementation, you'd check the session here
      // For now, we'll rely on server-side checks
      setLoading(false)
    }
  }, [initialUser])

  const value: AuthContextType = {
    user,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}