"use server"

import { cache } from "react"
import { PerformanceInsightsEngine } from "@/lib/services/insights-engine"
import { InsightsReport } from "@/types/insights"

/**
 * Generate performance insights with caching
 * Cached with React cache for request deduplication
 */
export const getPerformanceInsights = cache(
  async (timeRange?: {
    start: string
    end: string
  }): Promise<InsightsReport> => {
    const insightsEngine = new PerformanceInsightsEngine()
    return await insightsEngine.generateInsights(timeRange)
  }
)
