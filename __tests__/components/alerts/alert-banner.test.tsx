/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AlertBanner } from "@/components/alerts/alert-banner"
import { AlertInstance } from "@/types/alerts"

const mockAlert: AlertInstance = {
  id: "test-alert-1",
  config_id: "test-config-1",
  severity: "critical",
  metric_value: 95.5,
  threshold_violated: 90,
  message:
    "CRITICAL: CPU Usage Monitor - cpu usage reached 95.5% (threshold: 90%)",
  source: "system_monitor",
  status: "active",
  created_at: "2024-01-15T14:30:00Z",
  config: {
    id: "test-config-1",
    name: "CPU Usage Monitor",
    metric_type: "cpu_usage",
    threshold_warning: 80,
    threshold_critical: 90,
    notification_channels: [],
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
}

describe("AlertBanner", () => {
  it("renders alert banner with critical severity", () => {
    render(<AlertBanner alert={mockAlert} />)

    expect(screen.getByText("CPU Usage Monitor")).toBeInTheDocument()
    expect(screen.getByText("CRITICAL")).toBeInTheDocument()
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    expect(
      screen.getByText(
        "CRITICAL: CPU Usage Monitor - cpu usage reached 95.5% (threshold: 90%)"
      )
    ).toBeInTheDocument()
  })

  it("shows acknowledge and resolve buttons for active alerts", () => {
    render(<AlertBanner alert={mockAlert} />)

    expect(screen.getByText("Acknowledge")).toBeInTheDocument()
    expect(screen.getByText("Resolve")).toBeInTheDocument()
  })

  it("calls onAcknowledge when acknowledge button is clicked", async () => {
    const mockAcknowledge = jest.fn().mockResolvedValue(undefined)
    render(<AlertBanner alert={mockAlert} onAcknowledge={mockAcknowledge} />)

    fireEvent.click(screen.getByText("Acknowledge"))

    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledTimes(1)
    })
  })

  it("calls onResolve when resolve button is clicked", async () => {
    const mockResolve = jest.fn().mockResolvedValue(undefined)
    render(<AlertBanner alert={mockAlert} onResolve={mockResolve} />)

    fireEvent.click(screen.getByText("Resolve"))

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalledTimes(1)
    })
  })

  it("displays warning severity with correct styling", () => {
    const warningAlert: AlertInstance = {
      ...mockAlert,
      severity: "warning",
      message: "WARNING: Memory usage reached 85%",
    }

    render(<AlertBanner alert={warningAlert} />)

    expect(screen.getByText("WARNING")).toBeInTheDocument()
    const banner = screen.getByRole("alert")
    expect(banner).toHaveClass("border-l-yellow-500", "bg-yellow-50")
  })

  it("shows only resolve button for acknowledged alerts", () => {
    const acknowledgedAlert: AlertInstance = {
      ...mockAlert,
      status: "acknowledged",
      acknowledged_at: "2024-01-15T14:35:00Z",
    }

    render(<AlertBanner alert={acknowledgedAlert} />)

    expect(screen.queryByText("Acknowledge")).not.toBeInTheDocument()
    expect(screen.getByText("Resolve")).toBeInTheDocument()
  })

  it("shows no action buttons for resolved alerts", () => {
    const resolvedAlert: AlertInstance = {
      ...mockAlert,
      status: "resolved",
      resolved_at: "2024-01-15T14:40:00Z",
    }

    render(<AlertBanner alert={resolvedAlert} />)

    expect(screen.queryByText("Acknowledge")).not.toBeInTheDocument()
    expect(screen.queryByText("Resolve")).not.toBeInTheDocument()
  })

  it("shows dismiss button when onDismiss is provided", () => {
    const mockDismiss = jest.fn()
    render(<AlertBanner alert={mockAlert} onDismiss={mockDismiss} />)

    const dismissButton = screen.getByRole("button", { name: /close/i })
    expect(dismissButton).toBeInTheDocument()

    fireEvent.click(dismissButton)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it("displays source and timestamp information", () => {
    render(<AlertBanner alert={mockAlert} />)

    expect(screen.getByText(/Source:.*system_monitor/)).toBeInTheDocument()
    expect(screen.getByText(/Value:.*95.50/)).toBeInTheDocument()
    expect(screen.getByText(/Time:/)).toBeInTheDocument()
  })
})
