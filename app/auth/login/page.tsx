import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Login - DOF Dashboard",
  description: "Sign in to access the DOF performance monitoring dashboard",
  robots: "noindex, nofollow", // Prevent search engine indexing
}

interface LoginPageProps {
  searchParams: {
    error?: string
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Redirect if user is already authenticated
  try {
    const user = await getUser()
    if (user) {
      redirect("/dashboard")
    }
  } catch (error) {
    // If getUser fails (e.g., env validation issues), just continue to login page
    console.error("Error checking user auth:", error)
  }

  const { error } = searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {error === "access_denied" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              This application is restricted to authorized users only. Please
              contact your administrator if you need access.
            </AlertDescription>
          </Alert>
        )}

        {error === "session_expired" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Session Expired</AlertTitle>
            <AlertDescription>
              Your session has expired. Please sign in again.
            </AlertDescription>
          </Alert>
        )}

        {error === "rate_limited" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Too Many Attempts</AlertTitle>
            <AlertDescription>
              Your account has been temporarily locked due to too many failed
              login attempts. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
