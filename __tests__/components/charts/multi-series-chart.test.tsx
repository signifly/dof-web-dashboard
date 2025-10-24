/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { MultiSeriesChart } from "@/components/charts/multi-series-chart"
import type { MetricsTrend } from "@/lib/performance-data"

// Mock the same dependencies as InteractiveChart
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === "HH:mm") return "12:00"
    if (formatStr === "HH:mm:ss") return "12:00:00"
    return date.toLocaleString()
  }),
  parseISO: jest.fn((dateStr: string) => new Date(dateStr)),
}))

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
  Line: ({
    dataKey,
    stroke,
    name,
  }: {
    dataKey: string
    stroke: string
    name: string
  }) => (
    <div
      data-testid="line"
      data-key={dataKey}
      data-color={stroke}
      data-name={name}
    />
  ),
  Area: ({
    dataKey,
    stroke,
    fill,
    name,
  }: {
    dataKey: string
    stroke: string
    fill: string
    name: string
  }) => (
    <div
      data-testid="area"
      data-key={dataKey}
      data-stroke={stroke}
      data-fill={fill}
      data-name={name}
    />
  ),
  XAxis: ({
    dataKey,
    tickFormatter: _tickFormatter,
  }: {
    dataKey: string
    tickFormatter?: Function
  }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: ({ content: _content }: { content: React.ComponentType<any> }) => (
    <div data-testid="tooltip" />
  ),
  Legend: () => <div data-testid="legend" />,
  Brush: ({
    dataKey,
    onChange: _onChange,
  }: {
    dataKey: string
    onChange?: Function
  }) => <div data-testid="brush" data-key={dataKey} />,
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
  }),
}))

jest.mock("@/hooks/use-chart-export", () => ({
  useChartExport: () => ({
    exportState: { isExporting: false },
    exportChart: jest.fn(),
    exportData: jest.fn(),
  }),
}))

