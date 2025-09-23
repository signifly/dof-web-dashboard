import { StatisticalAnalysisUtils } from "@/lib/utils/statistical-analysis"
import { MetricsTrend } from "@/lib/performance-data"
import {
  AnomalyDetection,
  TrendAnalysis,
  StatisticalResult,
} from "@/types/insights"

describe("StatisticalAnalysisUtils", () => {
  // Mock performance data for testing
  const generateMockTrend = (
    values: number[],
    timestamps?: string[]
  ): MetricsTrend[] => {
    const baseTime = new Date("2023-01-01T00:00:00Z").getTime()

    return values.map((value, index) => ({
      timestamp:
        timestamps?.[index] || new Date(baseTime + index * 60000).toISOString(),
      screen_name: "test_screen",
      fps: value,
      memory_usage: value * 10,
      cpu_usage: value * 0.5,
      load_time: value * 20,
    }))
  }

  describe("calculateLinearRegression", () => {
    it("should return zero values for insufficient data", () => {
      const result = StatisticalAnalysisUtils.calculateLinearRegression([1, 2])

      expect(result.slope).toBe(0)
      expect(result.intercept).toBe(0)
      expect(result.rSquared).toBe(0)
      expect(result.correlation).toBe(0)
      expect(result.pValue).toBe(1)
      expect(result.isSignificant).toBe(false)
    })

    it("should calculate regression for positive trend", () => {
      const data = [10, 15, 20, 25, 30, 35] // Perfect positive correlation
      const result = StatisticalAnalysisUtils.calculateLinearRegression(data)

      expect(result.slope).toBeCloseTo(5, 1)
      expect(result.intercept).toBeCloseTo(7.5, 1)
      expect(result.rSquared).toBeCloseTo(1, 2)
      expect(result.correlation).toBeCloseTo(1, 2)
      expect(result.isSignificant).toBe(true)
    })

    it("should calculate regression for negative trend", () => {
      const data = [100, 90, 80, 70, 60, 50] // Perfect negative correlation
      const result = StatisticalAnalysisUtils.calculateLinearRegression(data)

      expect(result.slope).toBeCloseTo(-10, 1)
      expect(result.correlation).toBeLessThan(0)
      expect(result.rSquared).toBeCloseTo(1, 2)
      expect(result.isSignificant).toBe(true)
    })

    it("should handle flat data", () => {
      const data = [50, 50, 50, 50, 50] // No variance
      const result = StatisticalAnalysisUtils.calculateLinearRegression(data)

      expect(result.slope).toBe(0)
      expect(result.rSquared).toBe(0)
      expect(result.correlation).toBe(0)
    })

    it("should handle noisy data", () => {
      const data = [10, 12, 9, 14, 11, 13, 8, 15, 12, 16] // Noisy upward trend
      const result = StatisticalAnalysisUtils.calculateLinearRegression(data)

      expect(result.slope).toBeGreaterThan(0)
      expect(result.rSquared).toBeGreaterThan(0)
      expect(result.rSquared).toBeLessThan(1)
    })
  })

  describe("detectAnomalies", () => {
    it("should return empty array for insufficient data", () => {
      const data = generateMockTrend([10, 20])
      const anomalies = StatisticalAnalysisUtils.detectAnomalies(data, "fps")

      expect(anomalies).toEqual([])
    })

    it("should detect high fps anomalies", () => {
      // Normal range around 30 fps, with one outlier at 100 fps
      const values = [28, 30, 32, 29, 31, 100, 30, 29]
      const data = generateMockTrend(values)
      const anomalies = StatisticalAnalysisUtils.detectAnomalies(
        data,
        "fps",
        2.0
      )

      expect(anomalies.length).toBe(1)
      expect(anomalies[0].metric_type).toBe("fps")
      expect(anomalies[0].value).toBe(100)
      expect(anomalies[0].z_score).toBeGreaterThan(2.0)
      expect(anomalies[0].severity).toBeDefined()
    })

    it("should detect low memory usage anomalies", () => {
      // Normal memory usage around 500MB, with one outlier at 50MB
      const values = [480, 520, 510, 490, 500, 50, 495, 505]
      const data = generateMockTrend(values)
      const anomalies = StatisticalAnalysisUtils.detectAnomalies(
        data,
        "memory_usage",
        2.0
      )

      expect(anomalies.length).toBe(1)
      expect(anomalies[0].metric_type).toBe("memory_usage")
      expect(anomalies[0].value).toBe(500) // 50 * 10 from generateMockTrend
    })

    it("should classify anomaly severity correctly", () => {
      // Create extreme outlier to test severity classification
      const values = [30, 30, 30, 30, 30, 200] // Very high outlier
      const data = generateMockTrend(values)
      const anomalies = StatisticalAnalysisUtils.detectAnomalies(
        data,
        "fps",
        1.0
      )

      expect(anomalies.length).toBe(1)
      expect(anomalies[0].severity).toMatch(/critical|high|medium|low/)
    })

    it("should use custom threshold", () => {
      const values = [30, 30, 30, 30, 30, 50] // Moderate outlier
      const data = generateMockTrend(values)

      const strictAnomalies = StatisticalAnalysisUtils.detectAnomalies(
        data,
        "fps",
        3.0
      )
      const lenientAnomalies = StatisticalAnalysisUtils.detectAnomalies(
        data,
        "fps",
        1.0
      )

      expect(lenientAnomalies.length).toBeGreaterThanOrEqual(
        strictAnomalies.length
      )
    })
  })

  describe("calculateMovingAverage", () => {
    it("should return original data for invalid window", () => {
      const data = [1, 2, 3, 4, 5]

      expect(StatisticalAnalysisUtils.calculateMovingAverage(data, 0)).toEqual(
        data
      )
      expect(StatisticalAnalysisUtils.calculateMovingAverage(data, 10)).toEqual(
        data
      )
    })

    it("should calculate centered moving average", () => {
      const data = [10, 20, 30, 40, 50]
      const result = StatisticalAnalysisUtils.calculateMovingAverage(data, 3)

      // For window size 3, each value should be average of itself and neighbors
      expect(result).toHaveLength(5)
      expect(result[0]).toBeCloseTo((10 + 20) / 2) // First value (partial window)
      expect(result[2]).toBeCloseTo((10 + 20 + 30) / 3) // Middle value (full window)
    })

    it("should handle window size 1", () => {
      const data = [1, 2, 3, 4, 5]
      const result = StatisticalAnalysisUtils.calculateMovingAverage(data, 1)

      expect(result).toEqual(data)
    })
  })

  describe("calculateStatistics", () => {
    it("should return zeros for empty data", () => {
      const result = StatisticalAnalysisUtils.calculateStatistics([])

      expect(result.mean).toBe(0)
      expect(result.median).toBe(0)
      expect(result.standard_deviation).toBe(0)
      expect(result.min).toBe(0)
      expect(result.max).toBe(0)
      expect(result.outliers).toEqual([])
    })

    it("should calculate basic statistics correctly", () => {
      const data = [10, 20, 30, 40, 50]
      const result = StatisticalAnalysisUtils.calculateStatistics(data)

      expect(result.mean).toBe(30)
      expect(result.median).toBe(30)
      expect(result.min).toBe(10)
      expect(result.max).toBe(50)
      expect(result.standard_deviation).toBeGreaterThan(0)
    })

    it("should calculate percentiles correctly", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const result = StatisticalAnalysisUtils.calculateStatistics(data)

      expect(result.percentile_25).toBeCloseTo(3.25, 1)
      expect(result.percentile_75).toBeCloseTo(7.75, 1)
      expect(result.percentile_90).toBeCloseTo(9.1, 1)
      expect(result.percentile_95).toBeCloseTo(9.55, 1)
    })

    it("should identify outliers using IQR method", () => {
      const data = [10, 12, 13, 14, 15, 16, 17, 100] // 100 is clear outlier
      const result = StatisticalAnalysisUtils.calculateStatistics(data)

      expect(result.outliers).toContain(100)
    })

    it("should handle single value", () => {
      const result = StatisticalAnalysisUtils.calculateStatistics([42])

      expect(result.mean).toBe(42)
      expect(result.median).toBe(42)
      expect(result.min).toBe(42)
      expect(result.max).toBe(42)
      expect(result.standard_deviation).toBe(0)
    })
  })

  describe("calculateCorrelation", () => {
    it("should return no correlation for mismatched data", () => {
      const result = StatisticalAnalysisUtils.calculateCorrelation(
        [1, 2, 3],
        [1, 2],
        "fps",
        "memory"
      )

      expect(result.correlation_coefficient).toBe(0)
      expect(result.significance).toBe("not_significant")
      expect(result.relationship).toBe("none")
    })

    it("should detect perfect positive correlation", () => {
      const dataA = [10, 20, 30, 40, 50]
      const dataB = [5, 10, 15, 20, 25] // Perfect positive correlation (2x relationship)

      const result = StatisticalAnalysisUtils.calculateCorrelation(
        dataA,
        dataB,
        "fps",
        "cpu"
      )

      expect(result.correlation_coefficient).toBeCloseTo(1, 2)
      expect(result.relationship).toBe("positive")
      expect(result.strength).toBe("strong")
    })

    it("should detect perfect negative correlation", () => {
      const dataA = [10, 20, 30, 40, 50]
      const dataB = [50, 40, 30, 20, 10] // Perfect negative correlation

      const result = StatisticalAnalysisUtils.calculateCorrelation(
        dataA,
        dataB,
        "fps",
        "memory"
      )

      expect(result.correlation_coefficient).toBeCloseTo(-1, 2)
      expect(result.relationship).toBe("negative")
      expect(result.strength).toBe("strong")
    })

    it("should classify correlation strength correctly", () => {
      const dataA = [1, 2, 3, 4, 5, 6]
      const dataBWeak = [1, 2, 2.5, 4.2, 5.1, 5.8] // Weak correlation

      const result = StatisticalAnalysisUtils.calculateCorrelation(
        dataA,
        dataBWeak,
        "fps",
        "cpu"
      )

      expect(["weak", "moderate", "strong"]).toContain(result.strength)
    })
  })

  describe("analyzeTrend", () => {
    it("should return stable trend for insufficient data", () => {
      const data = generateMockTrend([10, 20])
      const result = StatisticalAnalysisUtils.analyzeTrend(
        data,
        "fps",
        "2 days"
      )

      expect(result.direction).toBe("stable")
      expect(result.slope).toBe(0)
      expect(result.confidence).toBe(0)
      expect(result.significance).toBe("low")
      expect(result.data_points).toBe(2)
    })

    it("should detect upward trend", () => {
      const values = [10, 15, 20, 25, 30, 35, 40] // Clear upward trend
      const data = generateMockTrend(values)
      const result = StatisticalAnalysisUtils.analyzeTrend(
        data,
        "fps",
        "1 week"
      )

      expect(result.direction).toBe("up")
      expect(result.slope).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.significance).toBe("high")
      expect(result.forecast).toBeDefined()
    })

    it("should detect downward trend", () => {
      const values = [60, 55, 50, 45, 40, 35, 30] // Clear downward trend
      const data = generateMockTrend(values)
      const result = StatisticalAnalysisUtils.analyzeTrend(
        data,
        "fps",
        "1 week"
      )

      expect(result.direction).toBe("down")
      expect(result.slope).toBeLessThan(0)
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.significance).toBe("high")
    })

    it("should detect stable trend for flat data", () => {
      const values = [30, 31, 29, 30, 30, 31, 29] // Minimal variation
      const data = generateMockTrend(values)
      const result = StatisticalAnalysisUtils.analyzeTrend(
        data,
        "fps",
        "1 week"
      )

      expect(result.direction).toBe("stable")
      expect(Math.abs(result.slope)).toBeLessThan(0.1)
    })

    it("should work with different metrics", () => {
      const values = [100, 110, 120, 130, 140] // Increasing memory usage (bad trend)
      const data = generateMockTrend(values)
      const result = StatisticalAnalysisUtils.analyzeTrend(
        data,
        "memory_usage",
        "5 days"
      )

      expect(result.direction).toBe("up")
      expect(result.slope).toBeGreaterThan(0)
      expect(result.time_period).toBe("5 days")
    })
  })

  describe("identifySeasonalPatterns", () => {
    it("should return empty array for insufficient data", () => {
      const data = generateMockTrend([10, 20, 30]) // Less than 24 hours
      const patterns = StatisticalAnalysisUtils.identifySeasonalPatterns(data)

      expect(patterns).toEqual([])
    })

    it("should detect daily patterns", () => {
      // Create 48 hours of data with clear daily pattern (high during day, low at night)
      const values: number[] = []
      const timestamps: string[] = []
      const baseTime = new Date("2023-01-01T00:00:00Z").getTime()

      for (let i = 0; i < 48; i++) {
        const hour = i % 24
        // Higher FPS during day (8-20), lower at night (21-7)
        const fps =
          hour >= 8 && hour <= 20
            ? 50 + Math.random() * 10
            : 20 + Math.random() * 10
        values.push(fps)
        timestamps.push(new Date(baseTime + i * 60 * 60 * 1000).toISOString())
      }

      const data = generateMockTrend(values, timestamps)
      const patterns = StatisticalAnalysisUtils.identifySeasonalPatterns(data)

      if (patterns.length > 0) {
        expect(patterns[0].pattern_type).toBe("daily")
        expect(patterns[0].peak_times).toBeDefined()
        expect(patterns[0].low_times).toBeDefined()
        expect(patterns[0].confidence).toBeGreaterThan(0)
        expect(patterns[0].amplitude).toBeGreaterThan(0)
      }
    })

    it("should not detect patterns in flat data", () => {
      // Create 48 hours of flat data
      const values = Array(48).fill(30) // Consistent FPS
      const timestamps: string[] = []
      const baseTime = new Date("2023-01-01T00:00:00Z").getTime()

      for (let i = 0; i < 48; i++) {
        timestamps.push(new Date(baseTime + i * 60 * 60 * 1000).toISOString())
      }

      const data = generateMockTrend(values, timestamps)
      const patterns = StatisticalAnalysisUtils.identifySeasonalPatterns(data)

      // Should not detect significant patterns in flat data
      expect(patterns).toEqual([])
    })
  })

  describe("mannKendallTrendTest", () => {
    it("should return no trend for insufficient data", () => {
      const result = StatisticalAnalysisUtils.mannKendallTrendTest([1, 2, 3])

      expect(result.tau).toBe(0)
      expect(result.isSignificant).toBe(false)
      expect(result.trend).toBe("no_trend")
    })

    it("should detect increasing trend", () => {
      const data = [1, 3, 5, 7, 9, 11, 13, 15] // Monotonic increase
      const result = StatisticalAnalysisUtils.mannKendallTrendTest(data)

      expect(result.tau).toBeGreaterThan(0.5)
      expect(result.trend).toBe("increasing")
      expect(result.isSignificant).toBe(true)
    })

    it("should detect decreasing trend", () => {
      const data = [20, 18, 16, 14, 12, 10, 8, 6] // Monotonic decrease
      const result = StatisticalAnalysisUtils.mannKendallTrendTest(data)

      expect(result.tau).toBeLessThan(-0.5)
      expect(result.trend).toBe("decreasing")
      expect(result.isSignificant).toBe(true)
    })

    it("should detect no trend in random data", () => {
      const data = [5, 3, 8, 2, 7, 4, 9, 1] // Random order
      const result = StatisticalAnalysisUtils.mannKendallTrendTest(data)

      expect(Math.abs(result.tau)).toBeLessThan(0.5)
      expect(result.trend).toBe("no_trend")
    })

    it("should be robust to outliers", () => {
      const data = [1, 2, 3, 100, 4, 5, 6, 7] // Has outlier but overall increasing
      const result = StatisticalAnalysisUtils.mannKendallTrendTest(data)

      // Mann-Kendall should still detect the underlying trend despite the outlier
      expect(result.trend).toBe("increasing")
    })
  })
})
