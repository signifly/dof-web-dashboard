import {
  PerformanceScoringEngine,
  ScoringConfig,
} from "@/lib/utils/performance-scoring"
import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"
import { PerformanceScore } from "@/types/insights"

// Mock the statistical analysis utils
jest.mock("@/lib/utils/statistical-analysis", () => ({
  StatisticalAnalysisUtils: {
    analyzeTrend: jest.fn(() => ({
      direction: "up",
      slope: 1.2,
      confidence: 0.8,
      significance: "high",
      r_squared: 0.7,
      forecast: 55,
      data_points: 10,
      time_period: "7 days",
    })),
  },
}))

describe("PerformanceScoringEngine", () => {
  let engine: PerformanceScoringEngine

  const mockPerformanceSummary: PerformanceSummary = {
    totalSessions: 100,
    totalMetrics: 1000,
    deviceCount: 25,
    avgFps: 45,
    avgMemory: 350,
    avgCpu: 35,
    avgLoadTime: 1500,
    avgCacheSize: 150,
    platformBreakdown: [
      { platform: "android", count: 15 },
      { platform: "ios", count: 10 },
    ],
    performanceTiers: [
      { tier: "high_end", count: 10 },
      { tier: "mid_range", count: 10 },
      { tier: "low_end", count: 5 },
    ],
    recentActivity: [],
    memoryPressure: [
      { level: "low", count: 80 },
      { level: "medium", count: 15 },
      { level: "high", count: 5 },
    ],
    fpsDistribution: [
      { range: "0-30", count: 20 },
      { range: "30-60", count: 80 },
    ],
  }

  const generateMockTrends = (count: number): MetricsTrend[] => {
    const baseTime = new Date("2023-01-01T00:00:00Z").getTime()
    return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(baseTime + i * 60000).toISOString(),
      screen_name: "test_screen",
      fps: 45 + Math.random() * 10,
      memory_usage: 350 + Math.random() * 50,
      cpu_usage: 35 + Math.random() * 10,
      load_time: 1500 + Math.random() * 500,
      cache_size: 150 + Math.random() * 50,
    }))
  }

  beforeEach(() => {
    engine = new PerformanceScoringEngine()
  })

  describe("constructor", () => {
    it("should use default configuration", () => {
      expect(engine).toBeInstanceOf(PerformanceScoringEngine)
    })

    it("should allow custom configuration", () => {
      const customConfig: Partial<ScoringConfig> = {
        weights: {
          fps: 0.5,
          memory: 0.3,
          cpu: 0.2,
        },
        trend_weight: 0.2,
      }

      const customEngine = new PerformanceScoringEngine(customConfig)
      expect(customEngine).toBeInstanceOf(PerformanceScoringEngine)
    })
  })

  describe("calculatePerformanceScore", () => {
    it("should calculate basic performance score without trends", () => {
      const score = engine.calculatePerformanceScore(mockPerformanceSummary)

      expect(score.overall).toBeGreaterThan(0)
      expect(score.overall).toBeLessThanOrEqual(100)
      expect(score.breakdown.fps).toBeDefined()
      expect(score.breakdown.memory).toBeDefined()
      expect(score.breakdown.cpu).toBeDefined()
      expect(score.grade).toMatch(/[ABCDF]/)
      expect(score.trend).toBe("stable")
      expect(score.last_calculated).toBeDefined()
    })

    it("should calculate excellent performance score", () => {
      const excellentSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 60, // Excellent
        avgMemory: 150, // Excellent
        avgCpu: 15, // Excellent
        avgLoadTime: 800, // Excellent
      }

      const score = engine.calculatePerformanceScore(excellentSummary)

      expect(score.overall).toBeGreaterThan(85)
      expect(score.grade).toBe("A")
      expect(score.breakdown.fps).toBeGreaterThan(90)
      expect(score.breakdown.memory).toBeGreaterThan(90)
      expect(score.breakdown.cpu).toBeGreaterThan(90)
    })

    it("should calculate poor performance score", () => {
      const poorSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 15, // Poor
        avgMemory: 900, // Poor
        avgCpu: 85, // Poor
        avgLoadTime: 6000, // Poor
      }

      const score = engine.calculatePerformanceScore(poorSummary)

      expect(score.overall).toBeLessThan(50)
      expect(score.grade).toMatch(/[DF]/)
      expect(score.breakdown.fps).toBeLessThan(50)
      expect(score.breakdown.memory).toBeLessThan(50)
      expect(score.breakdown.cpu).toBeLessThan(50)
    })

    it("should handle invalid metric values", () => {
      const invalidSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: NaN,
        avgMemory: -100,
        avgCpu: Infinity,
        avgLoadTime: -1,
      }

      const score = engine.calculatePerformanceScore(invalidSummary)

      expect(score.overall).toBeGreaterThanOrEqual(0)
      expect(score.breakdown.fps).toBe(0) // NaN should result in 0
      expect(score.breakdown.memory).toBe(0) // Negative should result in 0
      expect(score.breakdown.cpu).toBe(0) // Infinity should result in 0
    })

    it("should apply trend analysis when trends provided", () => {
      const trends = generateMockTrends(10)
      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        trends
      )

      expect(score.trend).toBe("improving") // Based on our mock
      // Score should be adjusted based on trend (mock shows improvement)
      expect(score.overall).toBeDefined()
    })

    it("should calculate baseline comparison when provided", () => {
      const baseline = {
        fps: 40,
        memory: 400,
        cpu: 40,
      }

      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        undefined,
        baseline
      )

      expect(score.baseline_comparison).toBeDefined()
      expect(score.baseline_comparison?.fps_vs_baseline).toBeCloseTo(12.5, 1) // (45-40)/40 * 100
      expect(score.baseline_comparison?.memory_vs_baseline).toBeCloseTo(
        -12.5,
        1
      ) // (350-400)/400 * 100
    })

    it("should handle zero baseline values", () => {
      const baseline = {
        fps: 0,
        memory: 0,
        cpu: 0,
      }

      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        undefined,
        baseline
      )

      expect(score.baseline_comparison).toBeDefined()
      expect(score.baseline_comparison?.fps_vs_baseline).toBe(0)
      expect(score.baseline_comparison?.memory_vs_baseline).toBe(0)
    })
  })

  describe("benchmarkAgainstBaseline", () => {
    it("should benchmark FPS improvement against baseline", () => {
      const result = engine.benchmarkAgainstBaseline(50, 45, "fps")

      expect(result.deviation).toBe(5)
      expect(result.score).toBeGreaterThan(90) // Better than baseline + adjustment
      expect(result.classification).toMatch(/excellent|good/)
    })

    it("should benchmark memory increase against baseline", () => {
      const result = engine.benchmarkAgainstBaseline(450, 400, "memory")

      expect(result.deviation).toBe(50)
      expect(result.score).toBeLessThan(90) // Worse than baseline for memory
      expect(result.classification).toBeDefined()
    })

    it("should handle identical values", () => {
      const result = engine.benchmarkAgainstBaseline(100, 100, "cpu")

      expect(result.deviation).toBe(0)
      expect(result.classification).toBe("excellent")
      expect(result.score).toBe(95)
    })

    it("should classify large deviations as critical", () => {
      const result = engine.benchmarkAgainstBaseline(1000, 400, "memory")

      expect(result.classification).toBe("critical")
      expect(result.score).toBeLessThan(50)
    })
  })

  describe("calculatePerformanceTier", () => {
    it("should classify high-end device performance", () => {
      const highEndSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 55, // High FPS
        avgMemory: 250, // Low memory usage
        avgCpu: 25, // Low CPU usage
      }

      const result = engine.calculatePerformanceTier(highEndSummary)

      expect(result.tier).toBe("high_end")
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.reasoning).toContain("High average FPS")
      expect(result.reasoning.length).toBeGreaterThan(0)
    })

    it("should classify low-end device performance", () => {
      const lowEndSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 25, // Low FPS
        avgMemory: 700, // High memory usage
        avgCpu: 70, // High CPU usage
      }

      const result = engine.calculatePerformanceTier(lowEndSummary)

      expect(result.tier).toBe("low_end")
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.reasoning).toContain("Low FPS")
    })

    it("should classify mid-range device performance", () => {
      const midRangeSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 35, // Moderate FPS
        avgMemory: 450, // Moderate memory usage
        avgCpu: 50, // Moderate CPU usage
      }

      const result = engine.calculatePerformanceTier(midRangeSummary)

      expect(result.tier).toBe("mid_range")
      expect(result.confidence).toBeDefined()
      expect(result.reasoning.length).toBeGreaterThan(0)
    })

    it("should provide reasoning for classification", () => {
      const result = engine.calculatePerformanceTier(mockPerformanceSummary)

      expect(result.reasoning).toBeInstanceOf(Array)
      expect(result.reasoning.length).toBeGreaterThan(0)
      expect(result.reasoning.every(reason => typeof reason === "string")).toBe(
        true
      )
    })
  })

  describe("grade calculation", () => {
    it("should assign grade A for scores 90+", () => {
      const score = engine.calculatePerformanceScore({
        ...mockPerformanceSummary,
        avgFps: 60,
        avgMemory: 150,
        avgCpu: 15,
        avgLoadTime: 500,
      })

      expect(score.grade).toBe("A")
    })

    it("should assign grade F for scores below 60", () => {
      const score = engine.calculatePerformanceScore({
        ...mockPerformanceSummary,
        avgFps: 10,
        avgMemory: 1000,
        avgCpu: 95,
        avgLoadTime: 8000,
      })

      expect(score.grade).toBe("F")
    })

    it("should assign appropriate grades for middle ranges", () => {
      const testCases = [
        { expectedGrade: "B", fps: 50, memory: 300, cpu: 30 },
        { expectedGrade: "C", fps: 35, memory: 500, cpu: 50 },
        { expectedGrade: "D", fps: 25, memory: 700, cpu: 70 },
      ]

      testCases.forEach(({ expectedGrade, fps, memory, cpu }) => {
        const score = engine.calculatePerformanceScore({
          ...mockPerformanceSummary,
          avgFps: fps,
          avgMemory: memory,
          avgCpu: cpu,
        })

        expect(score.grade).toBe(expectedGrade)
      })
    })
  })

  describe("trend direction calculation", () => {
    it("should detect improving trends", () => {
      // Mock improving trends for all metrics
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")
      StatisticalAnalysisUtils.analyzeTrend
        .mockReturnValueOnce({
          direction: "up",
          significance: "high",
          confidence: 0.8,
          slope: 2,
        }) // FPS up (good)
        .mockReturnValueOnce({
          direction: "down",
          significance: "high",
          confidence: 0.8,
          slope: -10,
        }) // Memory down (good)
        .mockReturnValueOnce({
          direction: "down",
          significance: "high",
          confidence: 0.8,
          slope: -5,
        }) // CPU down (good)
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.5,
          slope: 0,
        }) // Additional metric stable

      const trends = generateMockTrends(10)
      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        trends
      )

      expect(score.trend).toBe("improving")
    })

    it("should detect declining trends", () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")
      StatisticalAnalysisUtils.analyzeTrend
        .mockReturnValueOnce({
          direction: "down",
          significance: "high",
          confidence: 0.8,
          slope: -2,
        }) // FPS down (bad)
        .mockReturnValueOnce({
          direction: "up",
          significance: "high",
          confidence: 0.8,
          slope: 10,
        }) // Memory up (bad)
        .mockReturnValueOnce({
          direction: "up",
          significance: "high",
          confidence: 0.8,
          slope: 5,
        }) // CPU up (bad)
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.3,
          slope: 0,
        }) // Additional metric stable

      const trends = generateMockTrends(10)
      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        trends
      )

      expect(score.trend).toBe("declining")
    })

    it("should detect stable trends", () => {
      const {
        StatisticalAnalysisUtils,
      } = require("@/lib/utils/statistical-analysis")
      StatisticalAnalysisUtils.analyzeTrend
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.3,
          slope: 0.01,
        })
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.2,
          slope: -0.01,
        })
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.1,
          slope: 0,
        })
        .mockReturnValueOnce({
          direction: "stable",
          significance: "low",
          confidence: 0.15,
          slope: 0.005,
        })

      const trends = generateMockTrends(10)
      const score = engine.calculatePerformanceScore(
        mockPerformanceSummary,
        trends
      )

      expect(score.trend).toBe("stable")
    })
  })

  describe("weighted scoring", () => {
    it("should apply correct weights to metrics", () => {
      // Test with custom weights that heavily favor FPS
      const customEngine = new PerformanceScoringEngine({
        weights: {
          fps: 0.8, // 80% weight on FPS
          memory: 0.1,
          cpu: 0.1,
        },
      })

      const highFpsSummary: PerformanceSummary = {
        ...mockPerformanceSummary,
        avgFps: 60, // Excellent FPS
        avgMemory: 800, // Poor memory
        avgCpu: 80, // Poor CPU
        // Focus on fps with high weight
      }

      const score = customEngine.calculatePerformanceScore(highFpsSummary)

      // With 80% weight on FPS, overall score should still be relatively good
      expect(score.overall).toBeGreaterThan(70)
    })

    it("should ensure all breakdown scores are properly calculated", () => {
      const score = engine.calculatePerformanceScore(mockPerformanceSummary)

      // All breakdown scores should be within valid range
      Object.values(score.breakdown).forEach(breakdownScore => {
        expect(breakdownScore).toBeGreaterThanOrEqual(0)
        expect(breakdownScore).toBeLessThanOrEqual(100)
        expect(Number.isInteger(breakdownScore)).toBe(true) // Should be rounded
      })

      // Overall score should be within range
      expect(score.overall).toBeGreaterThanOrEqual(0)
      expect(score.overall).toBeLessThanOrEqual(100)
      expect(Number.isInteger(score.overall)).toBe(true)
    })
  })
})
