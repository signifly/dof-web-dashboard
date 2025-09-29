"use client"

import { useState, memo, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { type Feedback } from "@/lib/actions/feedback"
import {
  MessageSquare,
  User,
  Route,
  ImageIcon,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface FeedbackListProps {
  feedback: Feedback[]
  loading: boolean
  error: string | null
  hasMore: boolean
  onFeedbackSelect: (feedback: Feedback) => void
  onLoadMore: () => void
}

export function FeedbackList({
  feedback,
  loading,
  error,
  hasMore,
  onFeedbackSelect,
  onLoadMore,
}: FeedbackListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleRowClick = useCallback(
    (item: Feedback) => {
      setSelectedId(item.id)
      onFeedbackSelect(item)
    },
    [onFeedbackSelect]
  )

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp)

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const formatRoute = (route: string) => {
    // Clean up route display
    return route.startsWith("/") ? route : `/${route}`
  }

  // Memoized table row component to prevent unnecessary re-renders
  const FeedbackTableRow = memo(
    ({
      item,
      isSelected,
      onRowClick,
    }: {
      item: Feedback
      isSelected: boolean
      onRowClick: (item: Feedback) => void
    }) => (
      <TableRow
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
          isSelected ? "bg-muted" : ""
        }`}
        onClick={() => onRowClick(item)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatDate(item.timestamp)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm truncate">{item.user_email}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Route className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="text-xs truncate">
              {formatRoute(item.route)}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncateText(item.comment, 80)}
          </p>
        </TableCell>
        <TableCell className="text-center">
          {item.screenshot_url ? (
            <Badge variant="secondary" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              Yes
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">No</span>
          )}
        </TableCell>
        <TableCell>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </TableCell>
      </TableRow>
    )
  )
  FeedbackTableRow.displayName = "FeedbackTableRow"

  // Memoized card component to prevent unnecessary re-renders
  const FeedbackCard = memo(
    ({
      item,
      isSelected,
      onCardClick,
    }: {
      item: Feedback
      isSelected: boolean
      onCardClick: (item: Feedback) => void
    }) => (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => onCardClick(item)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {item.user_email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.screenshot_url && (
                <Badge variant="secondary" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Screenshot
                </Badge>
              )}
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2">
            <Route className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {formatRoute(item.route)}
            </Badge>
          </div>

          {/* Comment */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.comment}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(item.timestamp)}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  )
  FeedbackCard.displayName = "FeedbackCard"

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (loading && feedback.length === 0) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    )
  }

  // Empty state
  if (feedback.length === 0 && !loading) {
    return (
      <div className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No feedback entries found.</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or check back later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="w-[200px]">User</TableHead>
              <TableHead className="w-[150px]">Route</TableHead>
              <TableHead className="flex-1">Comment</TableHead>
              <TableHead className="w-[80px] text-center">Screenshot</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map(item => (
              <FeedbackTableRow
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onRowClick={handleRowClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 p-6">
        {feedback.map(item => (
          <FeedbackCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onCardClick={handleRowClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center p-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* Loading indicator for subsequent loads */}
      {loading && feedback.length > 0 && (
        <div className="flex justify-center p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more feedback...
          </div>
        </div>
      )}
    </div>
  )
}
