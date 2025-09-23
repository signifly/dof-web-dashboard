-- Fix schema issues for DOF Web Dashboard
-- This script addresses the missing columns that the application expects

-- =====================================================================
-- 1. ADD MISSING DEVICE_ID COLUMN TO PERFORMANCE_SESSIONS
-- =====================================================================

-- Add device_id column to performance_sessions table
-- This will help with device-specific analytics
ALTER TABLE performance_sessions
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- Create an index for device_id for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_sessions_device_id
ON performance_sessions(device_id);

-- =====================================================================
-- 2. DECISION: NORMALIZE vs DENORMALIZE PERFORMANCE_METRICS
-- =====================================================================

-- The application expects denormalized columns (memory_usage, fps, etc.)
-- but the database uses a normalized approach (metric_type + metric_value).
--
-- We have two options:
-- A) Add denormalized columns to performance_metrics (RECOMMENDED)
-- B) Update all application code to use normalized approach
--
-- Option A is chosen for backward compatibility and query performance.

-- Add denormalized metric columns to performance_metrics table
ALTER TABLE performance_metrics
ADD COLUMN IF NOT EXISTS memory_usage DECIMAL(10,2);

ALTER TABLE performance_metrics
ADD COLUMN IF NOT EXISTS fps DECIMAL(5,2);

ALTER TABLE performance_metrics
ADD COLUMN IF NOT EXISTS cpu_usage DECIMAL(5,2);

ALTER TABLE performance_metrics
ADD COLUMN IF NOT EXISTS load_time DECIMAL(10,3);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_memory_usage
ON performance_metrics(memory_usage) WHERE memory_usage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_fps
ON performance_metrics(fps) WHERE fps IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_cpu_usage
ON performance_metrics(cpu_usage) WHERE cpu_usage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_load_time
ON performance_metrics(load_time) WHERE load_time IS NOT NULL;

-- =====================================================================
-- 3. CREATE TRIGGER TO SYNC NORMALIZED AND DENORMALIZED DATA
-- =====================================================================

-- Create a function to sync metric_value to denormalized columns
CREATE OR REPLACE FUNCTION sync_denormalized_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update denormalized columns based on metric_type
    CASE NEW.metric_type
        WHEN 'memory_usage' THEN
            NEW.memory_usage = NEW.metric_value;
        WHEN 'fps' THEN
            NEW.fps = NEW.metric_value;
        WHEN 'cpu_usage' THEN
            NEW.cpu_usage = NEW.metric_value;
        WHEN 'load_time', 'navigation_time', 'screen_load' THEN
            NEW.load_time = NEW.metric_value;
        ELSE
            -- For other metric types, leave denormalized columns as NULL
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync data on insert/update
DROP TRIGGER IF EXISTS trigger_sync_denormalized_metrics ON performance_metrics;
CREATE TRIGGER trigger_sync_denormalized_metrics
    BEFORE INSERT OR UPDATE ON performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION sync_denormalized_metrics();

-- =====================================================================
-- 4. BACKFILL EXISTING DATA
-- =====================================================================

-- Backfill existing normalized data into denormalized columns
-- This ensures existing data works with the application

UPDATE performance_metrics
SET memory_usage = metric_value
WHERE metric_type = 'memory_usage' AND memory_usage IS NULL;

UPDATE performance_metrics
SET fps = metric_value
WHERE metric_type = 'fps' AND fps IS NULL;

UPDATE performance_metrics
SET cpu_usage = metric_value
WHERE metric_type = 'cpu_usage' AND cpu_usage IS NULL;

UPDATE performance_metrics
SET load_time = metric_value
WHERE metric_type IN ('load_time', 'navigation_time', 'screen_load')
AND load_time IS NULL;

-- =====================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS) FOR BETTER SECURITY
-- =====================================================================

-- Enable RLS on both tables for better security
ALTER TABLE performance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous read access (for dashboard)
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to performance_sessions"
ON performance_sessions FOR SELECT
TO anon
USING (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous read access to performance_metrics"
ON performance_metrics FOR SELECT
TO anon
USING (true);

-- Create policies to allow authenticated users to manage their own data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert sessions"
ON performance_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert metrics"
ON performance_metrics FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================================
-- 6. ADD HELPFUL VIEWS FOR COMMON QUERIES
-- =====================================================================

-- Create a view for session summary with device info
CREATE OR REPLACE VIEW session_summary AS
SELECT
    ps.id,
    ps.anonymous_user_id,
    ps.device_id,
    ps.device_type,
    ps.os_version,
    ps.app_version,
    ps.session_start,
    ps.session_end,
    ps.created_at,
    -- Aggregate metrics for this session
    COUNT(pm.id) as total_metrics,
    AVG(pm.fps) as avg_fps,
    AVG(pm.memory_usage) as avg_memory,
    AVG(pm.cpu_usage) as avg_cpu,
    AVG(pm.load_time) as avg_load_time
FROM performance_sessions ps
LEFT JOIN performance_metrics pm ON ps.id = pm.session_id
GROUP BY ps.id, ps.anonymous_user_id, ps.device_id, ps.device_type,
         ps.os_version, ps.app_version, ps.session_start, ps.session_end, ps.created_at;

-- Create a view for recent performance trends
CREATE OR REPLACE VIEW recent_performance_trends AS
SELECT
    pm.timestamp,
    pm.created_at,
    pm.metric_type,
    pm.metric_value,
    pm.fps,
    pm.memory_usage,
    pm.cpu_usage,
    pm.load_time,
    pm.context,
    ps.device_type,
    ps.os_version,
    ps.app_version
FROM performance_metrics pm
LEFT JOIN performance_sessions ps ON pm.session_id = ps.id
WHERE pm.created_at >= NOW() - INTERVAL '7 days'
ORDER BY pm.created_at DESC;

-- Grant access to views
GRANT SELECT ON session_summary TO anon, authenticated;
GRANT SELECT ON recent_performance_trends TO anon, authenticated;