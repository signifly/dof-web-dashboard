"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { Tables } from "@/types/database"
import { type Result } from "@/lib/utils/result"

export type Feedback = Tables<"feedback">

export interface FeedbackListOptions {
  page?: number
  limit?: number
  filterBy?: "user" | "route" | "hasScreenshot"
  filterValue?: string
  dateRange?: { start: string; end: string }
  sortBy?: "timestamp" | "created_at"
  sortOrder?: "asc" | "desc"
}

export interface FeedbackListResult {
  data: Feedback[]
  total: number
  hasMore: boolean
}

export interface FeedbackStats {
  total: number
  withScreenshots: number
  uniqueUsers: number
  uniqueRoutes: number
  todayCount: number
  thisWeekCount: number
}

/**
 * Get paginated feedback list with filtering and sorting options
 */
export async function getFeedbackList(
  options: FeedbackListOptions = {}
): Promise<Result<FeedbackListResult>> {
  try {
    const supabase = createServiceClient()

    const {
      page = 1,
      limit = 20,
      filterBy,
      filterValue,
      dateRange,
      sortBy = "timestamp",
      sortOrder = "desc",
    } = options

    let query = supabase.from("feedback").select("*", { count: "exact" })

    // Apply filters
    if (filterBy && filterValue) {
      switch (filterBy) {
        case "user":
          query = query.ilike("user_email", `%${filterValue}%`)
          break
        case "route":
          query = query.ilike("route", `%${filterValue}%`)
          break
        case "hasScreenshot":
          if (filterValue === "true") {
            query = query.not("screenshot_url", "is", null)
          } else {
            query = query.is("screenshot_url", null)
          }
          break
      }
    }

    // Apply date range filter
    if (dateRange) {
      query = query
        .gte("timestamp", dateRange.start)
        .lte("timestamp", dateRange.end)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return {
        data: null,
        error: `Failed to fetch feedback list: ${error.message}`,
      }
    }

    const total = count || 0
    const hasMore = from + limit < total

    const resultData: FeedbackListResult = {
      data: data || [],
      total,
      hasMore,
    }

    return { data: resultData, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get single feedback item by ID
 */
export async function getFeedbackById(
  id: string
): Promise<Result<Feedback | null>> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found - this is not an error, just return null
        return { data: null, error: null }
      }
      return {
        data: null,
        error: `Failed to fetch feedback ${id}: ${error.message}`,
      }
    }

    return { data: data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get feedback statistics for dashboard overview
 * Optimized to use fewer database queries for better performance
 */
export async function getFeedbackStats(): Promise<Result<FeedbackStats>> {
  try {
    const supabase = createServiceClient()

    // Calculate date boundaries once
    const today = new Date()
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const weekStart = new Date(todayStart)
    weekStart.setDate(todayStart.getDate() - todayStart.getDay())

    // Get all feedback data in a single query to calculate stats
    const { data: allFeedback, error } = await supabase
      .from("feedback")
      .select("user_email, route, screenshot_url, timestamp")

    if (error) {
      return {
        data: null,
        error: `Failed to fetch feedback stats: ${error.message}`,
      }
    }

    const feedbackList = allFeedback || []

    // Calculate all stats from the single dataset
    const total = feedbackList.length
    const withScreenshots = feedbackList.filter(
      item => item.screenshot_url
    ).length
    const uniqueUsers = new Set(feedbackList.map(item => item.user_email)).size
    const uniqueRoutes = new Set(feedbackList.map(item => item.route)).size

    // Simplified date calculations to avoid closure issues
    const todayISOString = todayStart.toISOString()
    const weekISOString = weekStart.toISOString()

    const todayCount = feedbackList.filter(
      item => item.timestamp >= todayISOString
    ).length
    const thisWeekCount = feedbackList.filter(
      item => item.timestamp >= weekISOString
    ).length

    const statsData: FeedbackStats = {
      total,
      withScreenshots,
      uniqueUsers,
      uniqueRoutes,
      todayCount,
      thisWeekCount,
    }

    return { data: statsData, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get recent feedback items (last 10)
 */
export async function getRecentFeedback(): Promise<Result<Feedback[]>> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10)

    if (error) {
      return {
        data: null,
        error: `Failed to fetch recent feedback: ${error.message}`,
      }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get unique routes from feedback for filter suggestions
 */
export async function getFeedbackRoutes(): Promise<Result<string[]>> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("feedback")
      .select("route")
      .order("route")

    if (error) {
      return {
        data: null,
        error: `Failed to fetch feedback routes: ${error.message}`,
      }
    }

    // Get unique routes
    const uniqueRoutes = Array.from(
      new Set(data?.map(item => item.route) || [])
    ).filter(Boolean)

    return { data: uniqueRoutes, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get unique user emails from feedback for filter suggestions
 */
export async function getFeedbackUsers(): Promise<Result<string[]>> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("feedback")
      .select("user_email")
      .order("user_email")

    if (error) {
      return {
        data: null,
        error: `Failed to fetch feedback users: ${error.message}`,
      }
    }

    // Get unique users
    const uniqueUsers = Array.from(
      new Set(data?.map(item => item.user_email) || [])
    ).filter(Boolean)

    return { data: uniqueUsers, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
