import { MetricsTrend } from "@/lib/performance-data"
import { CSS_VARIABLES, CHART_COLORS } from "@/constants/ui/colors"

// Chart annotation types
export interface ChartAnnotation {
  x: number | string
  y: number
  label: string
  type: "warning" | "error" | "info" | "success"
  description?: string
  icon?: string
}

// Chart data point with enhanced metadata
export interface ChartDataPoint extends MetricsTrend {
  index: number
  timestamp_formatted: string
  timestamp_short: string
  performance_tier: string
  color: string
  anomaly?: {
    severity: "low" | "medium" | "high"
    description: string
  }
}

// Chart configuration types
export type ChartType = "line" | "area" | "bar" | "scatter"
export type ChartMetric = "fps" | "memory_usage" | "cpu_usage" | "load_time"

// Brush selection interface
export interface BrushSelection {
  startIndex: number
  endIndex: number
  startTime?: Date
  endTime?: Date
}

// Zoom state interface
export interface ZoomState {
  startX: number | null
  endX: number | null
  isZoomed: boolean
  scale: number
}

// Chart theme configuration
export interface ChartTheme {
  background: string
  foreground: string
  muted: string
  accent: string
  grid: string
  text: string
  colors: {
    primary: Record<ChartMetric, string>
    secondary: Record<ChartMetric, string>
    gradient: Record<ChartMetric, [string, string]>
    categorical: string[]
  }
}

// Chart axis configuration
export interface ChartAxis {
  show: boolean
  label?: string
  tickCount?: number
  format?: string | ((value: any) => string)
  domain?: [number, number] | ["auto", "auto"]
  scale?: "linear" | "log" | "time"
}

// Chart legend configuration
export interface ChartLegend {
  show: boolean
  position: "top" | "bottom" | "left" | "right"
  align: "start" | "center" | "end"
  layout: "horizontal" | "vertical"
}

// Chart tooltip configuration
export interface ChartTooltip {
  show: boolean
  trigger: "hover" | "click" | "none"
  format?: string | ((data: any) => string)
  includeMetadata?: boolean
}

// Chart grid configuration
export interface ChartGrid {
  horizontal: boolean
  vertical: boolean
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
}

// Chart export options
export interface ExportOptions {
  filename?: string
  format: "png" | "svg" | "csv" | "json"
  width?: number
  height?: number
  includeMetadata?: boolean
  compression?: number
}

// Animation configuration
export interface ChartAnimation {
  enabled: boolean
  duration: number
  easing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear"
}

// Chart responsiveness configuration
export interface ChartResponsive {
  enabled: boolean
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  adaptations: {
    mobile: Partial<InteractiveChartConfig>
    tablet: Partial<InteractiveChartConfig>
    desktop: Partial<InteractiveChartConfig>
  }
}

// Comprehensive chart configuration
export interface InteractiveChartConfig {
  // Data and display
  chartType: ChartType
  metric: ChartMetric
  title: string
  subtitle?: string
  height: number
  width?: number

  // Features
  enableBrush: boolean
  enableZoom: boolean
  enableExport: boolean
  enableRealtime: boolean
  enableAnomalyDetection: boolean

  // Visual configuration
  theme: Partial<ChartTheme>
  xAxis: Partial<ChartAxis>
  yAxis: Partial<ChartAxis>
  legend: Partial<ChartLegend>
  tooltip: Partial<ChartTooltip>
  grid: Partial<ChartGrid>
  animation: Partial<ChartAnimation>

  // Responsiveness
  responsive: Partial<ChartResponsive>

  // Data processing
  smoothing: {
    enabled: boolean
    windowSize: number
  }
  aggregation: {
    enabled: boolean
    interval: "minute" | "hour" | "day"
  }

  // Performance
  maxDataPoints: number
  updateInterval: number
  virtualization: {
    enabled: boolean
    overscan: number
  }
}

// Main chart component props interface
export interface InteractiveChartProps {
  // Required props
  data: MetricsTrend[]
  metric: ChartMetric
  chartType: ChartType
  title: string

  // Optional configuration
  height?: number
  width?: number
  config?: Partial<InteractiveChartConfig>

  // Feature toggles
  enableBrush?: boolean
  enableZoom?: boolean
  enableExport?: boolean
  enableRealtime?: boolean
  enableAnomalyDetection?: boolean

  // Data and annotations
  annotations?: ChartAnnotation[]
  maxDataPoints?: number

  // Event handlers
  onBrush?: (selection: BrushSelection | null) => void
  onZoom?: (zoomState: ZoomState) => void
  onDrillDown?: (dataPoint: ChartDataPoint) => void
  onExport?: (format: string, filename: string) => void
  onDataUpdate?: (data: MetricsTrend[]) => void

  // Styling
  className?: string
  style?: React.CSSProperties

  // Accessibility
  ariaLabel?: string
  ariaDescription?: string
}

