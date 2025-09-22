/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AlertList } from "@/components/alerts/alert-list"
import { AlertInstance } from "@/types/alerts"

const mockAlerts: AlertInstance[] = [
  {
    id: "alert-1",
    config_id: "config-1",
    severity: "critical",
    metric_value: 95.5,
    threshold_violated: 90,
    message: "CPU usage exceeded threshold",
    source: "system_monitor",
    status: "active",
    created_at: "2024-01-15T14:30:00Z",
    config: {
      id: "config-1",
      name: "CPU Usage Monitor",
      metric_type: "cpu_usage",
      threshold_warning: 80,
      threshold_critical: 90,
      notification_channels: [],
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  },
  {
    id: "alert-2",
    config_id: "config-2",
    severity: "warning",
    metric_value: 2500,
    threshold_violated: 2000,
    message: "Page load time increased",
    source: "lighthouse",
    status: "acknowledged",
    created_at: "2024-01-15T14:25:00Z",
    acknowledged_at: "2024-01-15T14:35:00Z",
    config: {
      id: "config-2",
      name: "Page Load Monitor",
      metric_type: "page_load_time",
      threshold_warning: 2000,
      threshold_critical: 3000,
      notification_channels: [],
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  },
]

describe("AlertList", () => {
  it("renders loading state", () => {
    render(<AlertList alerts={[]} loading={true} />)
    expect(screen.getByText("Loading alerts...")).toBeInTheDocument()
  })

  it("renders empty state when no alerts", () => {
    render(<AlertList alerts={[]} loading={false} />)
    expect(screen.getByText("No alerts found")).toBeInTheDocument()
    expect(
      screen.getByText("All systems are operating normally")
    ).toBeInTheDocument()
  })

  it("renders alert list with correct data", () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText("CPU Usage Monitor")).toBeInTheDocument()
    expect(screen.getByText("Page Load Monitor")).toBeInTheDocument()
    expect(screen.getByText("CPU usage exceeded threshold")).toBeInTheDocument()
    expect(screen.getByText("Page load time increased")).toBeInTheDocument()
  })

  it("displays severity badges correctly", () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText("CRITICAL")).toBeInTheDocument()
    expect(screen.getByText("WARNING")).toBeInTheDocument()
  })

  it("displays status badges correctly", () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    expect(screen.getByText("ACKNOWLEDGED")).toBeInTheDocument()
  })

  it("formats metric values correctly", () => {
    render(<AlertList alerts={mockAlerts} />)

    // CPU usage should be formatted as percentage
    expect(screen.getByText("95.5%")).toBeInTheDocument()
    expect(screen.getByText("Threshold: 90.0%")).toBeInTheDocument()

    // Page load time should be formatted as milliseconds
    expect(screen.getByText("2500ms")).toBeInTheDocument()
    expect(screen.getByText("Threshold: 2000ms")).toBeInTheDocument()
  })

  it("shows acknowledge option for active alerts", async () => {
    const mockAcknowledge = jest.fn().mockResolvedValue(undefined)
    render(<AlertList alerts={mockAlerts} onAcknowledge={mockAcknowledge} />)

    // Click on the dropdown menu for the first alert (active)
    const dropdownButtons = screen.getAllByRole("button", { name: /options/i })
    fireEvent.click(dropdownButtons[0])

    await waitFor(() => {
      expect(screen.getByText("Acknowledge")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Acknowledge"))

    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledWith("alert-1")
    })
  })

  it("shows resolve option for active and acknowledged alerts", async () => {
    const mockResolve = jest.fn().mockResolvedValue(undefined)
    render(<AlertList alerts={mockAlerts} onResolve={mockResolve} />)

    // Click on the dropdown menu for the acknowledged alert
    const dropdownButtons = screen.getAllByRole("button", { name: /options/i })
    fireEvent.click(dropdownButtons[1])

    await waitFor(() => {
      expect(screen.getByText("Resolve")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Resolve"))

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalledWith("alert-2")
    })
  })

  it("calls onViewDetails when view details is clicked", async () => {
    const mockViewDetails = jest.fn()
    render(<AlertList alerts={mockAlerts} onViewDetails={mockViewDetails} />)

    const dropdownButtons = screen.getAllByRole("button", { name: /options/i })
    fireEvent.click(dropdownButtons[0])

    await waitFor(() => {
      expect(screen.getByText("View Details")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("View Details"))

    expect(mockViewDetails).toHaveBeenCalledWith(mockAlerts[0])
  })

  it("applies opacity to resolved alerts", () => {
    const resolvedAlert: AlertInstance = {
      ...mockAlerts[0],
      status: "resolved",
      resolved_at: "2024-01-15T14:40:00Z",
    }

    render(<AlertList alerts={[resolvedAlert]} />)

    const alertRow = screen.getByRole("row", { name: /cpu usage monitor/i })
    expect(alertRow).toHaveClass("opacity-60")
  })

  it("displays timestamps correctly", () => {
    render(<AlertList alerts={mockAlerts} />)

    // Should show formatted date and time
    expect(screen.getByText("1/15/2024")).toBeInTheDocument()
  })
})