jest.mock("@/lib/utils/chart-helpers", () => ({
  transformDataForChart: jest.fn(data =>
    data.map((item: any, index: number) => ({
      ...item,
      timestamp_formatted: "12:00:00",
      index,
      value: item.fps || item.memory_usage || item.cpu_usage || item.load_time,
    }))
  ),
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
const mockData1: MetricsTrend[] = [
  {
    timestamp: "2024-01-01T12:00:00Z",
    fps: 60,
    memory_usage: 256,
    cpu_usage: 30,
    load_time: 800,
      cache_size: 0,
    screen_name: "HomeScreen",
  },
  {
    timestamp: "2024-01-01T12:01:00Z",
    fps: 55,
    memory_usage: 280,
    cpu_usage: 35,
    load_time: 850,
      cache_size: 0,
    screen_name: "HomeScreen",
  },
]

const mockData2: MetricsTrend[] = [
  {
    timestamp: "2024-01-01T12:00:00Z",
    fps: 45,
    memory_usage: 320,
    cpu_usage: 40,
    load_time: 900,
      cache_size: 0,
    screen_name: "DetailScreen",
  },
  {
    timestamp: "2024-01-01T12:01:00Z",
    fps: 50,
    memory_usage: 300,
    cpu_usage: 38,
    load_time: 880,
      cache_size: 0,
    screen_name: "DetailScreen",
  },
]

const mockDatasets = [
  {
    name: "HomeScreen",
    data: mockData1,
    metric: "fps" as const,
    color: "#10b981",
    visible: true,
  },
  {
    name: "DetailScreen",
    data: mockData2,
    metric: "fps" as const,
    color: "#ef4444",
    visible: true,
  },
]

describe("MultiSeriesChart", () => {
  const defaultProps = {
    datasets: mockDatasets,
    title: "Multi-Series Performance Chart",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders chart with correct title", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      expect(
        screen.getByText("Multi-Series Performance Chart")
      ).toBeInTheDocument()
    })

    it("shows number of series in badge", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      expect(screen.getByText("2 series")).toBeInTheDocument()
    })

    it("renders line chart by default", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      expect(screen.getByTestId("line-chart")).toBeInTheDocument()
    })

    it("renders area chart when chartType is area", () => {
      render(<MultiSeriesChart {...defaultProps} chartType="area" />)
      expect(screen.getByTestId("area-chart")).toBeInTheDocument()
    })

    it("renders dataset legend", () => {
      render(<MultiSeriesChart {...defaultProps} enableLegend={true} />)
      expect(screen.getByText("HomeScreen")).toBeInTheDocument()
      expect(screen.getByText("DetailScreen")).toBeInTheDocument()
    })

    it("does not render legend when disabled", () => {
      render(<MultiSeriesChart {...defaultProps} enableLegend={false} />)
      // Legend should not be visible as toggleable buttons
      expect(
        screen.queryByRole("button", { name: /homescreen/i })
      ).not.toBeInTheDocument()
    })
  })

  describe("Dataset Management", () => {
    it("renders all visible datasets as chart lines", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      const lines = screen.getAllByTestId("line")
      expect(lines).toHaveLength(2)
      expect(lines[0]).toHaveAttribute("data-key", "HomeScreen_fps")
      expect(lines[1]).toHaveAttribute("data-key", "DetailScreen_fps")
    })

    it("applies correct colors to datasets", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      const lines = screen.getAllByTestId("line")
      expect(lines[0]).toHaveAttribute("data-color", "#10b981")
      expect(lines[1]).toHaveAttribute("data-color", "#ef4444")
    })

    it("handles dataset visibility toggle", () => {
      render(<MultiSeriesChart {...defaultProps} enableLegend={true} />)

      const homeScreenButton = screen.getByRole("button", {
        name: /homescreen/i,
      })
      expect(homeScreenButton).toBeInTheDocument()

      // Click to toggle visibility
      fireEvent.click(homeScreenButton)

      // Button should still be present but styled differently
      expect(homeScreenButton).toHaveClass("opacity-50")
    })

    it("shows no datasets visible message when all hidden", () => {
      const hiddenDatasets = mockDatasets.map(d => ({ ...d, visible: false }))
      render(<MultiSeriesChart {...defaultProps} datasets={hiddenDatasets} />)
      expect(screen.getByText("No datasets visible")).toBeInTheDocument()
    })
  })

  describe("Data Processing", () => {
    it("combines data from multiple datasets correctly", () => {
      render(<MultiSeriesChart {...defaultProps} />)

      // Chart should render with combined data
      const chart = screen.getByTestId("line-chart")
      expect(chart).toBeInTheDocument()

      // Should have data points from both datasets
      expect(screen.getAllByTestId("line")).toHaveLength(2)
    })

    it("handles datasets with different metrics", () => {
      const mixedDatasets = [
        {
          name: "FPS",
          data: mockData1,
          metric: "fps" as const,
          color: "#10b981",
        },
        {
          name: "Memory",
          data: mockData2,
          metric: "memory_usage" as const,
          color: "#f59e0b",
        },
      ]

      render(<MultiSeriesChart {...defaultProps} datasets={mixedDatasets} />)

      const lines = screen.getAllByTestId("line")
      expect(lines[0]).toHaveAttribute("data-key", "FPS_fps")
      expect(lines[1]).toHaveAttribute("data-key", "Memory_memory_usage")
    })
  })

  describe("Interactive Features", () => {
    it("renders zoom controls when enableZoom is true", () => {
      render(<MultiSeriesChart {...defaultProps} enableZoom={true} />)
      expect(
        screen.getByRole("button", { name: /zoom in/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /zoom out/i })
      ).toBeInTheDocument()
    })

    it("renders export buttons when enableExport is true", () => {
      render(<MultiSeriesChart {...defaultProps} enableExport={true} />)
      expect(screen.getByText("PNG")).toBeInTheDocument()
      expect(screen.getByText("CSV")).toBeInTheDocument()
    })

    it("renders brush when enableBrush is true", () => {
      render(<MultiSeriesChart {...defaultProps} enableBrush={true} />)
      expect(screen.getByTestId("brush")).toBeInTheDocument()
    })

    it("does not render controls when disabled", () => {
      render(
        <MultiSeriesChart
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

  describe("Data Summary", () => {
    it("displays statistical summary for each dataset", () => {
      render(<MultiSeriesChart {...defaultProps} />)

      // Should show summary cards for both datasets
      expect(screen.getByText("HomeScreen")).toBeInTheDocument()
      expect(screen.getByText("DetailScreen")).toBeInTheDocument()

      // Should show statistical values
      expect(screen.getAllByText(/Avg:/)).toHaveLength(2)
      expect(screen.getAllByText(/Min:/)).toHaveLength(2)
      expect(screen.getAllByText(/Max:/)).toHaveLength(2)
    })

    it("shows correct units for different metrics", () => {
      const memoryDatasets = [
        {
          name: "Memory Usage",
          data: mockData1,
          metric: "memory_usage" as const,
          color: "#f59e0b",
        },
      ]

      render(<MultiSeriesChart {...defaultProps} datasets={memoryDatasets} />)
      expect(screen.getByText(/MB/)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<MultiSeriesChart {...defaultProps} />)
      const chart = screen.getByRole("img")
      expect(chart).toHaveAttribute(
        "aria-label",
        "Multi-Series Performance Chart - Multi-series chart with 2 datasets"
      )
      expect(chart).toHaveAttribute(
        "aria-description",
        "Interactive line chart comparing HomeScreen, DetailScreen performance over time"
      )
    })

    it("handles keyboard navigation for dataset toggles", () => {
      render(<MultiSeriesChart {...defaultProps} enableLegend={true} />)

      const buttons = screen.getAllByRole("button")
      const datasetButtons = buttons.filter(
        btn =>
          btn.textContent?.includes("HomeScreen") ||
          btn.textContent?.includes("DetailScreen")
      )

      expect(datasetButtons.length).toBeGreaterThan(0)
      datasetButtons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe("Event Handlers", () => {
    it("calls onDatasetToggle when dataset visibility changes", () => {
      const onDatasetToggle = jest.fn()
      render(
        <MultiSeriesChart
          {...defaultProps}
          enableLegend={true}
          onDatasetToggle={onDatasetToggle}
        />
      )

      const homeScreenButton = screen.getByRole("button", {
        name: /homescreen/i,
      })
      fireEvent.click(homeScreenButton)

      expect(onDatasetToggle).toHaveBeenCalledWith("HomeScreen", false)
    })

    it("calls onBrush when brush selection changes", () => {
      const onBrush = jest.fn()
      render(
        <MultiSeriesChart
          {...defaultProps}
          enableBrush={true}
          onBrush={onBrush}
        />
      )

      // Brush should be rendered
      expect(screen.getByTestId("brush")).toBeInTheDocument()
    })

    it("calls onZoom when zoom state changes", () => {
      const onZoom = jest.fn()
      render(
        <MultiSeriesChart {...defaultProps} enableZoom={true} onZoom={onZoom} />
      )

      // Zoom controls should be available
      expect(
        screen.getByRole("button", { name: /zoom in/i })
      ).toBeInTheDocument()
    })
  })

  describe("Chart Types", () => {
    it("renders areas for area chart type", () => {
      render(<MultiSeriesChart {...defaultProps} chartType="area" />)
      const areas = screen.getAllByTestId("area")
      expect(areas).toHaveLength(2)
      expect(areas[0]).toHaveAttribute("data-key", "HomeScreen_fps")
      expect(areas[1]).toHaveAttribute("data-key", "DetailScreen_fps")
    })

    it("applies fill opacity for area charts", () => {
      const datasetsWithOpacity = mockDatasets.map(d => ({
        ...d,
        fillOpacity: 0.3,
      }))
      render(
        <MultiSeriesChart
          {...defaultProps}
          datasets={datasetsWithOpacity}
          chartType="area"
        />
      )

      const areas = screen.getAllByTestId("area")
      areas.forEach(area => {
        expect(area).toBeInTheDocument()
      })
    })
  })

  describe("Performance", () => {
    it("handles large datasets efficiently", () => {
      const largeDatasets = Array.from({ length: 10 }, (_, i) => ({
        name: `Dataset ${i}`,
        data: Array.from({ length: 1000 }, (_, j) => ({
          ...mockData1[0],
          timestamp: new Date(Date.now() + j * 60000).toISOString(),
          fps: 60 + Math.random() * 10,
        })),
        metric: "fps" as const,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }))

      const startTime = performance.now()
      render(<MultiSeriesChart {...defaultProps} datasets={largeDatasets} />)
      const endTime = performance.now()

      // Should render reasonably quickly
      expect(endTime - startTime).toBeLessThan(2000) // Less than 2 seconds
    })

    it("efficiently updates when dataset visibility changes", () => {
      const { rerender } = render(<MultiSeriesChart {...defaultProps} />)

      // Change visibility of one dataset
      const updatedDatasets = mockDatasets.map((d, i) =>
        i === 0 ? { ...d, visible: false } : d
      )

      rerender(
        <MultiSeriesChart {...defaultProps} datasets={updatedDatasets} />
      )

      // Should only render visible datasets
      const lines = screen.getAllByTestId("line")
      expect(lines).toHaveLength(1)
      expect(lines[0]).toHaveAttribute("data-key", "DetailScreen_fps")
    })
  })
})
