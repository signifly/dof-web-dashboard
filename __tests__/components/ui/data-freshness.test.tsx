import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataFreshness } from "@/components/ui/data-freshness"

describe("DataFreshness", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it("should render with basic props", () => {
    const lastUpdated = new Date("2023-01-01T12:00:00Z")

    render(<DataFreshness lastUpdated={lastUpdated} isRefreshing={false} />)

    expect(screen.getByText("Live")).toBeInTheDocument()
    expect(screen.getByText(/Last updated/)).toBeInTheDocument()
  })

  it("should show updating status when refreshing", () => {
    render(<DataFreshness lastUpdated={new Date()} isRefreshing={true} />)

    expect(screen.getByText("Updating")).toBeInTheDocument()
  })

  it("should show error status when error is present", () => {
    const error = new Error("Network error")

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        error={error}
      />
    )

    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("Network error")).toBeInTheDocument()
  })

  it("should show disabled status when not enabled", () => {
    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        isEnabled={false}
      />
    )

    expect(screen.getByText("Disabled")).toBeInTheDocument()
  })

  it("should show paused status when paused", () => {
    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        isPaused={true}
      />
    )

    expect(screen.getByText("Paused")).toBeInTheDocument()
  })

  it("should format relative time correctly", () => {
    const now = new Date("2023-01-01T12:00:00Z")
    jest.setSystemTime(now)

    // Test "just now"
    const justNow = new Date("2023-01-01T11:59:50Z") // 10 seconds ago
    render(<DataFreshness lastUpdated={justNow} isRefreshing={false} />)
    expect(screen.getByText(/just now/)).toBeInTheDocument()

    // Test minutes
    const twoMinutesAgo = new Date("2023-01-01T11:58:00Z")
    render(<DataFreshness lastUpdated={twoMinutesAgo} isRefreshing={false} />)
    expect(screen.getByText(/2m ago/)).toBeInTheDocument()

    // Test hours
    const twoHoursAgo = new Date("2023-01-01T10:00:00Z")
    render(<DataFreshness lastUpdated={twoHoursAgo} isRefreshing={false} />)
    expect(screen.getByText(/2h ago/)).toBeInTheDocument()

    // Test days
    const twoDaysAgo = new Date("2022-12-30T12:00:00Z")
    render(<DataFreshness lastUpdated={twoDaysAgo} isRefreshing={false} />)
    expect(screen.getByText(/2d ago/)).toBeInTheDocument()
  })

  it("should show next refresh countdown", () => {
    const now = new Date("2023-01-01T12:00:00Z")
    const nextRefresh = new Date("2023-01-01T12:02:30Z") // 2 minutes 30 seconds from now
    jest.setSystemTime(now)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        showNextRefresh={true}
      />
    )

    expect(screen.getByText(/Next: 2m 30s/)).toBeInTheDocument()
  })

  it("should hide next refresh when showNextRefresh is false", () => {
    const nextRefresh = new Date(Date.now() + 60000) // 1 minute from now

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        showNextRefresh={false}
      />
    )

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it("should update countdown in real time", () => {
    const now = new Date("2023-01-01T12:00:00Z")
    const nextRefresh = new Date("2023-01-01T12:01:00Z") // 1 minute from now
    jest.setSystemTime(now)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        showNextRefresh={true}
      />
    )

    expect(screen.getByText(/Next: 1m 0s/)).toBeInTheDocument()

    // Advance time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000)
    })

    expect(screen.getByText(/Next: 30s/)).toBeInTheDocument()
  })

  it("should call onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup({ delay: null })
    const onRefresh = jest.fn()

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        onRefresh={onRefresh}
      />
    )

    const refreshButton = screen.getByRole("button", { name: /refresh/i })
    await user.click(refreshButton)

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("should disable refresh button when refreshing", () => {
    const onRefresh = jest.fn()

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={true}
        onRefresh={onRefresh}
      />
    )

    const refreshButton = screen.getByRole("button", { name: /refresh/i })
    expect(refreshButton).toBeDisabled()
  })

  it("should render compact mode correctly", () => {
    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        compact={true}
        onRefresh={jest.fn()}
      />
    )

    // In compact mode, there should be no "Live" text badge
    expect(screen.queryByText("Live")).not.toBeInTheDocument()

    // But the refresh button should still be there (though smaller)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("should handle null lastUpdated", () => {
    render(<DataFreshness lastUpdated={null} isRefreshing={false} />)

    expect(screen.getByText("No data")).toBeInTheDocument()
  })

  it("should not show countdown when disabled", () => {
    const nextRefresh = new Date(Date.now() + 60000)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        isEnabled={false}
        showNextRefresh={true}
      />
    )

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it("should not show countdown when paused", () => {
    const nextRefresh = new Date(Date.now() + 60000)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        isPaused={true}
        showNextRefresh={true}
      />
    )

    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("should handle countdown when time is negative", () => {
    const now = new Date("2023-01-01T12:00:00Z")
    const pastTime = new Date("2023-01-01T11:59:00Z") // 1 minute ago
    jest.setSystemTime(now)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={pastTime}
        showNextRefresh={true}
      />
    )

    // Should not show countdown for past times
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument()
  })

  it("should show spinning icon when refreshing", () => {
    render(<DataFreshness lastUpdated={new Date()} isRefreshing={true} />)

    // The refresh icon should have the animate-spin class
    const refreshIcons = document.querySelectorAll(".animate-spin")
    expect(refreshIcons.length).toBeGreaterThan(0)
  })

  it("should handle countdown seconds only", () => {
    const now = new Date("2023-01-01T12:00:00Z")
    const nextRefresh = new Date("2023-01-01T12:00:30Z") // 30 seconds from now
    jest.setSystemTime(now)

    render(
      <DataFreshness
        lastUpdated={new Date()}
        isRefreshing={false}
        nextRefresh={nextRefresh}
        showNextRefresh={true}
      />
    )

    expect(screen.getByText(/Next: 30s/)).toBeInTheDocument()
  })

  it("should update relative time continuously", () => {
    const initialTime = new Date("2023-01-01T12:00:00Z")
    const lastUpdated = new Date("2023-01-01T11:59:00Z") // 1 minute ago
    jest.setSystemTime(initialTime)

    render(<DataFreshness lastUpdated={lastUpdated} isRefreshing={false} />)

    expect(screen.getByText(/1m ago/)).toBeInTheDocument()

    // Advance time by 1 minute
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    expect(screen.getByText(/2m ago/)).toBeInTheDocument()
  })
})
