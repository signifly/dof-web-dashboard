// Export all chart components for easy importing
export { InteractiveChart } from "./interactive-chart"
export { MultiSeriesChart } from "./multi-series-chart"
export { MetricCard } from "./metric-card"
export { PerformanceChart } from "./performance-chart"
export { PerformanceBarChart } from "./performance-bar-chart"
export { PerformanceLineChart } from "./performance-line-chart"
export { PerformanceOverviewChart } from "./performance-overview-chart"

// Export chart types and utilities
export type {
  InteractiveChartProps,
  ChartDataPoint,
  ChartAnnotation,
  ChartType,
  ChartMetric,
  BrushSelection,
  ZoomState,
  ExportOptions,
  InteractiveChartConfig,
} from "@/types/chart"

// Export chart helpers
export {
  chartColorSchemes,
  performanceThresholds,
  getPerformanceColor,
  getPerformanceTier,
  transformDataForChart,
  formatTimestamp,
  calculateChartDomain,
  getOptimalTickCount,
  generatePerformanceAnnotations,
  aggregateDataByInterval,
  convertToCSV,
  convertToJSON,
  calculateMovingAverage,
  detectAnomalies,
} from "@/lib/utils/chart-helpers"

// Export custom hooks
export { useChartZoom } from "@/hooks/use-chart-zoom"
export { useChartBrush } from "@/hooks/use-chart-brush"
export { useChartExport } from "@/hooks/use-chart-export"
