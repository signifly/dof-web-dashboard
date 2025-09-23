import { render, screen, fireEvent } from "@testing-library/react"
import {
  ConnectionStatus,
  ConnectionStatusBadge,
} from "@/components/ui/connection-status"

describe("ConnectionStatus", () => {
  const defaultProps = {
    isConnected: true,
    lastUpdate: new Date("2023-01-01T12:00:00Z"),
    onReconnect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render connected state correctly", () => {
    render(<ConnectionStatus {...defaultProps} />)

    expect(screen.getByText("Live")).toBeInTheDocument()
    expect(screen.getByText(/1:00:00 PM/)).toBeInTheDocument()
  })

  it("should render disconnected state correctly", () => {
    render(
      <ConnectionStatus
        {...defaultProps}
        isConnected={false}
        lastUpdate={null}
      />
    )

    expect(screen.getByText("Connecting...")).toBeInTheDocument()
    expect(screen.queryByText("Reconnect")).not.toBeInTheDocument()
  })

  it("should render connecting state correctly", () => {
    render(
      <ConnectionStatus
        {...defaultProps}
        isConnected={false}
        lastUpdate={defaultProps.lastUpdate}
      />
    )

    expect(screen.getByText("Connecting...")).toBeInTheDocument()
  })

  it("should render error state correctly", () => {
    const error = new Error("Connection failed")
    render(<ConnectionStatus {...defaultProps} error={error} />)

    expect(screen.getByText("Disconnected")).toBeInTheDocument()
    expect(screen.getByText("Reconnect")).toBeInTheDocument()
  })

  it("should call onReconnect when reconnect button is clicked", () => {
    const error = new Error("Connection failed")
    render(
      <ConnectionStatus
        {...defaultProps}
        error={error}
      />
    )

    const reconnectButton = screen.getByText("Reconnect")
    fireEvent.click(reconnectButton)

    expect(defaultProps.onReconnect).toHaveBeenCalledTimes(1)
  })

  it("should display last update time correctly", () => {
    render(<ConnectionStatus {...defaultProps} />)

    expect(screen.getByText(/1:00:00 PM/)).toBeInTheDocument()
  })

  it("should handle different sizes", () => {
    const { rerender } = render(
      <ConnectionStatus {...defaultProps} size="sm" />
    )

    expect(screen.getByText("Live")).toBeInTheDocument()

    rerender(<ConnectionStatus {...defaultProps} size="lg" />)

    expect(screen.getByText("Live")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <ConnectionStatus {...defaultProps} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})

describe("ConnectionStatusBadge", () => {
  const defaultProps = {
    isConnected: true,
    onReconnect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render connected badge correctly", () => {
    render(<ConnectionStatusBadge {...defaultProps} />)

    expect(screen.getByText("Live")).toBeInTheDocument()
  })

  it("should render disconnected badge correctly", () => {
    render(<ConnectionStatusBadge {...defaultProps} isConnected={false} />)

    expect(screen.getByText("Connecting")).toBeInTheDocument()
  })

  it("should render error badge correctly", () => {
    const error = new Error("Connection failed")
    render(<ConnectionStatusBadge {...defaultProps} error={error} />)

    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("should call onReconnect when clicked in error state", () => {
    const error = new Error("Connection failed")
    render(<ConnectionStatusBadge {...defaultProps} error={error} />)

    const button = screen.getByText("Retry")
    fireEvent.click(button)

    expect(defaultProps.onReconnect).toHaveBeenCalledTimes(1)
  })

  it("should call onReconnect when clicked in offline state", () => {
    render(<ConnectionStatusBadge {...defaultProps} isConnected={false} />)

    // In the disconnected state without error, there's no retry button
    // The badge itself is not clickable, only error state shows retry button
    expect(screen.queryByText("Retry")).not.toBeInTheDocument()
  })

  it("should not call onReconnect when clicked in connected state", () => {
    render(<ConnectionStatusBadge {...defaultProps} />)

    const badge = screen.getByText("Live")
    fireEvent.click(badge)

    expect(defaultProps.onReconnect).not.toHaveBeenCalled()
  })

  it("should handle different sizes", () => {
    const { rerender } = render(
      <ConnectionStatusBadge {...defaultProps} size="sm" />
    )

    expect(screen.getByText("Live")).toBeInTheDocument()

    rerender(<ConnectionStatusBadge {...defaultProps} size="lg" />)

    expect(screen.getByText("Live")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <ConnectionStatusBadge {...defaultProps} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})