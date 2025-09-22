/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import {
  AlertStatsCards,
  AlertStatsCompact,
} from "@/components/alerts/alert-stats"
import { AlertInstance } from "@/types/alerts"

const mockAlerts: AlertInstance[] = [
  {
    id: "alert-1",
    config_id: "config-1",
    severity: "critical",
    metric_value: 95.5,
    threshold_violated: 90,
    message: "Critical alert 1",
    source: "system",
    status: "active",
    created_at: "2024-01-15T14:30:00Z",
  },
  {
    id: "alert-2",
    config_id: "config-2",
    severity: "critical",
    metric_value: 92.0,
    threshold_violated: 90,
    message: "Critical alert 2",
    source: "system",
    status: "active",
    created_at: "2024-01-15T14:25:00Z",
  },
  {
    id: "alert-3",
    config_id: "config-3",
    severity: "warning",
    metric_value: 85.0,
    threshold_violated: 80,
    message: "Warning alert 1",
    source: "system",
    status: "acknowledged",
    created_at: "2024-01-15T14:20:00Z",
  },
  {
    id: "alert-4",
    config_id: "config-4",
    severity: "warning",
    metric_value: 82.0,
    threshold_violated: 80,
    message: "Warning alert 2",
    source: "system",
    status: "resolved",
    created_at: "2024-01-15T14:15:00Z",
  },
]

describe("AlertStatsCards", () => {
  it("calculates and displays correct statistics", () => {
    render(<AlertStatsCards alerts={mockAlerts} />)

    // Total alerts
    expect(screen.getByText("Total Alerts")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()

    // Active alerts (2 active)
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    // Critical alerts (2 critical)
    expect(screen.getByText("Critical")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    // Warning alerts (2 warnings)
    expect(screen.getByText("Warnings")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    // Acknowledged alerts (1 acknowledged)
    expect(screen.getByText("Acknowledged")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()

    // Resolved alerts (1 resolved)
    expect(screen.getByText("Resolved")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("displays correct descriptions for each stat", () => {
    render(<AlertStatsCards alerts={mockAlerts} />)

    expect(screen.getByText("Last 24 hours")).toBeInTheDocument()
    expect(screen.getByText("Require attention")).toBeInTheDocument()
    expect(screen.getByText("High priority")).toBeInTheDocument()
    expect(screen.getByText("Monitor closely")).toBeInTheDocument()
    expect(screen.getByText("Being handled")).toBeInTheDocument()
    expect(screen.getByText("Successfully handled")).toBeInTheDocument()
  })

  it("handles empty alerts array", () => {
    render(<AlertStatsCards alerts={[]} />)

    // All stats should show 0
    const statValues = screen.getAllByText("0")
    expect(statValues).toHaveLength(6) // 6 stat cards
  })

  it("applies custom className", () => {
    const { container } = render(
      <AlertStatsCards alerts={mockAlerts} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})

describe("AlertStatsCompact", () => {
  it("displays compact statistics correctly", () => {
    render(<AlertStatsCompact alerts={mockAlerts} />)

    expect(screen.getByText("4 Total")).toBeInTheDocument()
    expect(screen.getByText("2 Active")).toBeInTheDocument()
    expect(screen.getByText("2 Critical")).toBeInTheDocument()
    expect(screen.getByText("2 Warnings")).toBeInTheDocument()
    expect(screen.getByText("1 Resolved")).toBeInTheDocument()
  })

  it("calculates stats correctly with mixed alert statuses", () => {
    const mixedAlerts: AlertInstance[] = [
      {
        id: "alert-1",
        config_id: "config-1",
        severity: "critical",
        metric_value: 95.5,
        threshold_violated: 90,
        message: "Critical active",
        source: "system",
        status: "active",
        created_at: "2024-01-15T14:30:00Z",
      },
      {
        id: "alert-2",
        config_id: "config-2",
        severity: "warning",
        metric_value: 85.0,
        threshold_violated: 80,
        message: "Warning resolved",
        source: "system",
        status: "resolved",
        created_at: "2024-01-15T14:25:00Z",
      },
    ]

    render(<AlertStatsCompact alerts={mixedAlerts} />)

    expect(screen.getByText("2 Total")).toBeInTheDocument()
    expect(screen.getByText("1 Active")).toBeInTheDocument()
    expect(screen.getByText("1 Critical")).toBeInTheDocument()
    expect(screen.getByText("1 Warnings")).toBeInTheDocument()
    expect(screen.getByText("1 Resolved")).toBeInTheDocument()
  })

  it("handles empty alerts array in compact view", () => {
    render(<AlertStatsCompact alerts={[]} />)

    expect(screen.getByText("0 Total")).toBeInTheDocument()
    expect(screen.getByText("0 Active")).toBeInTheDocument()
    expect(screen.getByText("0 Critical")).toBeInTheDocument()
    expect(screen.getByText("0 Warnings")).toBeInTheDocument()
    expect(screen.getByText("0 Resolved")).toBeInTheDocument()
  })

  it("applies custom className to compact view", () => {
    const { container } = render(
      <AlertStatsCompact alerts={mockAlerts} className="compact-custom" />
    )

    expect(container.firstChild).toHaveClass("compact-custom")
  })
})
