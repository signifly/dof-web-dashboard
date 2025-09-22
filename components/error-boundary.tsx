/**
 * Error Boundary Component
 * Provides graceful error handling for React components
 */

"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UI_DIMENSIONS, UI_TEXT } from "@/src/constants"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error for debugging
    console.error("Error Boundary caught an error:", error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent error={this.state.error!} retry={this.retry} />
        )
      }

      return (
        <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center space-x-2">
          <AlertTriangle
            className={`${UI_DIMENSIONS.HEIGHTS.ICON_SM} ${UI_DIMENSIONS.WIDTHS.ICON_SM}`}
          />
          <span>Something went wrong</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-red-600 text-sm">
            {error.message || "An unexpected error occurred"}
          </p>

          <div className="flex space-x-2">
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw
                className={`${UI_DIMENSIONS.HEIGHTS.ICON_SM} ${UI_DIMENSIONS.WIDTHS.ICON_SM} ${UI_DIMENSIONS.SPACING.ICON_TEXT}`}
              />
              Try Again
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export both class and functional wrapper
export class ErrorBoundary extends ErrorBoundaryClass {}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Specialized error boundary for alert components
export function AlertErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      onError={error => console.error("Alert system error:", error)}
      fallback={({ error, retry }) => (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle
                className={`${UI_DIMENSIONS.HEIGHTS.ICON_SM} ${UI_DIMENSIONS.WIDTHS.ICON_SM} text-orange-600`}
              />
              <div>
                <p className="text-orange-800 font-medium">
                  Alert System Error
                </p>
                <p className="text-orange-600 text-sm">
                  {error.message || "Failed to load alerts"}
                </p>
              </div>
              <Button onClick={retry} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
