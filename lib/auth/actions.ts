'use server'

import { redirect } from 'next/navigation'
import { authenticateUser, createSession, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export interface LoginResult {
  success: boolean
  error?: string
}

/**
 * Server action to handle user login
 */
export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
      }
    }

    // Authenticate user against environment variables
    const user = authenticateUser(email, password)

    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Create session token
    const sessionToken = createSession(user)

    // Set session cookie
    await setSessionCookie(sessionToken)

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An error occurred during login',
    }
  }
}

/**
 * Server action to handle user logout
 */
export async function logoutAction(): Promise<void> {
  try {
    await clearSessionCookie()
  } catch (error) {
    console.error('Logout error:', error)
  }

  redirect('/auth/login')
}