/**
 * Server Actions for Authentication
 * Handle login/logout with form submissions
 */

"use server"

import { redirect } from "next/navigation"
import { authService } from "@/lib/auth/json-auth"
import { isSuccess } from "@/lib/utils/result"
import { revalidatePath } from "next/cache"

export interface LoginFormState {
  error?: string
  success?: boolean
}

/**
 * Handle login form submission
 */
export async function loginAction(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return {
      error: "Email and password are required",
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      error: "Please enter a valid email address",
    }
  }

  const result = await authService.login({ email, password })

  if (!isSuccess(result)) {
    return {
      error: result.error.message,
    }
  }

  // Revalidate all pages to update auth state
  revalidatePath("/", "layout")

  // Redirect to dashboard on success
  redirect("/dashboard")
}

/**
 * Handle logout
 */
export async function logoutAction(): Promise<void> {
  await authService.logout()

  // Revalidate all pages to update auth state
  revalidatePath("/", "layout")

  // Redirect to login page
  redirect("/auth/login")
}

/**
 * Simple login action for direct use (without form state)
 */
export async function simpleLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  console.log("Server: simpleLogin called with email:", email)

  try {
    // Direct login without Result pattern to debug
    const { users } = require("@/lib/auth/users.json")
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.is_active)

    if (!user) {
      console.log("Server: user not found")
      return { success: false, error: "Invalid email or password" }
    }

    if (user.password !== password) {
      console.log("Server: password mismatch")
      return { success: false, error: "Invalid email or password" }
    }

    console.log("Server: login successful for user:", user.email)

    // Create session manually to ensure it works
    const { cookies } = require("next/headers")
    const token = crypto.getRandomValues(new Uint8Array(32))
      .reduce((acc, val) => acc + val.toString(16).padStart(2, "0"), "")

    console.log("Server: creating session with token:", token.substring(0, 8) + "...")

    // Set the session cookie directly
    const cookieStore = cookies()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    cookieStore.set("dof-session", token, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    console.log("Server: session cookie set, redirecting...")
    revalidatePath("/", "layout")

    // Server-side redirect
    redirect("/dashboard")
  } catch (error) {
    console.error("Server: login threw error:", error)
    return {
      success: false,
      error: "Internal server error",
    }
  }
}
