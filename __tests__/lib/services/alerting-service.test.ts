/**
 * @jest-environment node
 */

import { AlertingService } from "@/lib/services/alerting-service"
import { createClient } from "@/lib/supabase/server"

// Mock Supabase client
jest.mock("@/lib/supabase/server")
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>

const mockSupabase = {
  from: jest.fn(),
}

const mockQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  in: jest.fn(),
  range: jest.fn(),
  gte: jest.fn(),
}

// Chain the query methods
Object.keys(mockQuery).forEach(key => {
  ;(mockQuery as any)[key].mockReturnValue(mockQuery)
})

const mockAlertConfigs = [
  {
    id: "config-1",
    name: "CPU Usage Monitor",
    metric_type: "cpu_usage",
    threshold_warning: 80,
    threshold_critical: 90,
    notification_channels: [],
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
]

const mockMetric = {
  id: "metric-1",
  metric_type: "cpu_usage",
  value: 95.5,
  source: "system_monitor",
  recorded_at: "2024-01-15T14:30:00Z",
}

const mockAlert = {
  id: "alert-1",
  config_id: "config-1",
  severity: "critical",
  metric_value: 95.5,
  threshold_violated: 90,
  message:
    "CRITICAL: CPU Usage Monitor - cpu usage reached 95.5% (threshold: 90.0%)",
  source: "system_monitor",
  status: "active",
  created_at: "2024-01-15T14:30:00Z",
}

describe("AlertingService", () => {
  let alertingService: AlertingService

  beforeEach(() => {
    mockCreateClient.mockReturnValue(mockSupabase as any)
    mockSupabase.from.mockReturnValue(mockQuery)
    alertingService = new AlertingService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("checkPerformanceMetrics", () => {
    it("triggers alert when metric exceeds critical threshold", async () => {
      // Mock active alert configs
      mockQuery.select.mockResolvedValueOnce({
        data: mockAlertConfigs,
        error: null,
      })

      // Mock no recent alert
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" }, // No rows found
      })

      // Mock latest metric
      mockQuery.single.mockResolvedValueOnce({
        data: mockMetric,
        error: null,
      })

      // Mock alert creation
      mockQuery.single.mockResolvedValueOnce({
        data: mockAlert,
        error: null,
      })

      const alerts = await alertingService.checkPerformanceMetrics()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe("critical")
      expect(alerts[0].metric_value).toBe(95.5)
    })

    it("does not trigger alert when metric is below threshold", async () => {
      const lowMetric = { ...mockMetric, value: 75 }

      mockQuery.select.mockResolvedValueOnce({
        data: mockAlertConfigs,
        error: null,
      })

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      })

      mockQuery.single.mockResolvedValueOnce({
        data: lowMetric,
        error: null,
      })

      const alerts = await alertingService.checkPerformanceMetrics()

      expect(alerts).toHaveLength(0)
    })

    it("skips alert creation when recent alert already exists", async () => {
      mockQuery.select.mockResolvedValueOnce({
        data: mockAlertConfigs,
        error: null,
      })

      // Mock existing recent alert
      mockQuery.single.mockResolvedValueOnce({
        data: mockAlert,
        error: null,
      })

      const alerts = await alertingService.checkPerformanceMetrics()

      expect(alerts).toHaveLength(0)
    })
  })

  describe("createAlert", () => {
    it("creates alert successfully", async () => {
      const alertData = {
        config_id: "config-1",
        severity: "critical" as const,
        metric_value: 95.5,
        threshold_violated: 90,
        message: "Test alert",
        source: "test",
      }

      mockQuery.single.mockResolvedValue({
        data: { ...alertData, id: "alert-1", status: "active" },
        error: null,
      })

      const result = await alertingService.createAlert(alertData)

      expect(result.id).toBe("alert-1")
      expect(result.status).toBe("active")
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...alertData,
        status: "active",
      })
    })

    it("handles alert creation error", async () => {
      const alertData = {
        config_id: "config-1",
        severity: "critical" as const,
        metric_value: 95.5,
        threshold_violated: 90,
        message: "Test alert",
        source: "test",
      }

      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      })

      await expect(alertingService.createAlert(alertData)).rejects.toThrow(
        "Failed to create alert: Insert failed"
      )
    })
  })

  describe("acknowledgeAlert", () => {
    it("acknowledges alert successfully", async () => {
      mockQuery.eq.mockResolvedValue({ error: null })

      await alertingService.acknowledgeAlert("alert-1", "user-1")

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: "acknowledged",
        acknowledged_at: expect.any(String),
        acknowledged_by: "user-1",
      })
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "alert-1")
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "active")
    })

    it("handles acknowledge error", async () => {
      mockQuery.eq.mockResolvedValue({
        error: { message: "Update failed" },
      })

      await expect(
        alertingService.acknowledgeAlert("alert-1", "user-1")
      ).rejects.toThrow("Failed to acknowledge alert: Update failed")
    })
  })

  describe("resolveAlert", () => {
    it("resolves alert successfully", async () => {
      mockQuery.in.mockResolvedValue({ error: null })

      await alertingService.resolveAlert("alert-1", "user-1")

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: "resolved",
        resolved_at: expect.any(String),
        resolved_by: "user-1",
      })
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "alert-1")
      expect(mockQuery.in).toHaveBeenCalledWith("status", [
        "active",
        "acknowledged",
      ])
    })
  })

  describe("getAlertConfigs", () => {
    it("fetches alert configurations", async () => {
      mockQuery.order.mockResolvedValue({
        data: mockAlertConfigs,
        error: null,
      })

      const configs = await alertingService.getAlertConfigs()

      expect(configs).toEqual(mockAlertConfigs)
      expect(mockQuery.select).toHaveBeenCalledWith("*")
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      })
    })
  })

  describe("createAlertConfig", () => {
    it("creates alert configuration", async () => {
      const configData = {
        name: "Test Monitor",
        metric_type: "cpu_usage" as const,
        threshold_warning: 80,
        threshold_critical: 90,
        notification_channels: [],
      }

      const expectedConfig = {
        ...configData,
        id: "config-1",
        created_by: "user-1",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      }

      mockQuery.single.mockResolvedValue({
        data: expectedConfig,
        error: null,
      })

      const result = await alertingService.createAlertConfig(
        configData,
        "user-1"
      )

      expect(result).toEqual(expectedConfig)
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...configData,
        created_by: "user-1",
      })
    })
  })

  describe("getAlertHistory", () => {
    it("fetches alert history with pagination", async () => {
      const mockHistory = [mockAlert]

      mockQuery.range.mockResolvedValue({
        data: mockHistory,
        error: null,
        count: 1,
      })

      const result = await alertingService.getAlertHistory(10, 0)

      expect(result.alerts).toEqual(mockHistory)
      expect(result.total).toBe(1)
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      })
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9)
    })

    it("applies filters correctly", async () => {
      const filters = {
        status: ["active"],
        severity: ["critical"],
        configId: "config-1",
      }

      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      await alertingService.getAlertHistory(10, 0, filters)

      expect(mockQuery.in).toHaveBeenCalledWith("status", ["active"])
      expect(mockQuery.in).toHaveBeenCalledWith("severity", ["critical"])
      expect(mockQuery.eq).toHaveBeenCalledWith("config_id", "config-1")
    })
  })

  describe("detectRegression", () => {
    it("detects performance regression", async () => {
      const recentMetrics = [
        { value: 100, recorded_at: new Date().toISOString() }, // Recent (high)
        {
          value: 95,
          recorded_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          value: 90,
          recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          value: 70,
          recorded_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        }, // Historical (low)
        {
          value: 75,
          recorded_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          value: 68,
          recorded_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        },
      ]

      mockQuery.order.mockResolvedValue({
        data: recentMetrics,
        error: null,
      })

      // Mock alert creation for regression
      mockQuery.single.mockResolvedValue({
        data: {
          ...mockAlert,
          message:
            "Performance regression detected: cpu_usage increased by 35.1%",
          source: "regression_detector",
        },
        error: null,
      })

      const regressions = await alertingService.evaluateRegressions()

      expect(regressions).toHaveLength(1)
      expect(regressions[0].source).toBe("regression_detector")
    })
  })
})
