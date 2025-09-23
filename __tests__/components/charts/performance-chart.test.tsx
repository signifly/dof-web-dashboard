import { render, screen } from "@testing-library/react"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { MetricsTrend } from "@/lib/performance-data"

// Note: Hook is mocked globally in jest.setup.js

import { useRealtimePerformance } from "@/lib/hooks/use-realtime-performance"

const mockUseRealtimePerformance =
  useRealtimePerformance as jest.MockedFunction<typeof useRealtimePerformance>

describe("PerformanceChart", () => {
  const mockData: MetricsTrend[] = [
    {
      timestamp: "2023-01-01T00:00:00Z",
      fps: 60,
      memory_usage: 100,
      cpu_usage: 50,
      load_time: 1000,
      screen_name: "test",
    },
    {
      timestamp: "2023-01-01T00:01:00Z",
      fps: 58,
      memory_usage: 120,
      cpu_usage: 55,
      load_time: 1100,
      screen_name: "test",
    },
  ]

  const defaultProps = {
    data: mockData,
    title: "Test Chart",
    metric: "fps" as const,
    unit: " FPS",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRealtimePerformance.mockReturnValue({
      data: [],
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
      reconnect: jest.fn(),
    })
  })

  it("should render chart with static data when realtime is disabled", () => {
    render(<PerformanceChart {...defaultProps} />)

    expect(screen.getByText("Test Chart")).toBeInTheDocument()
    expect(screen.getByText("2 points")).toBeInTheDocument()
    expect(screen.getByText(/Min: 58/)).toBeInTheDocument()
    expect(screen.getByText(/Max: 60/)).toBeInTheDocument()
    expect(screen.getByText(/Avg: 59/)).toBeInTheDocument()
  })

  it("should use realtime data when realtime is enabled", () => {
    const realtimeData: MetricsTrend[] = [
      {
        timestamp: "2023-01-01T00:02:00Z",
        fps: 62,
        memory_usage: 90,
        cpu_usage: 45,
        load_time: 900,
        screen_name: "realtime",
      },
    ]

    mockUseRealtimePerformance.mockReturnValue({
      data: realtimeData,
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
      reconnect: jest.fn(),
    })

    render(<PerformanceChart {...defaultProps} enableRealtime={true} />)

    expect(screen.getByText("Test Chart")).toBeInTheDocument()
    expect(screen.getByText("1 points")).toBeInTheDocument()
    expect(screen.getByText(/Max: 62/)).toBeInTheDocument()
  })

  it("should show connection status badge when realtime is enabled", () => {
    render(<PerformanceChart {...defaultProps} enableRealtime={true} />)

    expect(screen.getByText("Live")).toBeInTheDocument()
  })

  it("should show 'No data available' for static data when empty", () => {
    render(<PerformanceChart {...defaultProps} data={[]} />)

    expect(screen.getByText("No data available")).toBeInTheDocument()
  })

  it("should show 'Waiting for realtime data' when realtime enabled but no data", () => {
    mockUseRealtimePerformance.mockReturnValue({
      data: [],
      isConnected: true,
      lastUpdate: null,
      error: null,
      reconnect: jest.fn(),
    })

    render(<PerformanceChart {...defaultProps} enableRealtime={true} />)

    expect(screen.getByText("Waiting for realtime data...")).toBeInTheDocument()
  })

  it("should handle different metric types", () => {
    const { rerender } = render(
      <PerformanceChart {...defaultProps} metric="memory_usage" unit=" MB" />
    )

    expect(screen.getByText(/Min: 100/)).toBeInTheDocument()
    expect(screen.getByText(/Max: 120/)).toBeInTheDocument()

    rerender(
      <PerformanceChart {...defaultProps} metric="load_time" unit=" ms" />
    )

    expect(screen.getByText(/Min: 1000/)).toBeInTheDocument()
    expect(screen.getByText(/Max: 1100/)).toBeInTheDocument()
  })

  it("should apply custom height", () => {
    const { container } = render(
      <PerformanceChart {...defaultProps} height="h-32" />
    )

    expect(container.querySelector(".h-32")).toBeInTheDocument()
  })

  it("should render bars for data points", () => {
    const { container } = render(<PerformanceChart {...defaultProps} />)

    // Should render bars for each data point (limited to last 20)
    const bars = container.querySelectorAll(".bg-blue-500")
    expect(bars.length).toBe(2)
  })

  it("should show tooltips with metric values", () => {
    const { container } = render(<PerformanceChart {...defaultProps} />)

    const firstBar = container.querySelector(".bg-blue-500")
    expect(firstBar).toHaveAttribute("title", "test: 60 FPS")
  })

  it("should handle error state in realtime mode", () => {
    const mockError = new Error("Connection failed")
    mockUseRealtimePerformance.mockReturnValue({
      data: mockData,
      isConnected: false,
      lastUpdate: new Date(),
      error: mockError,
      reconnect: jest.fn(),
    })

    render(<PerformanceChart {...defaultProps} enableRealtime={true} />)

    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("should limit displayed data points to 20", () => {
    const largeDataset: MetricsTrend[] = Array.from({ length: 50 }, (_, i) => ({
      timestamp: `2023-01-01T00:${i.toString().padStart(2, "0")}:00Z`,
      fps: 60 + i,
      memory_usage: 100 + i,
      cpu_usage: 50 + i,
      load_time: 1000 + i,
      screen_name: "test",
    }))

    const { container } = render(
      <PerformanceChart {...defaultProps} data={largeDataset} />
    )

    const bars = container.querySelectorAll(".bg-blue-500")
    expect(bars.length).toBe(20) // Should limit to last 20 points
  })
})
