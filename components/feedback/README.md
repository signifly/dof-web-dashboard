# Feedback Management Components

This directory contains the feedback management components for the DOF Web Dashboard, implementing GitHub issue #44.

## Components Overview

### 1. FeedbackDashboard
Main container component that coordinates all feedback functionality.

**Features:**
- Stats overview with cards showing total feedback, unique users, routes, and screenshots
- Integrates filters, list, and detail modal
- Handles state management and data loading
- Real-time updates and error handling

**Usage:**
```tsx
import { FeedbackDashboard } from "@/components/feedback"

// With initial data (Server Component pattern)
<FeedbackDashboard initialData={{
  feedback: feedbackList,
  stats: feedbackStats,
  total: totalCount,
  hasMore: hasMoreItems
}} />

// Without initial data (will load on mount)
<FeedbackDashboard />
```

### 2. FeedbackList
Table/list component showing feedback entries with pagination.

**Features:**
- Responsive design (desktop table + mobile cards)
- Columns: Date, User Email, Route, Comment (truncated), Screenshot indicator
- Click to view details
- Load more pagination (20 items per page)
- Loading states and error handling

### 3. FeedbackFilters
Filtering controls for feedback data.

**Features:**
- User email search with autocomplete
- Route filter dropdown with search
- Screenshot presence toggle
- Date range picker (predefined + custom ranges)
- Active filters display with individual removal
- Clear all filters functionality

### 4. FeedbackDetail
Modal/dialog for detailed feedback view.

**Features:**
- Full comment display with copy functionality
- User email with mailto link
- Route information with external link
- Timestamp details (date, time, relative)
- Screenshot integration with download
- System information (IDs, creation times)
- Responsive layout for all screen sizes

## Type Definitions

The components use the following key types from `@/lib/actions/feedback`:

```tsx
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
```

## Example Implementation

Here's how to create a feedback management page:

```tsx
// app/feedback/page.tsx
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeedbackDashboard } from "@/components/feedback"
import { getFeedbackList, getFeedbackStats } from "@/lib/actions/feedback"
import { getUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function FeedbackPage() {
  const user = await getUser()

  // Optionally pre-load initial data
  const [feedbackResult, stats] = await Promise.all([
    getFeedbackList({ page: 1, limit: 20 }),
    getFeedbackStats()
  ])

  return (
    <DashboardLayout user={user} title="Feedback Management">
      <FeedbackDashboard
        initialData={{
          feedback: feedbackResult.data,
          stats,
          total: feedbackResult.total,
          hasMore: feedbackResult.hasMore
        }}
      />
    </DashboardLayout>
  )
}
```

## Server Actions Integration

The components integrate seamlessly with the existing server actions in `@/lib/actions/feedback.ts`:

- `getFeedbackList()` - Paginated feedback with filtering
- `getFeedbackStats()` - Dashboard statistics
- `getFeedbackById()` - Single feedback item
- `getRecentFeedback()` - Latest 10 entries
- `getFeedbackRoutes()` - Unique routes for filter dropdown
- `getFeedbackUsers()` - Unique users for autocomplete

## Design Patterns

### Server Components by Default
Components use Server Components where possible, with `"use client"` only for interactivity:
- FeedbackDashboard: Client (state management, event handlers)
- FeedbackList: Client (click handlers, loading states)
- FeedbackFilters: Client (form interactions)
- FeedbackDetail: Client (modal functionality)

### Responsive Mobile-First Design
- Desktop: Full table layout with all columns
- Mobile: Card-based layout with condensed information
- Tablet: Adaptive layout based on available space

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus management in modals

### Error Handling
- Graceful fallbacks for failed data loading
- User-friendly error messages
- Retry mechanisms where appropriate
- Loading states for all async operations

## Dependencies

The components rely on these shadcn/ui components:
- Card, Button, Badge, Dialog, Table
- Select, Input, Switch, Calendar
- Command, Popover, Separator
- Alert, Skeleton (custom)

External dependencies:
- Lucide React icons
- React Day Picker for date ranges
- Next.js 14 App Router patterns