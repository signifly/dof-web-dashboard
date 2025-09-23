# Interactive Charts Foundation

A comprehensive interactive charting foundation for the DOF Web Dashboard built with Next.js 14, TypeScript, and Recharts.

## Overview

This charting foundation provides production-ready interactive chart components with advanced features like zooming, brushing, real-time data updates, anomaly detection, and multiple export formats.

## Features

### ✨ Interactive Capabilities

- **Zoom & Pan**: Interactive zoom controls with toolbar and mouse interactions
- **Brush Selection**: Time-series range selection for filtering data
- **Real-time Updates**: Live data streaming support with configurable intervals
- **Drill Down**: Click events for detailed data exploration

### 📊 Chart Types

- **Line Charts**: Smooth time-series visualization
- **Area Charts**: Filled line charts with gradients
- **Bar Charts**: Categorical and time-series bar visualization
- **Scatter Plots**: Point-based data visualization

### 🎯 Performance Features

- **Anomaly Detection**: Automatic identification of performance outliers
- **Performance Annotations**: Contextual markers for important events
- **Data Aggregation**: Time-based grouping (minute, hour, day)
- **Moving Averages**: Smoothed trend lines

### 📤 Export Options

- **PNG/SVG**: High-quality image exports
- **CSV/JSON**: Raw data exports with metadata
- **Configurable Quality**: Customizable compression and dimensions

### ♿ Accessibility

- **Screen Reader Support**: Comprehensive ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Accessible color schemes
- **Reduced Motion**: Respects user preferences

## Architecture

```
components/charts/
├── index.ts                    # Main exports
├── interactive-chart.tsx       # Core chart component
├── chart-examples.tsx          # Demo and testing component
├── chart-test-example.tsx      # Simple test component
└── README.md                   # This documentation

hooks/
├── use-chart-zoom.ts          # Zoom and pan state management
├── use-chart-brush.ts         # Time-series brushing/selection
└── use-chart-export.ts        # Chart export utilities

lib/utils/
└── chart-helpers.ts           # Data transformation and utilities

types/
└── chart.ts                   # TypeScript definitions
```

## Quick Start

### Basic Usage

```tsx
import { InteractiveChart } from "@/components/charts"
import type { MetricsTrend } from "@/lib/performance-data"

const data: MetricsTrend[] = [
  {
    timestamp: "2024-01-01T12:00:00Z",
    fps: 45,
    memory_usage: 350,
    cpu_usage: 45,
    load_time: 1200,
    screen_name: "HomeScreen",
  },
  // ... more data points
]

export function MyChart() {
  return (
    <InteractiveChart
      data={data}
      metric="fps"
      chartType="line"
      title="FPS Performance"
      height={400}
      enableBrush={true}
      enableZoom={true}
      enableExport={true}
    />
  )
}
```

### Advanced Configuration

```tsx
import { InteractiveChart, ChartAnnotation } from "@/components/charts"

const annotations: ChartAnnotation[] = [
  {
    x: 50,
    y: 15,
    label: "Performance Drop",
    type: "error",
    description: "Significant FPS drop detected",
  },
]

export function AdvancedChart() {
  return (
    <InteractiveChart
      data={data}
      metric="memory_usage"
      chartType="area"
      title="Memory Usage Analysis"
      height={500}
      annotations={annotations}
      enableAnomalyDetection={true}
      onBrush={selection => console.log("Selected:", selection)}
      onZoom={zoomState => console.log("Zoom:", zoomState)}
      onDrillDown={dataPoint => console.log("Details:", dataPoint)}
      onExport={(format, filename) => console.log("Exported:", format)}
    />
  )
}
```

## Components

### InteractiveChart

The main chart component with comprehensive interactive features.

#### Props

```tsx
interface InteractiveChartProps {
  // Required
  data: MetricsTrend[]
  metric: "fps" | "memory_usage" | "cpu_usage" | "load_time"
  chartType: "line" | "area" | "bar" | "scatter"
  title: string

  // Optional
  height?: number
  width?: number
  enableBrush?: boolean
  enableZoom?: boolean
  enableExport?: boolean
  enableAnomalyDetection?: boolean
  annotations?: ChartAnnotation[]
  maxDataPoints?: number

  // Event handlers
  onBrush?: (selection: BrushSelection | null) => void
  onZoom?: (zoomState: ZoomState) => void
  onDrillDown?: (dataPoint: ChartDataPoint) => void
  onExport?: (format: string, filename: string) => void

  // Styling & accessibility
  className?: string
  ariaLabel?: string
  ariaDescription?: string
}
```

### ChartExamples

A comprehensive demo component showcasing all chart features.

```tsx
import { ChartExamples } from "@/components/charts/chart-examples"

export function DemoPage() {
  return <ChartExamples />
}
```

## Custom Hooks

### useChartZoom

