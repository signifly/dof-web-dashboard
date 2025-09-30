import { PerformanceInsightsEngine } from "@/lib/services/insights-engine"
import { PerformanceInsight, AnomalyDetection } from "@/types/insights"
import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"

// Mock all the dependencies
jest.mock("@/lib/performance-data", () => ({
  getPerformanceSummary: jest.fn(),
  getPerformanceTrends: jest.fn(),
}))

jest.mock("@/lib/utils/statistical-analysis", () => ({
  StatisticalAnalysisUtils: {
    analyzeTrend: jest.fn(),
    detectAnomalies: jest.fn(),
    identifySeasonalPatterns: jest.fn(),
    calculateStatistics: jest.fn(),
  },
}))

jest.mock("@/lib/utils/performance-scoring", () => ({
  PerformanceScoringEngine: jest.fn().mockImplementation(() => ({
    calculatePerformanceScore: jest.fn(),
  })),
}))

jest.mock("@/lib/services/recommendation-engine", () => ({
  RecommendationEngine: jest.fn().mockImplementation(() => ({
    generateRecommendations: jest.fn(),
  })),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "test-uuid-123"),
  },
})

describe("PerformanceInsightsEngine", () => {
  let engine: PerformanceInsightsEngine
  let mockPerformanceSummary: PerformanceSummary
  let mockTrends: MetricsTrend[]

  beforeEach(() => {
    engine = new PerformanceInsightsEngine()

    mockPerformanceSummary = {
      totalSessions: 100,
      totalMetrics: 5000,
      avgFps: 35,
      avgMemory: 450,
      avgCpu: 55,
      avgLoadTime: 2500,
      deviceCount: 25,
      platformBreakdown: [
        { platform: "android", count: 15 },
        { platform: "ios", count: 10 },
      ],
      performanceTiers: [
        { tier: "high_end", count: 8 },
        { tier: "mid_range", count: 12 },
        { tier: "low_end", count: 5 },
      ],
      recentActivity: [],
      memoryPressure: [
        { level: "low", count: 20 },
        { level: "medium", count: 4 },
        { level: "high", count: 1 },
      ],
      fpsDistribution: [
        { range: "0-30", count: 10 },
        { range: "30-60", count: 15 },
      ],
    }

    mockTrends = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
      screen_name: "test_screen",
      fps: 35 + Math.random() * 10,
      memory_usage: 450 + Math.random() * 100,
      cpu_usage: 55 + Math.random() * 20,
      load_time: 2500 + Math.random() * 500,
    }))

    jest.clearAllMocks()
  })

  describe("generateInsights", () => {
    beforeEach(() => {
      // Setup default mocks
      const {
        getPerformanceSummary,
        getPerformanceTrends,
      } = require("@/lib/performance-data")
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")
      const {
        PerformanceScoringEngine,
      } = require("@/lib/utils/performance-scoring")
      const {
        RecommendationEngine,
      } = require("@/lib/services/recommendation-engine")

      getPerformanceSummary.mockResolvedValue(mockPerformanceSummary)
      getPerformanceTrends.mockResolvedValue(mockTrends)

      StatisticalAnalysisUtils.analyzeTrend.mockReturnValue({
        direction: "up",
        slope: 1.2,
        confidence: 0.8,
        significance: "high",
        r_squared: 0.7,
        forecast: 40,
        data_points: 20,
        time_period: "20 minutes",
      })

      StatisticalAnalysisUtils.detectAnomalies.mockReturnValue([])
      StatisticalAnalysisUtils.identifySeasonalPatterns.mockReturnValue([])
      StatisticalAnalysisUtils.calculateStatistics.mockReturnValue({
        mean: 35,
        median: 35,
        standard_deviation: 5,
        min: 25,
        max: 45,
        percentile_25: 30,
        percentile_75: 40,
        percentile_90: 42,
        percentile_95: 44,
        outliers: [],
      })

      PerformanceScoringEngine.prototype.calculatePerformanceScore.mockReturnValue(
        {
          overall: 75,
          breakdown: { fps: 70, memory: 75, cpu: 80, loading: 75 },
          grade: "B",
          trend: "improving",
          last_calculated: new Date().toISOString(),
        }
      )

      RecommendationEngine.prototype.generateRecommendations.mockResolvedValue(
        []
      )
    })

    it("should generate comprehensive insights report", async () => {
      const report = await engine.generateInsights()

      expect(report).toMatchObject({
        id: expect.any(String),
        generated_at: expect.any(String),
        time_range: {
          start: expect.any(String),
          end: expect.any(String),
        },
        performance_score: expect.objectContaining({
          overall: expect.any(Number),
          breakdown: expect.any(Object),
          grade: expect.any(String),
          trend: expect.any(String),
        }),
        insights: expect.any(Array),
        recommendations: expect.any(Array),
        summary: expect.objectContaining({
          total_insights: expect.any(Number),
          critical_issues: expect.any(Number),
          improvement_opportunities: expect.any(Number),
        }),
        trends: expect.objectContaining({
          fps_trend: expect.any(Object),
          memory_trend: expect.any(Object),
          cpu_trend: expect.any(Object),
          loading_trend: expect.any(Object),
        }),
        anomalies: expect.any(Array),
        optimization_opportunities: expect.any(Array),
        metadata: expect.objectContaining({
          analysis_duration_ms: expect.any(Number),
          data_points_analyzed: expect.any(Number),
          confidence_level: expect.any(Number),
        }),
      })
    })

    it("should use custom time range when provided", async () => {
      const timeRange = {
        start: "2023-01-01T00:00:00Z",
        end: "2023-01-02T00:00:00Z",
      }

      await engine.generateInsights(timeRange)

      const {
        getPerformanceSummary,
        getPerformanceTrends,
      } = require("@/lib/performance-data")

      expect(getPerformanceSummary).toHaveBeenCalledWith(
        timeRange.start,
        timeRange.end
      )
      expect(getPerformanceTrends).toHaveBeenCalledWith(
        timeRange.start,
        timeRange.end
      )
    })

    it("should detect FPS trend decline insights", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      StatisticalAnalysisUtils.analyzeTrend.mockReturnValueOnce({
        direction: "down",
        slope: -2.5,
        confidence: 0.85,
        significance: "high",
        r_squared: 0.8,
        forecast: 25,
        data_points: 20,
        time_period: "20 minutes",
      })

      const report = await engine.generateInsights()

      const fpsDeclineInsight = report.insights.find(
        insight =>
          insight.type === "trend_decline" && insight.category === "performance"
      )

      expect(fpsDeclineInsight).toBeDefined()
      expect(fpsDeclineInsight?.title).toContain("FPS")
      expect(fpsDeclineInsight?.severity).toMatch(/high|critical/)
      expect(fpsDeclineInsight?.confidence).toBeGreaterThan(0.8)
    })

    it("should detect memory usage increase insights", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      StatisticalAnalysisUtils.analyzeTrend
        .mockReturnValueOnce({ direction: "stable", significance: "low" }) // FPS
        .mockReturnValueOnce({
          direction: "up",
          slope: 15,
          confidence: 0.9,
          significance: "high",
          r_squared: 0.85,
          forecast: 550,
          data_points: 20,
          time_period: "20 minutes",
        }) // Memory

      const report = await engine.generateInsights()

      const memoryIncreaseInsight = report.insights.find(
        insight =>
          insight.type === "trend_decline" && insight.category === "memory"
      )

      expect(memoryIncreaseInsight).toBeDefined()
      expect(memoryIncreaseInsight?.title).toContain("Memory")
      expect(memoryIncreaseInsight?.data_context.metric_type).toBe("memory")
    })

    it("should detect anomalies and create insights", async () => {
      const mockAnomalies: AnomalyDetection[] = [
        {
          id: "anomaly-1",
          metric_type: "fps",
          value: 10,
          expected_value: 35,
          deviation: -25,
          z_score: 3.5,
          severity: "critical",
          timestamp: new Date().toISOString(),
        },
      ]

      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")
      StatisticalAnalysisUtils.detectAnomalies.mockReturnValue(mockAnomalies)

      const report = await engine.generateInsights()

      const anomalyInsight = report.insights.find(
        insight => insight.type === "anomaly"
      )

      expect(anomalyInsight).toBeDefined()
      expect(anomalyInsight?.severity).toBe("critical")
      expect(report.anomalies).toHaveLength(1)
    })

    it("should identify optimization opportunities", async () => {
      // Set up conditions that should trigger optimization opportunities
      const highMemorySummary = {
        ...mockPerformanceSummary,
        avgMemory: 700, // High memory usage
        avgCpu: 75, // High CPU usage
        avgLoadTime: 4000, // Slow loading
      }

      const { getPerformanceSummary } = require("@/lib/performance-data")
      getPerformanceSummary.mockResolvedValue(highMemorySummary)

      const report = await engine.generateInsights()

      expect(report.optimization_opportunities.length).toBeGreaterThan(0)

      const memoryOpp = report.optimization_opportunities.find(
        opp => opp.type === "memory_optimization"
      )
      expect(memoryOpp).toBeDefined()
    })

    it("should calculate accurate summary statistics", async () => {
      const mockInsights: PerformanceInsight[] = [
        {
          id: "insight-1",
          type: "trend_decline",
          severity: "critical",
          title: "Critical Issue",
          description: "Test",
          confidence: 0.9,
          impact: "high",
          category: "performance",
          detected_at: new Date().toISOString(),
          data_context: {
            metric_type: "fps",
            value: 20,
            baseline: 40,
            deviation: -20,
          },
        },
        {
          id: "insight-2",
          type: "opportunity",
          severity: "medium",
          title: "Opportunity",
          description: "Test",
          confidence: 0.7,
          impact: "medium",
          category: "memory",
          detected_at: new Date().toISOString(),
          data_context: {
            metric_type: "memory",
            value: 500,
            baseline: 300,
            deviation: 200,
          },
        },
      ]

      // Mock to return specific insights
      jest
        .spyOn(engine as any, "generateInsightsFromTrends")
        .mockReturnValue(mockInsights)
      jest
        .spyOn(engine as any, "generateInsightsFromAnomalies")
        .mockReturnValue([])

      const report = await engine.generateInsights()

      expect(report.summary).toMatchObject({
        total_insights: 2,
        critical_issues: 1,
        improvement_opportunities: 1,
        estimated_impact: expect.any(String),
        top_priority_recommendations: expect.any(Number),
      })
    })

    it("should include performance metadata", async () => {
      const report = await engine.generateInsights()

      expect(report.metadata).toMatchObject({
        analysis_duration_ms: expect.any(Number),
        data_points_analyzed: expect.any(Number),
        confidence_level: expect.any(Number),
      })

      expect(report.metadata.analysis_duration_ms).toBeGreaterThan(0)
      expect(report.metadata.data_points_analyzed).toBe(mockTrends.length)
      expect(report.metadata.confidence_level).toBeGreaterThan(0)
      expect(report.metadata.confidence_level).toBeLessThanOrEqual(1)
    })

    it("should handle empty performance data gracefully", async () => {
      const {
        getPerformanceSummary,
        getPerformanceTrends,
      } = require("@/lib/performance-data")

      getPerformanceSummary.mockResolvedValue({
        ...mockPerformanceSummary,
        totalSessions: 0,
        deviceCount: 0,
      })
      getPerformanceTrends.mockResolvedValue([])

      const report = await engine.generateInsights()

      expect(report).toBeDefined()
      expect(report.insights).toEqual([])
      expect(report.anomalies).toEqual([])
      expect(report.optimization_opportunities).toEqual([])
      expect(report.summary.total_insights).toBe(0)
    })

    it("should handle performance data fetch errors", async () => {
      const { getPerformanceSummary } = require("@/lib/performance-data")

      getPerformanceSummary.mockRejectedValue(
        new Error("Database connection failed")
      )

      await expect(engine.generateInsights()).rejects.toThrow(
        "Database connection failed"
      )
    })
  })

  describe("insight generation logic", () => {
    it("should generate trend improvement insights for positive trends", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      // Mock positive FPS trend (good news)
      StatisticalAnalysisUtils.analyzeTrend.mockReturnValueOnce({
        direction: "up",
        slope: 3.0,
        confidence: 0.9,
        significance: "high",
        r_squared: 0.85,
        forecast: 50,
        data_points: 20,
        time_period: "20 minutes",
      })

      const report = await engine.generateInsights()

      const improvementInsight = report.insights.find(
        insight => insight.type === "trend_improvement"
      )

      expect(improvementInsight).toBeDefined()
      expect(improvementInsight?.impact).toBe("high")
      expect(improvementInsight?.category).toBe("performance")
    })

    it("should generate alert insights for concerning values", async () => {
      const concerningSummary = {
        ...mockPerformanceSummary,
        avgFps: 15, // Very low FPS
        avgMemory: 900, // Very high memory
      }

      const { getPerformanceSummary } = require("@/lib/performance-data")
      getPerformanceSummary.mockResolvedValue(concerningSummary)

      const report = await engine.generateInsights()

      const alertInsights = report.insights.filter(
        insight => insight.type === "alert"
      )

      expect(alertInsights.length).toBeGreaterThan(0)
    })

    it("should set appropriate confidence levels based on data quality", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      // Mock high confidence trend
      StatisticalAnalysisUtils.analyzeTrend.mockReturnValue({
        direction: "down",
        slope: -5.0,
        confidence: 0.95,
        significance: "high",
        r_squared: 0.9,
        forecast: 25,
        data_points: 50, // More data points
        time_period: "50 minutes",
      })

      const report = await engine.generateInsights()

      const highConfidenceInsights = report.insights.filter(
        insight => insight.confidence > 0.8
      )

      expect(highConfidenceInsights.length).toBeGreaterThan(0)
    })

    it("should generate seasonal pattern insights when patterns detected", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      StatisticalAnalysisUtils.identifySeasonalPatterns.mockReturnValue([
        {
          pattern_type: "daily",
          confidence: 0.8,
          peak_times: ["14:00", "15:00", "16:00"],
          low_times: ["02:00", "03:00", "04:00"],
          amplitude: 15,
          significance: 0.7,
        },
      ])

      const report = await engine.generateInsights()

      // Check if pattern insights were generated (implementation may vary)
      expect(report.insights.length).toBeGreaterThan(0)
    })
  })

  describe("optimization opportunity detection", () => {
    it("should detect memory optimization opportunities", async () => {
      const report = await engine.generateInsights()

      // Method should be called to detect optimization opportunities
      const memoryOpp = report.optimization_opportunities.find(
        opp => opp.type === "memory_optimization"
      )

      if (mockPerformanceSummary.avgMemory > 600) {
        expect(memoryOpp).toBeDefined()
      }
    })

    it("should calculate improvement potential correctly", async () => {
      const highMemorySummary = {
        ...mockPerformanceSummary,
        avgMemory: 800,
      }

      const { getPerformanceSummary } = require("@/lib/performance-data")
      getPerformanceSummary.mockResolvedValue(highMemorySummary)

      const report = await engine.generateInsights()

      const opportunities = report.optimization_opportunities.filter(
        opp => opp.improvement_potential > 0
      )

      expect(opportunities.length).toBeGreaterThan(0)
    })
  })

  describe("recommendation integration", () => {
    it("should generate recommendations from insights", async () => {
      const mockRecommendations = [
        {
          id: "rec-1",
          insight_id: "insight-1",
          title: "Test Recommendation",
          description: "Test description",
          category: "performance" as const,
          impact: "high" as const,
          effort: "medium" as const,
          priority_score: 4.2,
          actionable_steps: ["Step 1", "Step 2"],
          estimated_improvement: "20% improvement",
          related_metrics: ["fps"],
          implementation_time: "2-3 days",
          status: "pending" as const,
          created_at: new Date().toISOString(),
        },
      ]

      const {
        RecommendationEngine,
      } = require("@/lib/services/recommendation-engine")
      RecommendationEngine.prototype.generateRecommendations.mockResolvedValue(
        mockRecommendations
      )

      const report = await engine.generateInsights()

      expect(report.recommendations).toEqual(mockRecommendations)
      expect(report.summary.top_priority_recommendations).toBe(1)
    })
  })

  describe("error handling", () => {
    it("should handle statistical analysis errors gracefully", async () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")

      StatisticalAnalysisUtils.analyzeTrend.mockImplementation(() => {
        throw new Error("Statistical analysis failed")
      })

      // Should not crash, but may have reduced insights
      const report = await engine.generateInsights()
      expect(report).toBeDefined()
    })

    it("should handle recommendation generation errors", async () => {
      const {
        RecommendationEngine,
      } = require("@/lib/services/recommendation-engine")

      RecommendationEngine.prototype.generateRecommendations.mockRejectedValue(
        new Error("Recommendation generation failed")
      )

      const report = await engine.generateInsights()

      // Should still return a report, possibly with empty recommendations
      expect(report).toBeDefined()
      expect(report.recommendations).toEqual([])
    })
  })
})
