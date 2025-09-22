/**
 * TypeScript definitions for the Performance Alerting System
 * Generated for DOF Web Dashboard - Issue #2
 */

export type MetricType =
  | "cpu_usage"
  | "memory_usage"
  | "disk_space"
  | "response_time"
  | "error_rate"
  | "bundle_size"
  | "page_load_time"

export type AlertSeverity = "warning" | "critical" | "emergency"

export type AlertStatus = "active" | "acknowledged" | "resolved"

export type NotificationChannelType = "email" | "slack" | "webhook"

export interface AlertConfig {
  id: string
  name: string
  metric_type: MetricType
  threshold_warning: number
  threshold_critical: number
  notification_channels: string[] // Array of notification channel IDs
  suppression_rules?: SuppressionRule
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AlertInstance {
  id: string
  config_id: string
  severity: AlertSeverity
  metric_value: number
  threshold_violated: number
  message: string
  source: string
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  resolved_by?: string
  status: AlertStatus
  metadata?: Record<string, any>
  created_at: string
  // Optional joined data
  config?: AlertConfig
}

export interface NotificationChannel {
  id: string
  name: string
  type: NotificationChannelType
  configuration: NotificationChannelConfig
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PerformanceMetric {
  id: string
  metric_type: string
  value: number
  source: string
  metadata?: Record<string, any>
  recorded_at: string
}

export interface SuppressionRule {
  mute_duration_minutes?: number
  quiet_hours?: {
    start: string // HH:MM format
    end: string // HH:MM format
  }
  max_alerts_per_hour?: number
  escalation_delay_minutes?: number
}

// Notification channel configurations
export interface EmailChannelConfig {
  recipients: string[]
  subject_template?: string
  body_template?: string
}

export interface SlackChannelConfig {
  webhook_url: string
  channel?: string
  username?: string
  icon_emoji?: string
}

export interface WebhookChannelConfig {
  url: string
  method: "POST" | "PUT"
  headers?: Record<string, string>
  body_template?: string
}

export type NotificationChannelConfig =
  | EmailChannelConfig
  | SlackChannelConfig
  | WebhookChannelConfig

// Form types for creating/editing
export interface CreateAlertConfigRequest {
  name: string
  metric_type: MetricType
  threshold_warning: number
  threshold_critical: number
  notification_channels: string[]
  suppression_rules?: SuppressionRule
  is_active?: boolean
}

export interface UpdateAlertConfigRequest
  extends Partial<CreateAlertConfigRequest> {
  id: string
}

export interface CreateNotificationChannelRequest {
  name: string
  type: NotificationChannelType
  configuration: NotificationChannelConfig
  is_active?: boolean
}

export interface UpdateNotificationChannelRequest
  extends Partial<CreateNotificationChannelRequest> {
  id: string
}

// API response types
export interface AlertsResponse {
  alerts: AlertInstance[]
  total: number
  page: number
  limit: number
}

export interface AlertConfigsResponse {
  configs: AlertConfig[]
  total: number
}

export interface MetricsResponse {
  metrics: PerformanceMetric[]
  total: number
}

// Action types
export interface AlertAction {
  type: "acknowledge" | "resolve" | "escalate" | "snooze"
  alert_id: string
  user_id: string
  metadata?: Record<string, any>
}

// Hook return types
export interface UseAlertsReturn {
  alerts: AlertInstance[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  acknowledgeAlert: (alertId: string) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
}

export interface UseAlertConfigsReturn {
  configs: AlertConfig[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createConfig: (config: CreateAlertConfigRequest) => Promise<AlertConfig>
  updateConfig: (config: UpdateAlertConfigRequest) => Promise<AlertConfig>
  deleteConfig: (configId: string) => Promise<void>
}

export interface UseNotificationChannelsReturn {
  channels: NotificationChannel[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createChannel: (
    channel: CreateNotificationChannelRequest
  ) => Promise<NotificationChannel>
  updateChannel: (
    channel: UpdateNotificationChannelRequest
  ) => Promise<NotificationChannel>
  deleteChannel: (channelId: string) => Promise<void>
}

// Utility types
export interface AlertStats {
  total: number
  active: number
  critical: number
  warning: number
  resolved: number
  acknowledged: number
}

export interface AlertFilters {
  status?: AlertStatus[]
  severity?: AlertSeverity[]
  metric_type?: MetricType[]
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

// Database JSON types (for Supabase)
export interface Database {
  public: {
    Tables: {
      alert_configs: {
        Row: AlertConfig
        Insert: Omit<AlertConfig, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<AlertConfig, "id" | "created_at" | "updated_at">>
      }
      alert_history: {
        Row: AlertInstance
        Insert: Omit<AlertInstance, "id" | "created_at">
        Update: Partial<Omit<AlertInstance, "id" | "created_at">>
      }
      performance_metrics: {
        Row: PerformanceMetric
        Insert: Omit<PerformanceMetric, "id" | "recorded_at">
        Update: Partial<Omit<PerformanceMetric, "id" | "recorded_at">>
      }
      notification_channels: {
        Row: NotificationChannel
        Insert: Omit<NotificationChannel, "id" | "created_at" | "updated_at">
        Update: Partial<
          Omit<NotificationChannel, "id" | "created_at" | "updated_at">
        >
      }
    }
  }
}
