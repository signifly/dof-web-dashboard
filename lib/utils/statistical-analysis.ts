import { MetricsTrend } from "@/lib/performance-data"
import {
  TrendAnalysis,
  AnomalyDetection,
  StatisticalResult,
  CorrelationAnalysis,
  SeasonalPattern,
  TimePeriod,
  TimeSeriesDecomposition,
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
          pattern_id: `daily_${Date.now()}`,
          pattern_type: "daily",
          metric_type: "fps",
          confidence: Math.min(amplitude / mean, 1),
          peak_periods: peakHours.map(hour => ({
            start: hour,
            end: hour,
            average_value: mean + amplitude * 0.5,
            frequency: 1,
          })),
          low_periods: lowHours.map(hour => ({
            start: hour,
            end: hour,
            average_value: mean - amplitude * 0.5,
            frequency: 1,
          })),
          amplitude,
          next_predicted_peak: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          next_predicted_low: new Date(
            Date.now() + 12 * 60 * 60 * 1000
          ).toISOString(),
          seasonal_strength: amplitude / mean,
          detection_method: "pattern_matching",
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

/**
 * Enhanced Time Series Analysis for Issue #30
 * Provides advanced seasonal pattern detection, exponential smoothing, and forecasting
 */
export class TimeSeriesAnalysis {
  /**
   * Detect seasonal patterns in performance data using multiple methods
   */
  static detectSeasonalPatterns(
    data: MetricsTrend[],
    patternTypes: ("hourly" | "daily" | "weekly" | "monthly")[] = [
      "daily",
      "weekly",
    ],
    metric: keyof Pick<
      MetricsTrend,
      "fps" | "memory_usage" | "cpu_usage"
    > = "fps"
  ): SeasonalPattern[] {
    if (data.length < 24) return [] // Need minimum data for pattern detection

    const patterns: SeasonalPattern[] = []

    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    for (const patternType of patternTypes) {
      const pattern = this.detectSinglePatternType(
        sortedData,
        patternType,
        metric
      )
      if (pattern) {
        patterns.push(pattern)
      }
    }

    return patterns.filter(p => p.confidence > 0.3) // Only return confident patterns
  }

  /**
   * Exponential smoothing for trend prediction
   */
  static exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    periods: number = 5
  ): number[] {
    if (data.length === 0) return []

    const smoothed: number[] = []
    let s = data[0] // Initialize with first value

    // Smooth existing data
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        smoothed.push(s)
      } else {
        s = alpha * data[i] + (1 - alpha) * s
        smoothed.push(s)
      }
    }

    // Forecast future periods
    const forecast: number[] = [...smoothed]
    const lastSmoothed = s

    for (let i = 0; i < periods; i++) {
      forecast.push(lastSmoothed)
    }

    return forecast
  }

  /**
   * Weighted moving average forecasting
   */
  static weightedMovingAverage(
    data: number[],
    weights: number[] = [0.5, 0.3, 0.2],
    forecastPeriods: number = 3
  ): number[] {
    if (data.length < weights.length) return data

    const result: number[] = []

    // Calculate weighted moving averages for existing data
    for (let i = weights.length - 1; i < data.length; i++) {
      let weightedSum = 0
      let weightSum = 0

      for (let j = 0; j < weights.length; j++) {
        weightedSum += data[i - j] * weights[j]
        weightSum += weights[j]
      }

      result.push(weightedSum / weightSum)
    }

    // Forecast future periods
    for (let i = 0; i < forecastPeriods; i++) {
      const recentData = result.slice(-weights.length)
      let weightedSum = 0
      let weightSum = 0

      for (let j = 0; j < weights.length && j < recentData.length; j++) {
        weightedSum += recentData[recentData.length - 1 - j] * weights[j]
        weightSum += weights[j]
      }

      result.push(weightedSum / weightSum)
    }

    return result
  }

  /**
   * Seasonal decomposition using moving averages
   */
  static seasonalDecomposition(
    data: MetricsTrend[],
    seasonalPeriod: number = 7, // Default: weekly pattern
    metric: keyof Pick<
      MetricsTrend,
      "fps" | "memory_usage" | "cpu_usage"
    > = "fps"
  ): TimeSeriesDecomposition {
    const values = data.map(d => d[metric] as number).filter(v => !isNaN(v))

    if (values.length < seasonalPeriod * 2) {
      return {
        trend: values,
        seasonal: new Array(values.length).fill(0),
        residual: new Array(values.length).fill(0),
        forecast: [],
        seasonal_periods: [seasonalPeriod],
        trend_strength: 0,
        seasonal_strength: 0,
      }
    }

    // Calculate trend using centered moving average
    const trend = this.calculateCenteredMovingAverage(values, seasonalPeriod)

    // Calculate seasonal component
    const detrended = values.map(
      (val, i) => val - (trend[i] || trend[trend.length - 1])
    )
    const seasonal = this.extractSeasonalComponent(detrended, seasonalPeriod)

    // Calculate residual
    const residual = values.map(
      (val, i) => val - (trend[i] || 0) - (seasonal[i % seasonalPeriod] || 0)
    )

    // Generate forecast
    const lastTrendValue = trend[trend.length - 1] || 0
    const forecastPeriods = Math.min(seasonalPeriod, 14) // Forecast up to 2 weeks
    const forecast: number[] = []

    for (let i = 0; i < forecastPeriods; i++) {
      const seasonalComponent = seasonal[i % seasonalPeriod] || 0
      forecast.push(lastTrendValue + seasonalComponent)
    }

    // Calculate strength metrics
    const trendStrength = this.calculateTrendStrength(values, trend)
    const seasonalStrength = this.calculateSeasonalStrength(
      values,
      seasonal,
      seasonalPeriod
    )

    return {
      trend,
      seasonal,
      residual,
      forecast,
      seasonal_periods: [seasonalPeriod],
      trend_strength: trendStrength,
      seasonal_strength: seasonalStrength,
    }
  }

  /**
   * Enhanced seasonal pattern detection for a specific pattern type
   */
  private static detectSinglePatternType(
    data: MetricsTrend[],
    patternType: "hourly" | "daily" | "weekly" | "monthly",
    metric: keyof Pick<MetricsTrend, "fps" | "memory_usage" | "cpu_usage">
  ): SeasonalPattern | null {
    const periods = this.getPeriodsForPatternType(patternType)
    const groupedData = this.groupDataByPeriod(data, patternType, metric)

    if (Object.keys(groupedData).length < periods / 2) return null

    // Calculate statistics for each period
    const periodStats: {
      [key: string]: { avg: number; count: number; values: number[] }
    } = {}

    for (const [period, values] of Object.entries(groupedData)) {
      const validValues = values.filter(v => !isNaN(v))
      if (validValues.length > 0) {
        periodStats[period] = {
          avg:
            validValues.reduce((sum, val) => sum + val, 0) / validValues.length,
          count: validValues.length,
          values: validValues,
        }
      }
    }

    const avgValues = Object.values(periodStats).map(stat => stat.avg)
    const overallMean =
      avgValues.reduce((sum, val) => sum + val, 0) / avgValues.length
    const variance =
      avgValues.reduce((sum, val) => sum + (val - overallMean) ** 2, 0) /
      avgValues.length
    const amplitude = Math.sqrt(variance)

    // Check if pattern is significant
    const significance = amplitude / overallMean
    if (significance < 0.1) return null // Pattern not significant enough

    // Identify peaks and lows
    const threshold = amplitude * 0.5
    const peakPeriods: TimePeriod[] = []
    const lowPeriods: TimePeriod[] = []

    for (const [period, stats] of Object.entries(periodStats)) {
      if (stats.avg > overallMean + threshold) {
        peakPeriods.push({
          start: this.formatPeriodTime(period, patternType, true),
          end: this.formatPeriodTime(period, patternType, false),
          average_value: stats.avg,
          frequency: stats.count,
        })
      } else if (stats.avg < overallMean - threshold) {
        lowPeriods.push({
          start: this.formatPeriodTime(period, patternType, true),
          end: this.formatPeriodTime(period, patternType, false),
          average_value: stats.avg,
          frequency: stats.count,
        })
      }
    }

    // Calculate confidence based on data quality and pattern strength
    const dataQuality = Math.min(
      1,
      Object.values(periodStats).reduce((sum, stat) => sum + stat.count, 0) /
        (periods * 5)
    )
    const patternStrength = Math.min(1, significance * 2)
    const confidence = (dataQuality + patternStrength) / 2

    // Predict next peak and low
    const nextPeak = this.predictNextOccurrence(peakPeriods, patternType)
    const nextLow = this.predictNextOccurrence(lowPeriods, patternType)

    return {
      pattern_id: `${patternType}_${metric}_${Date.now()}`,
      pattern_type: patternType,
      metric_type: metric,
      peak_periods: peakPeriods,
      low_periods: lowPeriods,
      amplitude,
      confidence,
      next_predicted_peak: nextPeak,
      next_predicted_low: nextLow,
      seasonal_strength: significance,
      detection_method: "pattern_matching",
    }
  }

  /**
   * Helper methods for seasonal analysis
   */
  private static getPeriodsForPatternType(
    patternType: "hourly" | "daily" | "weekly" | "monthly"
  ): number {
    switch (patternType) {
      case "hourly":
        return 24
      case "daily":
        return 7
      case "weekly":
        return 4
      case "monthly":
        return 12
      default:
        return 7
    }
  }

  private static groupDataByPeriod(
    data: MetricsTrend[],
    patternType: "hourly" | "daily" | "weekly" | "monthly",
    metric: keyof Pick<MetricsTrend, "fps" | "memory_usage" | "cpu_usage">
  ): { [key: string]: number[] } {
    const grouped: { [key: string]: number[] } = {}

    data.forEach(point => {
      const date = new Date(point.timestamp)
      let periodKey: string

      switch (patternType) {
        case "hourly":
          periodKey = date.getHours().toString()
          break
        case "daily":
          periodKey = date.getDay().toString() // 0-6, Sunday to Saturday
          break
        case "weekly":
          // Week of month (1-4)
          const weekOfMonth = Math.ceil(date.getDate() / 7)
          periodKey = weekOfMonth.toString()
          break
        case "monthly":
          periodKey = date.getMonth().toString() // 0-11
          break
        default:
          periodKey = "0"
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = []
      }

      const value = point[metric] as number
      if (!isNaN(value)) {
        grouped[periodKey].push(value)
      }
    })

    return grouped
  }

  private static formatPeriodTime(
    period: string,
    patternType: "hourly" | "daily" | "weekly" | "monthly",
    isStart: boolean
  ): string {
    const periodNum = parseInt(period)
    // const _now = new Date() // Reserved for future date-based formatting

    switch (patternType) {
      case "hourly":
        return `${period.padStart(2, "0")}:${isStart ? "00" : "59"}`
      case "daily":
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ]
        return dayNames[periodNum] || period
      case "weekly":
        return `Week ${period} of month`
      case "monthly":
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ]
        return monthNames[periodNum] || period
      default:
        return period
    }
  }

  private static predictNextOccurrence(
    periods: TimePeriod[],
    patternType: "hourly" | "daily" | "weekly" | "monthly"
  ): string {
    if (periods.length === 0) return "No prediction available"

    const now = new Date()

    // For simplicity, predict the next occurrence of the most frequent period
    const mostFrequent = periods.sort((a, b) => b.frequency - a.frequency)[0]

    switch (patternType) {
      case "hourly":
        const nextHour = new Date(now)
        nextHour.setHours(parseInt(mostFrequent.start.split(":")[0]), 0, 0, 0)
        if (nextHour <= now) nextHour.setDate(nextHour.getDate() + 1)
        return nextHour.toISOString()
      case "daily":
        const nextDay = new Date(now)
        const targetDay = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].indexOf(mostFrequent.start)
        if (targetDay === -1) return "Next occurrence of " + mostFrequent.start

        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7
        nextDay.setDate(now.getDate() + daysUntilTarget)
        return nextDay.toISOString()
      default:
        return `Next predicted: ${mostFrequent.start}`
    }
  }

  private static calculateCenteredMovingAverage(
    data: number[],
    period: number
  ): number[] {
    const result: number[] = []
    const halfPeriod = Math.floor(period / 2)

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - halfPeriod)
      const end = Math.min(data.length, i + halfPeriod + 1)
      const window = data.slice(start, end)
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length
      result.push(avg)
    }

    return result
  }

  private static extractSeasonalComponent(
    detrended: number[],
    period: number
  ): number[] {
    const seasonal: number[] = new Array(period).fill(0)
    const counts: number[] = new Array(period).fill(0)

    // Calculate average for each seasonal period
    for (let i = 0; i < detrended.length; i++) {
      const seasonalIndex = i % period
      seasonal[seasonalIndex] += detrended[i]
      counts[seasonalIndex]++
    }

    // Normalize by count
    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonal[i] /= counts[i]
      }
    }

    return seasonal
  }

  private static calculateTrendStrength(
    original: number[],
    trend: number[]
  ): number {
    if (original.length === 0 || trend.length === 0) return 0

    const originalVariance =
      StatisticalAnalysisUtils.calculateStatistics(original)
        .standard_deviation ** 2
    const trendVariance =
      StatisticalAnalysisUtils.calculateStatistics(trend).standard_deviation **
      2

    return originalVariance > 0
      ? Math.min(1, trendVariance / originalVariance)
      : 0
  }

  private static calculateSeasonalStrength(
    original: number[],
    seasonal: number[],
    period: number
  ): number {
    if (original.length === 0 || seasonal.length === 0) return 0

    // Expand seasonal component to match original length
    const expandedSeasonal = original.map((_, i) => seasonal[i % period] || 0)

    const originalVariance =
      StatisticalAnalysisUtils.calculateStatistics(original)
        .standard_deviation ** 2
    const seasonalVariance =
      StatisticalAnalysisUtils.calculateStatistics(expandedSeasonal)
        .standard_deviation ** 2

    return originalVariance > 0
      ? Math.min(1, seasonalVariance / originalVariance)
      : 0
  }
}
