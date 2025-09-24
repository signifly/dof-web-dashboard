/**
 * UI Colors - Chart colors, status indicators, and theme colors
 *
 * These constants define color schemes used throughout the application
 * for charts, status indicators, and UI theming.
 */

// Chart color schemes
export const CHART_COLORS = {
  PRIMARY: "#10b981", // Green for positive metrics
  SECONDARY: "#3b82f6", // Blue for neutral metrics
  WARNING: "#f59e0b", // Yellow for warning states
  DANGER: "#ef4444", // Red for error/critical states
  INFO: "#6b7280", // Gray for informational
} as const

// Status indicator colors
export const STATUS_COLORS = {
  EXCELLENT: "#10b981", // Green
  GOOD: "#3b82f6", // Blue
  FAIR: "#f59e0b", // Yellow
  POOR: "#ef4444", // Red
} as const

// CSS color variables (for compatibility with existing code)
export const CSS_VARIABLES = {
  FOREGROUND: "hsl(var(--foreground))",
  BACKGROUND: "hsl(var(--background))",
  PRIMARY: "hsl(var(--primary))",
  SECONDARY: "hsl(var(--secondary))",
  MUTED: "hsl(var(--muted))",
} as const

export type ChartColors = typeof CHART_COLORS
export type StatusColors = typeof STATUS_COLORS
export type CssVariables = typeof CSS_VARIABLES
