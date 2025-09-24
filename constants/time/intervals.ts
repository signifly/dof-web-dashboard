/**
 * Time Intervals - Refresh and polling intervals
 *
 * These constants define various polling and refresh intervals used throughout
 * the application for data fetching and real-time updates.
 */

// Refresh intervals for different data types
export const REFRESH_INTERVALS = {
  ACTIVE_DATA: 30 * 1000, // 30 seconds for real-time data
  SUMMARY_DATA: 5 * 60 * 1000, // 5 minutes for summary data
  BACKGROUND_DATA: 10 * 60 * 1000, // 10 minutes when tab not active
  INTERACTIVE_DATA: 60 * 1000, // 1 minute when user is actively interacting
} as const

// Smart refresh configuration intervals
export const SMART_REFRESH_CONFIG = {
  DEFAULT_ACTIVE: 30000, // 30 seconds - default active refresh
  DEFAULT_SUMMARY: 300000, // 5 minutes - default summary refresh
  USER_INTERACTION_INTERVAL: 60000, // 1 minute during user interaction
  BACKGROUND_INTERVAL: 600000, // 10 minutes in background
} as const

// Dashboard-specific refresh intervals
export const DASHBOARD_INTERVALS = {
  METRICS_REFRESH: 30000, // 30 seconds for metrics dashboard
  DEVICE_STATUS_REFRESH: 15000, // 15 seconds for device status
  ALERTS_REFRESH: 60000, // 1 minute for alerts
  SUMMARY_REFRESH: 300000, // 5 minutes for summaries
} as const

// Data aggregation intervals
export const AGGREGATION_INTERVALS = {
  SESSION_AGGREGATION: 5000, // 5 seconds for session data aggregation
  METRICS_AGGREGATION: 10000, // 10 seconds for metrics aggregation
  PERFORMANCE_AGGREGATION: 30000, // 30 seconds for performance data
} as const

// Chart update intervals
export const CHART_UPDATE_INTERVALS = {
  REAL_TIME_CHARTS: 1000, // 1 second for real-time charts
  PERFORMANCE_CHARTS: 5000, // 5 seconds for performance charts
  SUMMARY_CHARTS: 30000, // 30 seconds for summary charts
} as const

export type RefreshIntervals = typeof REFRESH_INTERVALS
export type SmartRefreshConfig = typeof SMART_REFRESH_CONFIG
export type DashboardIntervals = typeof DASHBOARD_INTERVALS
export type AggregationIntervals = typeof AGGREGATION_INTERVALS
export type ChartUpdateIntervals = typeof CHART_UPDATE_INTERVALS