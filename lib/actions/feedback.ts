import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/types/database"

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
): Promise<FeedbackListResult> {
  const supabase = createClient()

  const {
    page = 1,
    limit = 20,
    filterBy,
    filterValue,
    dateRange,
    sortBy = "timestamp",
    sortOrder = "desc"
  } = options

  try {
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
      console.error("Error fetching feedback list:", error)
      return { data: [], total: 0, hasMore: false }
    }

    const total = count || 0
    const hasMore = from + limit < total

    return {
      data: data || [],
      total,
      hasMore
    }
  } catch (error) {
    console.error("Error in getFeedbackList:", error)
    return { data: [], total: 0, hasMore: false }
  }
}

/**
 * Get single feedback item by ID
 */
export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error fetching feedback ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getFeedbackById:", error)
    return null
  }
}

/**
 * Get feedback statistics for dashboard overview
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const supabase = createClient()

  try {
    // Get total count
    const { count: total } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })

    // Get count with screenshots
    const { count: withScreenshots } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .not("screenshot_url", "is", null)

    // Get unique users count
    const { data: uniqueUsersData } = await supabase
      .from("feedback")
      .select("user_email")

    const uniqueUsers = new Set(
      uniqueUsersData?.map(item => item.user_email) || []
    ).size

    // Get unique routes count
    const { data: uniqueRoutesData } = await supabase
      .from("feedback")
      .select("route")

    const uniqueRoutes = new Set(
      uniqueRoutesData?.map(item => item.route) || []
    ).size

    // Get today's count
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const { count: todayCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", todayStart.toISOString())

    // Get this week's count
    const weekStart = new Date(todayStart)
    weekStart.setDate(todayStart.getDate() - todayStart.getDay())

    const { count: thisWeekCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", weekStart.toISOString())

    return {
      total: total || 0,
      withScreenshots: withScreenshots || 0,
      uniqueUsers,
      uniqueRoutes,
      todayCount: todayCount || 0,
      thisWeekCount: thisWeekCount || 0
    }
  } catch (error) {
    console.error("Error in getFeedbackStats:", error)
    return {
      total: 0,
      withScreenshots: 0,
      uniqueUsers: 0,
      uniqueRoutes: 0,
      todayCount: 0,
      thisWeekCount: 0
    }
  }
}

/**
 * Get recent feedback items (last 10)
 */
export async function getRecentFeedback(): Promise<Feedback[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching recent feedback:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getRecentFeedback:", error)
    return []
  }
}

/**
 * Get unique routes from feedback for filter suggestions
 */
export async function getFeedbackRoutes(): Promise<string[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("route")
      .order("route")

    if (error) {
      console.error("Error fetching feedback routes:", error)
      return []
    }

    // Get unique routes
    const uniqueRoutes = Array.from(
      new Set(data?.map(item => item.route) || [])
    ).filter(Boolean)

    return uniqueRoutes
  } catch (error) {
    console.error("Error in getFeedbackRoutes:", error)
    return []
  }
}

/**
 * Get unique user emails from feedback for filter suggestions
 */
export async function getFeedbackUsers(): Promise<string[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("user_email")
      .order("user_email")

    if (error) {
      console.error("Error fetching feedback users:", error)
      return []
    }

    // Get unique users
    const uniqueUsers = Array.from(
      new Set(data?.map(item => item.user_email) || [])
    ).filter(Boolean)

    return uniqueUsers
  } catch (error) {
    console.error("Error in getFeedbackUsers:", error)
    return []
  }
}