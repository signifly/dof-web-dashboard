/**
 * Data Formats - Formatting constants for dates, numbers, and currency
 *
 * These constants define formatting patterns and locale settings
 * used throughout the application for consistent data presentation.
 */

// Date format patterns
export const DATE_FORMATS = {
  SHORT_DATE: "MM/dd/yyyy", // 12/31/2023
  LONG_DATE: "MMMM d, yyyy", // December 31, 2023
  DATE_TIME: "MM/dd/yyyy HH:mm:ss", // 12/31/2023 14:30:15
  TIME_ONLY: "HH:mm:ss", // 14:30:15
  ISO_DATE: "yyyy-MM-dd", // 2023-12-31
} as const

// Number formatting
export const NUMBER_FORMATS = {
  DECIMAL_PLACES: 2, // Default decimal places
  PERCENTAGE_DECIMALS: 1, // Decimal places for percentages
  LARGE_NUMBER_THRESHOLD: 1000, // Threshold for K/M/B notation
  CURRENCY_DECIMALS: 2, // Decimal places for currency
} as const

// Units and suffixes
export const UNITS = {
  BYTES: ["B", "KB", "MB", "GB", "TB"] as const,
  NUMBERS: ["", "K", "M", "B", "T"] as const,
  TIME: ["ms", "s", "min", "hr", "day"] as const,
} as const

// Locale settings
export const LOCALES = {
  DEFAULT: "en-US",
  DATE_LOCALE: "en-US",
  NUMBER_LOCALE: "en-US",
  CURRENCY_LOCALE: "en-US",
  TIMEZONE: "America/New_York",
} as const

export type DateFormats = typeof DATE_FORMATS
export type NumberFormats = typeof NUMBER_FORMATS
export type Units = typeof UNITS
export type Locales = typeof LOCALES
