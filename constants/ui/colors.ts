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

  // Darker versions for hover/secondary states
  PRIMARY_DARK: "#059669", // green-600
  SECONDARY_DARK: "#2563eb", // blue-600
  WARNING_DARK: "#d97706", // amber-600
  DANGER_DARK: "#dc2626", // red-600
  INFO_DARK: "#4b5563", // gray-600

  // Darkest versions for gradients
  PRIMARY_DARKEST: "#065f46", // green-800
  SECONDARY_DARKEST: "#1e40af", // blue-800
  WARNING_DARKEST: "#92400e", // amber-800
  DANGER_DARKEST: "#991b1b", // red-800
  INFO_DARKEST: "#1f2937", // gray-800
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