Manages zoom and pan state for interactive charts.

```tsx
import { useChartZoom } from "@/hooks/use-chart-zoom"

const { zoomState, zoomHandlers, getVisibleData } = useChartZoom({
  onZoomChange: state => console.log("Zoom changed:", state),
})
```

### useChartBrush

Handles time-series brush selection for data filtering.

```tsx
import { useChartBrush } from "@/hooks/use-chart-brush"

const { brushState, brushHandlers, getSelectedData } = useChartBrush({
  onSelectionChange: selection => console.log("Selection:", selection),
})
```

### useChartExport

Provides chart and data export functionality.

```tsx
import { useChartExport } from "@/hooks/use-chart-export"

const { exportState, exportChart, exportData } = useChartExport({
  onExportComplete: (filename, format) => console.log("Exported:", filename),
})
```

## Utilities

### Chart Helpers

```tsx
import {
  transformDataForChart,
  getPerformanceColor,
  generatePerformanceAnnotations,
  calculateMovingAverage,
  detectAnomalies,
} from "@/lib/utils/chart-helpers"

// Transform data for visualization
const chartData = transformDataForChart(rawData, "line", "fps")

// Get performance-based colors
const color = getPerformanceColor("fps", 45) // Returns appropriate color

// Generate automatic annotations
const annotations = generatePerformanceAnnotations(data, "memory_usage")

// Calculate smoothed trends
const smoothed = calculateMovingAverage(values, 5)

// Detect performance anomalies
const anomalies = detectAnomalies(data, "cpu_usage")
```

## Data Format

### MetricsTrend Interface

```tsx
interface MetricsTrend {
  timestamp: string // ISO 8601 timestamp
  fps: number // Frames per second
  memory_usage: number // Memory usage in MB
  cpu_usage: number // CPU usage percentage
  load_time: number // Load time in milliseconds
  screen_name: string // Screen/page identifier
}
```

### Performance Thresholds

The system uses predefined performance thresholds for color coding:

- **FPS**: Excellent (50+), Good (30-50), Fair (20-30), Poor (<20)
- **Memory**: Excellent (<200MB), Good (200-400MB), Fair (400-600MB), Poor (600MB+)
- **CPU**: Excellent (<30%), Good (30-50%), Fair (50-70%), Poor (70%+)
- **Load Time**: Excellent (<500ms), Good (500-1000ms), Fair (1-2s), Poor (2s+)

## Styling

### Theme Integration

Charts automatically inherit from your Tailwind CSS theme:

```css
/* Chart colors use CSS variables */
--chart-fps: #10b981; /* green-500 */
--chart-memory: #f59e0b; /* amber-500 */
--chart-cpu: #ef4444; /* red-500 */
--chart-load-time: #3b82f6; /* blue-500 */
```

### Custom Styling

```tsx
<InteractiveChart
  className="border rounded-lg shadow-sm"
  style={{ backgroundColor: "var(--background)" }}
  // ... other props
/>
```

## Performance Considerations

### Data Optimization

- **Virtualization**: Automatically enabled for large datasets (1000+ points)
- **Data Limiting**: `maxDataPoints` prop prevents performance issues
- **Efficient Updates**: Memoized data transformations and calculations

### Memory Management

- **Automatic Cleanup**: Chart state is properly cleaned up on unmount
- **Debounced Updates**: Zoom and pan operations are debounced
- **Lazy Loading**: Chart data is loaded on demand

## Testing

### Unit Tests

```bash
npm test components/charts
```

### Integration Tests

```tsx
import { render, screen } from "@testing-library/react"
import { InteractiveChart } from "@/components/charts"

test("renders chart with data", () => {
  render(
    <InteractiveChart
      data={mockData}
      metric="fps"
      chartType="line"
      title="Test Chart"
    />
  )

  expect(screen.getByRole("img", { name: /test chart/i })).toBeInTheDocument()
})
```

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **Accessibility**: NVDA, JAWS, VoiceOver support

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new features
3. Include comprehensive tests for new functionality
4. Update documentation for API changes
5. Ensure accessibility compliance

## Troubleshooting

### Common Issues

**Chart not rendering**

- Ensure data array is not empty
- Check that timestamps are valid ISO 8601 strings
- Verify metric values are numbers

**Export not working**

- Check browser permissions for file downloads
- Ensure chart container is properly rendered
- Verify export format is supported

**Performance issues**

- Reduce `maxDataPoints` for large datasets
- Enable virtualization for long time series
- Consider data aggregation for historical data

### Debug Mode

```tsx
<InteractiveChart
  data={data}
  // ... props
  onDataUpdate={data => console.log("Data updated:", data)}
  onBrush={selection => console.log("Brush:", selection)}
  onZoom={state => console.log("Zoom:", state)}
/>
```

## License

Part of the DOF Web Dashboard project. See project LICENSE for details.