// Chart toolbar configuration
export interface ChartToolbar {
  show: boolean
  position: "top" | "bottom"
  tools: {
    zoom: boolean
    pan: boolean
    reset: boolean
    export: boolean
    fullscreen: boolean
    settings: boolean
  }
}

// Real-time data streaming interface
export interface ChartDataStream {
  enabled: boolean
  interval: number
  maxBuffer: number
  autoScroll: boolean
  pauseOnHover: boolean
}

// Performance monitoring for charts
export interface ChartPerformance {
  renderTime: number
  dataPoints: number
  updateFrequency: number
  memoryUsage: number
  lastUpdate: Date
}

// Chart error handling
export interface ChartError {
  type: "data" | "render" | "export" | "network"
  message: string
  timestamp: Date
  recoverable: boolean
}

// Chart accessibility features
export interface ChartAccessibility {
  keyboardNavigation: boolean
  screenReaderSupport: boolean
  highContrast: boolean
  reduceMotion: boolean
  focusIndicators: boolean
  ariaLabels: {
    chart: string
    dataPoint: string
    toolbar: string
    legend: string
  }
}

// Chart state management
export interface ChartState {
  isLoading: boolean
  hasError: boolean
  error?: ChartError
  data: ChartDataPoint[]
  filteredData: ChartDataPoint[]
  brushSelection: BrushSelection | null
  zoomState: ZoomState
  annotations: ChartAnnotation[]
  performance: ChartPerformance
}

// Chart context for managing shared state
export interface ChartContextValue {
  state: ChartState
  config: InteractiveChartConfig
  actions: {
    updateData: (data: MetricsTrend[]) => void
    setBrushSelection: (selection: BrushSelection | null) => void
    setZoomState: (state: ZoomState) => void
    addAnnotation: (annotation: ChartAnnotation) => void
    removeAnnotation: (index: number) => void
    exportChart: (options: ExportOptions) => Promise<void>
    resetChart: () => void
  }
}

// Default configurations
export const defaultChartConfig: InteractiveChartConfig = {
  chartType: "line",
  metric: "fps",
  title: "Performance Chart",
  height: 400,
  enableBrush: true,
  enableZoom: true,
  enableExport: true,
  enableRealtime: false,
  enableAnomalyDetection: true,
  theme: {
    background: "transparent",
    foreground: CSS_VARIABLES.FOREGROUND,
    muted: CSS_VARIABLES.MUTED,
    accent: "hsl(var(--accent))", // keeping original as not in constants
    grid: "hsl(var(--border))", // keeping original as not in constants
    text: CSS_VARIABLES.FOREGROUND,
    colors: {
      primary: {
        fps: "#10b981",
        memory_usage: "#f59e0b",
        cpu_usage: "#ef4444",
        load_time: "#3b82f6",
      },
      secondary: {
        fps: "#059669",
        memory_usage: "#d97706",
        cpu_usage: "#dc2626",
        load_time: "#2563eb",
      },
      gradient: {
        fps: ["#10b981", "#065f46"],
        memory_usage: ["#f59e0b", "#92400e"],
        cpu_usage: ["#ef4444", "#991b1b"],
        load_time: ["#3b82f6", "#1e40af"],
      },
      categorical: [
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#3b82f6",
        "#8b5cf6",
        "#06b6d4",
        "#f97316",
        "#84cc16",
      ],
    },
  },
  xAxis: {
    show: true,
    tickCount: 5,
    scale: "time",
  },
  yAxis: {
    show: true,
    tickCount: 5,
    scale: "linear",
    domain: ["auto", "auto"],
  },
  legend: {
    show: true,
    position: "bottom",
    align: "center",
    layout: "horizontal",
  },
  tooltip: {
    show: true,
    trigger: "hover",
    includeMetadata: true,
  },
  grid: {
    horizontal: true,
    vertical: false,
    stroke: "hsl(var(--border))",
    strokeWidth: 1,
  },
  animation: {
    enabled: true,
    duration: 300,
    easing: "ease-out",
  },
  responsive: {
    enabled: true,
    breakpoints: {
      mobile: 640,
      tablet: 1024,
      desktop: 1280,
    },
    adaptations: {
      mobile: {
        height: 300,
        legend: { position: "bottom", layout: "horizontal" },
        xAxis: { tickCount: 3 },
        yAxis: { tickCount: 4 },
      },
      tablet: {
        height: 350,
        legend: { position: "bottom", layout: "horizontal" },
        xAxis: { tickCount: 5 },
        yAxis: { tickCount: 5 },
      },
      desktop: {
        height: 400,
        legend: { position: "bottom", layout: "horizontal" },
        xAxis: { tickCount: 7 },
        yAxis: { tickCount: 6 },
      },
    },
  },
  smoothing: {
    enabled: false,
    windowSize: 5,
  },
  aggregation: {
    enabled: false,
    interval: "minute",
  },
  maxDataPoints: 1000,
  updateInterval: 5000,
  virtualization: {
    enabled: false,
    overscan: 10,
  },
}
