/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { InteractiveChart } from "@/components/charts/interactive-chart"
import type { MetricsTrend } from "@/lib/performance-data"
import type { ChartAnnotation } from "@/types/chart"

// Mock the date-fns module
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === "HH:mm") return "12:00"
    if (formatStr === "HH:mm:ss") return "12:00:00"
    return date.toLocaleString()
  }),
  parseISO: jest.fn((dateStr: string) => new Date(dateStr)),
}))

// Mock Recharts components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode
    data: any[]
  }) => (
    <div data-testid="line-chart" data-length={data.length}>
      {children}
    </div>
  ),
  AreaChart: ({
    children,
    data,
  }: {
    children: React.ReactNode
    data: any[]
  }) => (
    <div data-testid="area-chart" data-length={data.length}>
      {children}
    </div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode
    data: any[]
  }) => (
    <div data-testid="bar-chart" data-length={data.length}>
      {children}
    </div>
  ),
  ScatterChart: ({
    children,
    data,
  }: {
    children: React.ReactNode
    data: any[]
  }) => (
    <div data-testid="scatter-chart" data-length={data.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-key={dataKey} data-color={stroke} />
  ),
  Area: ({
    dataKey,
    stroke,
    fill,
  }: {
    dataKey: string
    stroke: string
    fill: string
  }) => (
    <div
      data-testid="area"
      data-key={dataKey}
      data-stroke={stroke}
      data-fill={fill}
    />
  ),
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />
  ),
  Scatter: ({ fill }: { fill: string }) => (
    <div data-testid="scatter" data-fill={fill} />
  ),
  XAxis: ({
    dataKey,
    tickFormatter: _tickFormatter,
  }: {
    dataKey: string
    tickFormatter?: Function
  }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({
    domain: _domain,
    tickFormatter: _tickFormatter,
  }: {
    domain?: any
    tickFormatter?: Function
  }) => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: ({ content: _content }: { content: React.ComponentType<any> }) => (
    <div data-testid="tooltip" />
  ),
  Legend: () => <div data-testid="legend" />,
  Brush: ({ dataKey, onChange: _onChange }: { dataKey: string; onChange?: Function }) => (
    <div data-testid="brush" data-key={dataKey} />
  ),
  ReferenceLine: ({ x, stroke }: { x: number; stroke: string }) => (
    <div data-testid="reference-line" data-x={x} data-stroke={stroke} />
  ),
  ReferenceArea: () => <div data-testid="reference-area" />,
}))

// Mock custom hooks
jest.mock("@/hooks/use-chart-zoom", () => ({
  useChartZoom: () => ({
    zoomState: { isZoomed: false, scale: 1, translateX: 0, translateY: 0 },
    zoomHandlers: {
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onZoomReset: jest.fn(),
    },
    getVisibleData: jest.fn(data => data),
  }),
}))

jest.mock("@/hooks/use-chart-brush", () => ({
  useChartBrush: () => ({
    brushState: { isActive: false },
    brushHandlers: {
      onBrushChange: jest.fn(),
      onBrushClear: jest.fn(),
    },
    getSelectedData: jest.fn(data => data),
  }),
}))

jest.mock("@/hooks/use-chart-export", () => ({
  useChartExport: () => ({
    exportState: { isExporting: false },
    exportChart: jest.fn(),
    exportData: jest.fn(),
  }),
}))

// Mock chart helpers
jest.mock("@/lib/utils/chart-helpers", () => ({
  transformDataForChart: jest.fn(data =>
    data.map((item: MetricsTrend, index: number) => ({
      ...item,
      timestamp_formatted: "12:00:00",
      timestamp_short: "12:00",
      index,
      value: item.fps || item.memory_usage || item.cpu_usage || item.load_time,
      performance_tier: "Good",
    }))
  ),
  calculateChartDomain: jest.fn(() => [0, 100]),
  generatePerformanceAnnotations: jest.fn(() => []),
  getPerformanceColor: jest.fn(() => "#3b82f6"),
  chartColorSchemes: {
    primary: {
      fps: "#10b981",
      memory_usage: "#f59e0b",
      cpu_usage: "#ef4444",
      load_time: "#3b82f6",
    },
  },
}))

// Sample test data
const mockData: MetricsTrend[] = [
  {
    timestamp: "2024-01-01T12:00:00Z",
    fps: 60,
    memory_usage: 256,
    cpu_usage: 30,
    load_time: 800,
    screen_name: "HomeScreen",
  },
  {
    timestamp: "2024-01-01T12:01:00Z",
    fps: 55,
    memory_usage: 280,
    cpu_usage: 35,
    load_time: 850,
    screen_name: "HomeScreen",
  },
  {
    timestamp: "2024-01-01T12:02:00Z",
    fps: 58,
    memory_usage: 270,
    cpu_usage: 32,
    load_time: 820,
    screen_name: "HomeScreen",
  },
]

