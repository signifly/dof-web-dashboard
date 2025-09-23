/**
 * Client-side data fetching functions for performance data
 * These functions use fetch() to call API routes and can be used in client components
 */

import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"

/**
 * Client-side function to get performance summary
 */
export async function getPerformanceSummaryClient(): Promise<PerformanceSummary> {
  const response = await fetch("/api/performance/summary", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch performance summary: ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Client-side function to get performance trends
 */
export async function getPerformanceTrendsClient(
  limit = 50
): Promise<MetricsTrend[]> {
  const url = new URL("/api/performance/trends", window.location.origin)
  url.searchParams.set("limit", limit.toString())

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch performance trends: ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Client-side function to get dashboard data (both summary and trends)
 */
export async function getDashboardDataClient(
  trendsLimit = 50
): Promise<{ summary: PerformanceSummary; trends: MetricsTrend[] }> {
  const [summary, trends] = await Promise.all([
    getPerformanceSummaryClient(),
    getPerformanceTrendsClient(trendsLimit),
  ])

  return { summary, trends }
}
