-- Migration: Create Performance Alerting System Tables
-- Date: 2025-09-22
-- Description: Set up tables for alert configurations, history, performance metrics, and notification channels

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alert configurations table
CREATE TABLE IF NOT EXISTS alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu_usage', 'memory_usage', 'disk_space', 'response_time', 'error_rate', 'bundle_size', 'page_load_time')),
  threshold_warning NUMERIC NOT NULL,
  threshold_critical NUMERIC NOT NULL,
  notification_channels JSONB NOT NULL DEFAULT '[]',
  suppression_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history/instances table
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES alert_configs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical', 'emergency')),
  metric_value NUMERIC NOT NULL,
  threshold_violated NUMERIC NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table (for monitoring)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification channels configuration
CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'slack', 'webhook')),
  configuration JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_history_config_id ON alert_history(config_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history(status);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_status_active ON alert_history(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_time ON performance_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_configs_active ON alert_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_channels_active ON notification_channels(is_active) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_alert_configs_updated_at BEFORE UPDATE ON alert_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at BEFORE UPDATE ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

-- Policies for alert_configs
CREATE POLICY "Users can view all alert configs" ON alert_configs
    FOR SELECT USING (true);

CREATE POLICY "Users can create alert configs" ON alert_configs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own alert configs" ON alert_configs
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own alert configs" ON alert_configs
    FOR DELETE USING (auth.uid() = created_by);

-- Policies for alert_history
CREATE POLICY "Users can view all alert history" ON alert_history
    FOR SELECT USING (true);

CREATE POLICY "System can create alert history" ON alert_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update alert history they can acknowledge" ON alert_history
    FOR UPDATE USING (true);

-- Policies for performance_metrics
CREATE POLICY "Users can view all performance metrics" ON performance_metrics
    FOR SELECT USING (true);

CREATE POLICY "System can create performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- Policies for notification_channels
CREATE POLICY "Users can view all notification channels" ON notification_channels
    FOR SELECT USING (true);

CREATE POLICY "Users can create notification channels" ON notification_channels
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own notification channels" ON notification_channels
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own notification channels" ON notification_channels
    FOR DELETE USING (auth.uid() = created_by);

-- Insert some default alert configurations for testing
INSERT INTO alert_configs (name, metric_type, threshold_warning, threshold_critical, notification_channels) VALUES
('CPU Usage Monitor', 'cpu_usage', 80, 90, '[]'),
('Memory Usage Monitor', 'memory_usage', 75, 85, '[]'),
('Page Load Time Monitor', 'page_load_time', 2000, 3000, '[]'),
('Bundle Size Monitor', 'bundle_size', 500000, 1000000, '[]')
ON CONFLICT DO NOTHING;

-- Insert some sample performance metrics
INSERT INTO performance_metrics (metric_type, value, source) VALUES
('cpu_usage', 45.2, 'production'),
('memory_usage', 67.8, 'production'),
('page_load_time', 1234, 'lighthouse'),
('bundle_size', 450000, 'webpack'),
('response_time', 234, 'api_monitor')
ON CONFLICT DO NOTHING;