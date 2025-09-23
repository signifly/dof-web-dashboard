import { MetricsTrend } from "@/lib/performance-data"
import {
  TrendAnalysis,
  AnomalyDetection,
  StatisticalResult,
  CorrelationAnalysis,
  SeasonalPattern,
} from "@/types/insights"

export interface LinearRegressionResult {
  slope: number
  intercept: number
  rSquared: number
  correlation: number
  pValue: number
  isSignificant: boolean
}

export class StatisticalAnalysisUtils {
  /**
   * Calculate linear regression for trend analysis
   */
  static calculateLinearRegression(data: number[]): LinearRegressionResult {
    if (data.length < 3) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        correlation: 0,
        pValue: 1,
        isSignificant: false,
      }
    }

    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i)

    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n
    const yMean = data.reduce((sum, val) => sum + val, 0) / n

    // Calculate slope and intercept
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (data[i] - yMean)
      denominator += (x[i] - xMean) ** 2
    }

    const slope = denominator === 0 ? 0 : numerator / denominator
    const intercept = yMean - slope * xMean

    // Calculate R²
    let totalSumSquares = 0
    let residualSumSquares = 0

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept
      totalSumSquares += (data[i] - yMean) ** 2
      residualSumSquares += (data[i] - predicted) ** 2
    }

    const rSquared =
      totalSumSquares === 0 ? 0 : 1 - residualSumSquares / totalSumSquares
    const correlation = Math.sqrt(Math.abs(rSquared)) * Math.sign(slope)

    // Simple significance test (approximate)
    const standardError =
      Math.sqrt(residualSumSquares / (n - 2)) / Math.sqrt(denominator)
    const tStat = Math.abs(slope / standardError)
    const pValue = this.approximatePValue(tStat, n - 2)
    const isSignificant = pValue < 0.05 && Math.abs(rSquared) > 0.1

    return {
      slope,
      intercept,
      rSquared,
      correlation,
      pValue,
      isSignificant,
    }
  }

  /**
   * Detect anomalies using Z-score method
   */
  static detectAnomalies(
    data: MetricsTrend[],
    metric: keyof Pick<MetricsTrend, "fps" | "memory_usage" | "cpu_usage">,
    threshold: number = 2.5
  ): AnomalyDetection[] {
    const values = data
      .map(d => d[metric] as number)
      .filter(v => !isNaN(v) && v !== null)

    if (values.length < 5) return []

    const stats = this.calculateStatistics(values)
    const anomalies: AnomalyDetection[] = []

    data.forEach((point, index) => {
      const value = point[metric] as number
      if (isNaN(value) || value === null) return

      const zScore = Math.abs((value - stats.mean) / stats.standard_deviation)

      if (zScore > threshold) {
        const severity = this.classifyAnomalySeverity(zScore)

        anomalies.push({
          id: `anomaly_${metric}_${index}_${Date.now()}`,
          metric_type: metric,
          value,
          expected_value: stats.mean,
          deviation: value - stats.mean,
          z_score: zScore,
          severity,
          timestamp: point.timestamp,
          context: {
            screen_name: point.screen_name,
            percentile_rank: this.calculatePercentileRank(value, values),
          },
        })
      }
    })

    return anomalies
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(data: number[], window: number): number[] {
    if (window <= 0 || window > data.length) return data

    const result: number[] = []

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2))
      const end = Math.min(data.length, start + window)
      const windowData = data.slice(start, end)
      const average =
        windowData.reduce((sum, val) => sum + val, 0) / windowData.length
      result.push(average)
    }

    return result
  }

  /**
   * Calculate comprehensive statistics
   */
  static calculateStatistics(data: number[]): StatisticalResult {
    if (data.length === 0) {
      return {
        mean: 0,
        median: 0,
        standard_deviation: 0,
        min: 0,
        max: 0,
        percentile_25: 0,
        percentile_75: 0,
        percentile_90: 0,
        percentile_95: 0,
        outliers: [],
      }
    }

    const sorted = [...data].sort((a, b) => a - b)
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length

    // Calculate standard deviation
    const variance =
      data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length
    const standard_deviation = Math.sqrt(variance)

    // Calculate percentiles
    const getPercentile = (p: number) => {
      const index = (p / 100) * (sorted.length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index % 1

      if (upper >= sorted.length) return sorted[sorted.length - 1]
      return sorted[lower] * (1 - weight) + sorted[upper] * weight
    }

    // Identify outliers (IQR method)
    const q1 = getPercentile(25)
    const q3 = getPercentile(75)
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    const outliers = data.filter(val => val < lowerBound || val > upperBound)

    return {
      mean,
      median: getPercentile(50),
      standard_deviation,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentile_25: q1,
      percentile_75: q3,
      percentile_90: getPercentile(90),
      percentile_95: getPercentile(95),
      outliers,
    }
  }

  /**
   * Calculate correlation between two metrics
   */
  static calculateCorrelation(
    dataA: number[],
    dataB: number[],
    metricA: string,
    metricB: string
  ): CorrelationAnalysis {
    if (dataA.length !== dataB.length || dataA.length < 3) {
      return {
        metric_a: metricA,
        metric_b: metricB,
        correlation_coefficient: 0,
        p_value: 1,
        significance: "not_significant",
        relationship: "none",
        strength: "weak",
      }
    }

    const n = dataA.length
    const meanA = dataA.reduce((sum, val) => sum + val, 0) / n
    const meanB = dataB.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let denominatorA = 0
    let denominatorB = 0

    for (let i = 0; i < n; i++) {
      const diffA = dataA[i] - meanA
      const diffB = dataB[i] - meanB
      numerator += diffA * diffB
      denominatorA += diffA ** 2
      denominatorB += diffB ** 2
    }

    const correlation = numerator / Math.sqrt(denominatorA * denominatorB)

    // Approximate p-value calculation
    const tStat =
      Math.abs(correlation) * Math.sqrt((n - 2) / (1 - correlation ** 2))
    const pValue = this.approximatePValue(tStat, n - 2)

    return {
      metric_a: metricA,
      metric_b: metricB,
      correlation_coefficient: correlation,
      p_value: pValue,
      significance: pValue < 0.05 ? "significant" : "not_significant",
      relationship:
        Math.abs(correlation) < 0.1
          ? "none"
          : correlation > 0
            ? "positive"
            : "negative",
      strength:
        Math.abs(correlation) > 0.7
          ? "strong"
          : Math.abs(correlation) > 0.3
            ? "moderate"
            : "weak",
    }
  }

  /**
   * Analyze trend significance
   */
  static analyzeTrend(
    data: MetricsTrend[],
    metric: keyof Pick<MetricsTrend, "fps" | "memory_usage" | "cpu_usage">,
    timePeriod: string
  ): TrendAnalysis {
    const values = data
      .map(d => d[metric] as number)
      .filter(v => !isNaN(v) && v !== null)

    if (values.length < 5) {
      return {
        direction: "stable",
        slope: 0,
        confidence: 0,
        significance: "low",
        r_squared: 0,
        data_points: values.length,
        time_period: timePeriod,
      }
    }

    const regression = this.calculateLinearRegression(values)
    const direction =
      Math.abs(regression.slope) < 0.01
        ? "stable"
        : regression.slope > 0
          ? "up"
          : "down"

    const significance =
      regression.isSignificant && Math.abs(regression.rSquared) > 0.3
        ? "high"
        : regression.isSignificant && Math.abs(regression.rSquared) > 0.1
          ? "medium"
          : "low"

    // Simple forecast (next value prediction)
    const forecast = regression.slope * values.length + regression.intercept

    return {
      direction,
      slope: regression.slope,
      confidence: Math.abs(regression.correlation),
      significance,
      r_squared: regression.rSquared,
      forecast,
      data_points: values.length,
      time_period: timePeriod,
    }
  }

  /**
   * Detect seasonal patterns (basic implementation)
   */
  static identifySeasonalPatterns(data: MetricsTrend[]): SeasonalPattern[] {
    // This is a simplified implementation
    // In a production system, you might use more sophisticated algorithms like FFT

    const patterns: SeasonalPattern[] = []

    // Daily pattern analysis (24 hour cycle)
    if (data.length >= 24) {
      const hourlyAverages = new Array(24).fill(0)
      const hourlyCounts = new Array(24).fill(0)

      data.forEach(point => {
        const hour = new Date(point.timestamp).getHours()
        hourlyAverages[hour] += point.fps
        hourlyCounts[hour]++
      })

      for (let i = 0; i < 24; i++) {
        if (hourlyCounts[i] > 0) {
          hourlyAverages[i] /= hourlyCounts[i]
        }
      }

      const mean = hourlyAverages.reduce((sum, val) => sum + val, 0) / 24
      const variance =
        hourlyAverages.reduce((sum, val) => sum + (val - mean) ** 2, 0) / 24
      const amplitude = Math.sqrt(variance)

      if (amplitude > mean * 0.1) {
        // If variation is > 10% of mean
        const peakHours = hourlyAverages
          .map((avg, hour) => ({ hour, avg }))
          .filter(({ avg }) => avg > mean + amplitude * 0.5)
          .map(({ hour }) => `${hour}:00`)

        const lowHours = hourlyAverages
          .map((avg, hour) => ({ hour, avg }))
          .filter(({ avg }) => avg < mean - amplitude * 0.5)
          .map(({ hour }) => `${hour}:00`)

        patterns.push({
          pattern_type: "daily",
          confidence: Math.min(amplitude / mean, 1),
          peak_times: peakHours,
          low_times: lowHours,
          amplitude,
          significance: amplitude / mean,
        })
      }
    }

    return patterns
  }

  /**
   * Helper: Approximate p-value calculation
   */
  private static approximatePValue(
    tStat: number,
    degreesOfFreedom: number
  ): number {
    // This is a very rough approximation
    // In production, you'd want to use a proper t-distribution lookup
    if (degreesOfFreedom <= 0) return 1
    if (tStat > 3) return 0.001
    if (tStat > 2.5) return 0.01
    if (tStat > 2) return 0.05
    if (tStat > 1.5) return 0.1
    return 0.2
  }

  /**
   * Helper: Classify anomaly severity based on z-score
   */
  private static classifyAnomalySeverity(
    zScore: number
  ): "critical" | "high" | "medium" | "low" {
    if (zScore > 4) return "critical"
    if (zScore > 3) return "high"
    if (zScore > 2.5) return "medium"
    return "low"
  }

  /**
   * Helper: Calculate percentile rank of a value
   */
  private static calculatePercentileRank(
    value: number,
    data: number[]
  ): number {
    const sorted = [...data].sort((a, b) => a - b)
    const index = sorted.findIndex(v => v >= value)
    return index === -1 ? 100 : (index / sorted.length) * 100
  }

  /**
   * Perform Mann-Kendall trend test (more robust than linear regression)
   */
  static mannKendallTrendTest(data: number[]): {
    tau: number
    isSignificant: boolean
    trend: "increasing" | "decreasing" | "no_trend"
  } {
    if (data.length < 4) {
      return { tau: 0, isSignificant: false, trend: "no_trend" }
    }

    const n = data.length
    let s = 0

    // Calculate Kendall's S statistic
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        if (data[j] > data[i]) s++
        else if (data[j] < data[i]) s--
      }
    }

    // Calculate Kendall's tau
    const denominator = (n * (n - 1)) / 2
    const tau = s / denominator

    // Simple significance test (approximate)
    const variance = (n * (n - 1) * (2 * n + 5)) / 18
    const zScore = Math.abs(s) / Math.sqrt(variance)
    const isSignificant = zScore > 1.96 // 95% confidence

    const trend =
      Math.abs(tau) < 0.1 ? "no_trend" : tau > 0 ? "increasing" : "decreasing"

    return { tau, isSignificant, trend }
  }
}
