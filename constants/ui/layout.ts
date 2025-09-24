/**
 * UI Layout - Spacing, breakpoints, and layout constants
 *
 * These constants define layout-related values used throughout the application.
 */

// Spacing constants (in pixels)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const

// Breakpoint constants (in pixels)
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const

// Grid constants
export const GRID = {
  COLUMNS: 12,
  GAP: 16,
  CONTAINER_MAX_WIDTH: 1200,
} as const

export type Spacing = typeof SPACING
export type Breakpoints = typeof BREAKPOINTS
export type Grid = typeof GRID
