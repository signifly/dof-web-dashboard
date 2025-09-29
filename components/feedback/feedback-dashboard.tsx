"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackList } from "./feedback-list"
import { FeedbackFilters } from "./feedback-filters"
import { FeedbackDetail } from "./feedback-detail"
import {
  getFeedbackList,
  getFeedbackStats,
  type Feedback,
  type FeedbackListOptions,
  type FeedbackStats,
} from "@/lib/actions/feedback"
import { MessageSquare, Users, Route, ImageIcon, Clock } from "lucide-react"
import { useEffect } from "react"

interface FeedbackDashboardProps {
  initialData?: {
    feedback: Feedback[]
    stats: FeedbackStats
    total: number
    hasMore: boolean
  }
}

export interface FeedbackFilters {
  userEmail: string
  route: string
  hasScreenshot: boolean | null
  dateRange: { start: string; end: string } | null
}

export function FeedbackDashboard({ initialData }: FeedbackDashboardProps) {
  const [feedback, setFeedback] = useState<Feedback[]>(
    initialData?.feedback || []
  )
  const [stats, setStats] = useState<FeedbackStats>(
    initialData?.stats || {
      total: 0,
      withScreenshots: 0,
      uniqueUsers: 0,
      uniqueRoutes: 0,
      todayCount: 0,
      thisWeekCount: 0,
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(initialData?.total || 0)
  const [hasMore, setHasMore] = useState(initialData?.hasMore || false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  )
  const [filters, setFilters] = useState<FeedbackFilters>({
    userEmail: "",
    route: "",
    hasScreenshot: null,
    dateRange: null,
  })

  // Load feedback data based on current filters and page
  const loadFeedback = useCallback(
    async (page: number = 1, newFilters?: FeedbackFilters) => {
      setLoading(true)
      setError(null)

      try {
        const currentFilters = newFilters || filters
        const options: FeedbackListOptions = {
          page,
          limit: 20,
          sortBy: "timestamp",
          sortOrder: "desc",
        }

        // Apply filters
        if (currentFilters.userEmail) {
          options.filterBy = "user"
          options.filterValue = currentFilters.userEmail
        } else if (currentFilters.route) {
          options.filterBy = "route"
          options.filterValue = currentFilters.route
        } else if (currentFilters.hasScreenshot !== null) {
          options.filterBy = "hasScreenshot"
          options.filterValue = currentFilters.hasScreenshot.toString()
        }

        if (currentFilters.dateRange) {
          options.dateRange = currentFilters.dateRange
        }

        const result = await getFeedbackList(options)

        if (page === 1) {
          setFeedback(result.data)
        } else {
          setFeedback(prev => [...prev, ...result.data])
        }

        setTotal(result.total)
        setHasMore(result.hasMore)
        setCurrentPage(page)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feedback")
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const newStats = await getFeedbackStats()
      setStats(newStats)
    } catch (err) {
      console.error("Failed to load feedback stats:", err)
    }
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback(
    async (newFilters: FeedbackFilters) => {
      setFilters(newFilters)
      setCurrentPage(1)
      await loadFeedback(1, newFilters)
    },
    [loadFeedback]
  )

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadFeedback(currentPage + 1)
    }
  }, [loading, hasMore, currentPage, loadFeedback])

  // Handle feedback selection
  const handleFeedbackSelect = useCallback((feedback: Feedback) => {
    setSelectedFeedback(feedback)
  }, [])

  // Handle feedback detail close
  const handleDetailClose = useCallback(() => {
    setSelectedFeedback(null)
  }, [])

  // Load initial data if not provided
  useEffect(() => {
    if (!initialData) {
      loadFeedback()
      loadStats()
    }
  }, [initialData, loadFeedback, loadStats])

  // Stats cards data
  const statsCards = useMemo(
    () => [
      {
        title: "Total Feedback",
        value: stats.total,
        icon: MessageSquare,
        description: `${stats.todayCount} today, ${stats.thisWeekCount} this week`,
      },
      {
        title: "Unique Users",
        value: stats.uniqueUsers,
        icon: Users,
        description: "Users who provided feedback",
      },
      {
        title: "Routes Covered",
        value: stats.uniqueRoutes,
        icon: Route,
        description: "Different pages with feedback",
      },
      {
        title: "With Screenshots",
        value: stats.withScreenshots,
        icon: ImageIcon,
        description: `${Math.round((stats.withScreenshots / Math.max(stats.total, 1)) * 100)}% of total`,
      },
    ],
    [stats]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Feedback Management
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage user feedback submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback Entries
              {total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {total.toLocaleString()}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <FeedbackList
            feedback={feedback}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onFeedbackSelect={handleFeedbackSelect}
            onLoadMore={handleLoadMore}
          />
        </CardContent>
      </Card>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          open={!!selectedFeedback}
          onClose={handleDetailClose}
        />
      )}
    </div>
  )
}