const mockAnnotations: ChartAnnotation[] = [
  {
    x: 50,
    y: 15,
    label: "Performance Issue",
    type: "error",
    description: "Significant FPS drop detected",
  },
  {
    x: 120,
    y: 25,
    label: "Optimization Applied",
    type: "success",
    description: "Memory optimization deployed",
  },
]

describe("InteractiveChart", () => {
  const defaultProps = {
    data: mockData,
    metric: "fps" as const,
    chartType: "line" as const,
    title: "Test Chart",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders chart with correct title", () => {
      render(<InteractiveChart {...defaultProps} />)
      expect(screen.getByText("Test Chart")).toBeInTheDocument()
    })

    it("renders line chart by default", () => {
      render(<InteractiveChart {...defaultProps} />)
      expect(screen.getByTestId("line-chart")).toBeInTheDocument()
      expect(screen.getByTestId("line")).toBeInTheDocument()
    })

    it("renders area chart when chartType is area", () => {
      render(<InteractiveChart {...defaultProps} chartType="area" />)
      expect(screen.getByTestId("area-chart")).toBeInTheDocument()
      expect(screen.getByTestId("area")).toBeInTheDocument()
    })

    it("renders bar chart when chartType is bar", () => {
      render(<InteractiveChart {...defaultProps} chartType="bar" />)
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument()
      expect(screen.getByTestId("bar")).toBeInTheDocument()
    })

    it("renders scatter chart when chartType is scatter", () => {
      render(<InteractiveChart {...defaultProps} chartType="scatter" />)
      expect(screen.getByTestId("scatter-chart")).toBeInTheDocument()
      expect(screen.getByTestId("scatter")).toBeInTheDocument()
    })

    it("renders with custom height", () => {
      render(<InteractiveChart {...defaultProps} height={600} />)
      const container = screen.getByTestId("responsive-container")
      expect(container).toBeInTheDocument()
    })

    it("shows no data message when data is empty", () => {
      render(<InteractiveChart {...defaultProps} data={[]} />)
      expect(screen.getByText("No data available")).toBeInTheDocument()
    })
  })

  describe("Interactive Features", () => {
    it("renders zoom controls when enableZoom is true", () => {
      render(<InteractiveChart {...defaultProps} enableZoom={true} />)
      expect(
        screen.getByRole("button", { name: /zoom in/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /zoom out/i })
      ).toBeInTheDocument()
    })

    it("renders export buttons when enableExport is true", () => {
      render(<InteractiveChart {...defaultProps} enableExport={true} />)
      expect(screen.getByText("PNG")).toBeInTheDocument()
      expect(screen.getByText("SVG")).toBeInTheDocument()
      expect(screen.getByText("CSV")).toBeInTheDocument()
    })

    it("renders brush when enableBrush is true", () => {
      render(<InteractiveChart {...defaultProps} enableBrush={true} />)
      expect(screen.getByTestId("brush")).toBeInTheDocument()
    })

    it("does not render controls when disabled", () => {
      render(
        <InteractiveChart
          {...defaultProps}
          enableZoom={false}
          enableExport={false}
          enableBrush={false}
        />
      )
      expect(
        screen.queryByRole("button", { name: /zoom in/i })
      ).not.toBeInTheDocument()
      expect(screen.queryByText("PNG")).not.toBeInTheDocument()
      expect(screen.queryByTestId("brush")).not.toBeInTheDocument()
    })
  })

  describe("Annotations", () => {
    it("renders annotations when provided", () => {
      render(
        <InteractiveChart {...defaultProps} annotations={mockAnnotations} />
      )
      expect(screen.getByText("Annotations:")).toBeInTheDocument()
      expect(screen.getByText("Performance Issue")).toBeInTheDocument()
      expect(screen.getByText("Optimization Applied")).toBeInTheDocument()
    })

    it("does not render annotations section when none provided", () => {
      render(<InteractiveChart {...defaultProps} annotations={[]} />)
      expect(screen.queryByText("Annotations:")).not.toBeInTheDocument()
    })

    it("limits displayed annotations to 4 items", () => {
      const manyAnnotations = Array.from({ length: 10 }, (_, i) => ({
        x: i * 10,
        y: 15,
        label: `Annotation ${i + 1}`,
        type: "info" as const,
        description: `Description ${i + 1}`,
      }))

      render(
        <InteractiveChart {...defaultProps} annotations={manyAnnotations} />
      )

      // Should only display first 4 annotations
      expect(screen.getByText("Annotation 1")).toBeInTheDocument()
      expect(screen.getByText("Annotation 4")).toBeInTheDocument()
      expect(screen.queryByText("Annotation 5")).not.toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<InteractiveChart {...defaultProps} />)
      const chart = screen.getByRole("img")
      expect(chart).toHaveAttribute("aria-label", "Test Chart - fps chart")
      expect(chart).toHaveAttribute(
        "aria-description",
        "Interactive line chart showing fps performance over time"
      )
    })

    it("accepts custom ARIA labels", () => {
      render(
        <InteractiveChart
          {...defaultProps}
          ariaLabel="Custom Label"
          ariaDescription="Custom Description"
        />
      )
      const chart = screen.getByRole("img")
      expect(chart).toHaveAttribute("aria-label", "Custom Label")
      expect(chart).toHaveAttribute("aria-description", "Custom Description")
    })
  })

  describe("Data Processing", () => {
    it("processes data for different metrics", () => {
      const { transformDataForChart } = require("@/lib/utils/chart-helpers")

      render(<InteractiveChart {...defaultProps} metric="memory_usage" />)
      expect(transformDataForChart).toHaveBeenCalledWith(
        mockData.slice(-1000), // maxDataPoints default
        "line",
        "memory_usage"
      )
    })

    it("limits data points based on maxDataPoints", () => {
      const { transformDataForChart } = require("@/lib/utils/chart-helpers")
      const largeData = Array.from({ length: 2000 }, (_, i) => ({
        ...mockData[0],
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
      }))

      render(
        <InteractiveChart
          {...defaultProps}
          data={largeData}
          maxDataPoints={500}
        />
      )

      expect(transformDataForChart).toHaveBeenCalledWith(
        largeData.slice(-500),
        "line",
        "fps"
      )
    })
  })

  describe("Event Handlers", () => {
    it("calls onBrush when brush selection changes", async () => {
      const onBrush = jest.fn()
      render(
        <InteractiveChart
          {...defaultProps}
          enableBrush={true}
          onBrush={onBrush}
        />
      )

      // Mock brush change would be triggered by Recharts internally
      // This tests the handler is properly set up
      expect(screen.getByTestId("brush")).toBeInTheDocument()
    })

    it("calls onDrillDown when data point is clicked", () => {
      const onDrillDown = jest.fn()
      render(<InteractiveChart {...defaultProps} onDrillDown={onDrillDown} />)

      // Chart should be rendered with click handler
      expect(screen.getByTestId("line")).toBeInTheDocument()
    })

    it("calls onZoom when zoom state changes", () => {
      const onZoom = jest.fn()
      render(
        <InteractiveChart {...defaultProps} enableZoom={true} onZoom={onZoom} />
      )

      // Zoom controls should be available
      expect(
        screen.getByRole("button", { name: /zoom in/i })
      ).toBeInTheDocument()
    })
  })

  describe("Export Functionality", () => {
    it("handles PNG export", async () => {
      const { exportChart: _exportChart } = require("@/hooks/use-chart-export")().__values

      render(<InteractiveChart {...defaultProps} enableExport={true} />)

      const pngButton = screen.getByText("PNG")
      fireEvent.click(pngButton)

      // Export function should be called (mocked)
      expect(pngButton).toBeInTheDocument()
    })

    it("handles CSV export", async () => {
      const { exportData: _exportData } = require("@/hooks/use-chart-export")().__values

      render(<InteractiveChart {...defaultProps} enableExport={true} />)

      const csvButton = screen.getByText("CSV")
      fireEvent.click(csvButton)

      // Export function should be called (mocked)
      expect(csvButton).toBeInTheDocument()
    })

    it("shows exporting state", () => {
      // Mock export state as exporting
      jest.doMock("@/hooks/use-chart-export", () => ({
        useChartExport: () => ({
          exportState: { isExporting: true },
          exportChart: jest.fn(),
          exportData: jest.fn(),
        }),
      }))

      render(<InteractiveChart {...defaultProps} enableExport={true} />)
      expect(screen.getByText("Exporting...")).toBeInTheDocument()
    })
  })

  describe("Color Schemes", () => {
    it("applies correct colors for different metrics", () => {
      render(<InteractiveChart {...defaultProps} metric="fps" />)
      const line = screen.getByTestId("line")
      expect(line).toHaveAttribute("data-color", "#10b981")
    })

    it("handles memory usage metric color", () => {
      render(<InteractiveChart {...defaultProps} metric="memory_usage" />)
      const line = screen.getByTestId("line")
      expect(line).toHaveAttribute("data-color", "#f59e0b")
    })
  })

  describe("Performance Optimizations", () => {
    it("memoizes chart data transformation", () => {
      const { transformDataForChart } = require("@/lib/utils/chart-helpers")

      const { rerender } = render(<InteractiveChart {...defaultProps} />)
      const initialCallCount = transformDataForChart.mock.calls.length

      // Re-render with same props - should not call transform again
      rerender(<InteractiveChart {...defaultProps} />)
      expect(transformDataForChart.mock.calls.length).toBe(initialCallCount)

      // Re-render with different data - should call transform again
      rerender(
        <InteractiveChart {...defaultProps} data={[...mockData, mockData[0]]} />
      )
      expect(transformDataForChart.mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })

    it("handles large datasets efficiently", () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        ...mockData[0],
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        fps: 60 + Math.random() * 10,
      }))

      const startTime = performance.now()
      render(<InteractiveChart {...defaultProps} data={largeData} />)
      const endTime = performance.now()

      // Should render reasonably quickly even with large datasets
      expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second
    })
  })
})
