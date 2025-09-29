"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface AuthErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    // Log error securely without exposing sensitive data
    console.error("Auth page error:", {
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Authentication Error
          </CardTitle>
          <CardDescription>
            Something went wrong with the authentication system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Occurred</AlertTitle>
            <AlertDescription>
              {error.message.includes("auth")
                ? "Authentication system encountered an error. Please try again."
                : "An unexpected error occurred. Please try refreshing the page."}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/auth/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-sm text-muted-foreground">
              <summary className="cursor-pointer">Development Info</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {error.name}: {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
