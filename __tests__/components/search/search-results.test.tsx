import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchResults } from "@/components/search/search-results"
import {
  SearchQuery,
  SearchResults as SearchResultsType,
} from "@/lib/services/search-service"

// Mock shadcn components
jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th>{children}</th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
}))

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TabsTrigger: ({ children, value }: any) => (
    <button data-value={value}>{children}</button>
  ),
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => (
    <span>{placeholder}</span>
  ),
}))

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Download: () => <span>Download</span>,
  Search: () => <span>Search</span>,
  Clock: () => <span>Clock</span>,
  Activity: () => <span>Activity</span>,
  Users: () => <span>Users</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}))

describe("SearchResults", () => {
  const mockOnSort = jest.fn()
  const mockOnPageChange = jest.fn()
  const mockOnExport = jest.fn()

  const mockQuery: SearchQuery = {
    text: "test search",
    limit: 10,
    offset: 0,
    sortBy: "timestamp",
    sortOrder: "desc",
  }

  const mockResults: SearchResultsType = {
    metrics: [
      {
        id: "metric-1",
        session_id: "session-1",
        metric_type: "fps",
        metric_value: 45,
        metric_unit: "fps",
        context: { screen_name: "home" },
        timestamp: "2024-01-01T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "metric-2",
        session_id: "session-2",
        metric_type: "memory_usage",
        metric_value: 300,
        metric_unit: "mb",
        context: { screen_name: "profile" },
        timestamp: "2024-01-02T00:00:00Z",
        created_at: "2024-01-02T00:00:00Z",
      },
    ],
    sessions: [
      {
        id: "session-1",
        anonymous_user_id: "user-1",
        session_start: "2024-01-01T00:00:00Z",
        session_end: "2024-01-01T01:00:00Z",
        app_version: "1.0.0",
        device_type: "android",
        os_version: "13.0",
        created_at: "2024-01-01T00:00:00Z",
      },
    ],
    total: 3,
    hasMore: false,
    facets: {
      metricTypes: [
        { type: "fps", count: 1 },
        { type: "memory_usage", count: 1 },
      ],
      platforms: [
        { platform: "android", count: 1 },
        { platform: "ios", count: 0 },
      ],
      appVersions: [{ version: "1.0.0", count: 1 }],
      devices: [{ deviceId: "user-1", count: 1 }],
    },
    executionTime: 150,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render search results with metrics and sessions", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText("Search Results")).toBeInTheDocument()
    expect(screen.getByText("3 results found")).toBeInTheDocument()
    expect(screen.getByText("(150ms)")).toBeInTheDocument()
  })

  it("should display metrics in table format", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Check for metric data
    expect(screen.getByText("fps")).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getByText("memory_usage")).toBeInTheDocument()
    expect(screen.getByText("300")).toBeInTheDocument()
    expect(screen.getByText("home")).toBeInTheDocument()
    expect(screen.getByText("profile")).toBeInTheDocument()
  })

  it("should display sessions in table format", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Switch to sessions tab
    const sessionsTab = screen.getByText("Sessions (1)")
    fireEvent.click(sessionsTab)

    expect(screen.getByText("android")).toBeInTheDocument()
    expect(screen.getByText("1.0.0")).toBeInTheDocument()
    expect(screen.getByText("user-1")).toBeInTheDocument()
  })

  it("should handle empty results", () => {
    const emptyResults: SearchResultsType = {
      metrics: [],
      sessions: [],
      total: 0,
      hasMore: false,
      facets: {
        metricTypes: [],
        platforms: [],
        appVersions: [],
        devices: [],
      },
      executionTime: 50,
    }

    render(
      <SearchResults
        results={emptyResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText("No results found")).toBeInTheDocument()
    expect(
      screen.getByText("Try adjusting your search criteria")
    ).toBeInTheDocument()
  })

  it("should handle loading state", () => {
    render(
      <SearchResults
        results={null}
        query={mockQuery}
        loading={true}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText("Searching...")).toBeInTheDocument()
    expect(screen.getByText("Loading results")).toBeInTheDocument()
  })

  it("should handle sorting changes", async () => {
    const user = userEvent.setup()
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    const sortSelect = screen.getByText("Sort by")
    await user.click(sortSelect)

    // Mock selecting a different sort option
    fireEvent.click(screen.getByText("Metric Value"))

    expect(mockOnSort).toHaveBeenCalledWith("metric_value", "desc")
  })

  it("should handle pagination", async () => {
    const paginatedResults = {
      ...mockResults,
      hasMore: true,
    }

    const user = userEvent.setup()
    render(
      <SearchResults
        results={paginatedResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    const nextButton = screen.getByText("Next")
    await user.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(10) // offset + limit
  })

  it("should handle export functionality", async () => {
    const user = userEvent.setup()
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
        onExport={mockOnExport}
      />
    )

    const exportButton = screen.getByText("Export")
    await user.click(exportButton)

    expect(mockOnExport).toHaveBeenCalledWith(mockResults, "csv")
  })

  it("should display faceted search information", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Check facets display
    expect(screen.getByText("Filters")).toBeInTheDocument()
    expect(screen.getByText("fps (1)")).toBeInTheDocument()
    expect(screen.getByText("memory_usage (1)")).toBeInTheDocument()
    expect(screen.getByText("android (1)")).toBeInTheDocument()
  })

  it("should handle error state", () => {
    render(
      <SearchResults
        results={null}
        query={mockQuery}
        error="Search failed"
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText("Search Error")).toBeInTheDocument()
    expect(screen.getByText("Search failed")).toBeInTheDocument()
    expect(screen.getByText("Try Again")).toBeInTheDocument()
  })

  it("should format timestamps correctly", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Timestamps should be formatted as relative time
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it("should handle tab switching between metrics and sessions", async () => {
    const user = userEvent.setup()
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Start with metrics tab
    expect(screen.getByText("Metrics (2)")).toBeInTheDocument()

    // Switch to sessions tab
    const sessionsTab = screen.getByText("Sessions (1)")
    await user.click(sessionsTab)

    // Should show sessions content
    expect(screen.getByText("Session ID")).toBeInTheDocument()
  })

  it("should display pagination info correctly", () => {
    render(
      <SearchResults
        results={mockResults}
        query={{ ...mockQuery, offset: 10, limit: 10 }}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    expect(screen.getByText("Showing 11-13 of 3 results")).toBeInTheDocument()
  })

  it("should handle responsive layout", () => {
    render(
      <SearchResults
        results={mockResults}
        query={mockQuery}
        onSort={mockOnSort}
        onPageChange={mockOnPageChange}
      />
    )

    // Should have responsive classes for mobile/desktop
    const resultsContainer = screen.getByText("Search Results").closest("div")
    expect(resultsContainer).toHaveClass(/space-y-|gap-/)
  })
})
