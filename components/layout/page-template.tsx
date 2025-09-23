import React from "react"
import { DashboardLayout } from "./dashboard-layout"
import { ErrorBoundary } from "@/components/ui/error-boundary"

interface PageTemplateProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  loading?: boolean
  error?: boolean
  errorMessage?: string
}

export function PageTemplate({
  title,
  description,
  actions,
  children,
  loading,
  error,
  errorMessage,
}: PageTemplateProps) {
  if (error) {
    return (
      <DashboardLayout title={title}>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Unable to load {title.toLowerCase()} data
            </h2>
            <p className="text-muted-foreground">
              Make sure your database is connected and contains performance
              data.
            </p>
            {errorMessage && (
              <p className="text-sm text-muted-foreground mt-2">
                Error: {errorMessage}
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title={title}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={title}>
      <ErrorBoundary>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex space-x-2">{actions}</div>}
          </div>
          {children}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  )
}
