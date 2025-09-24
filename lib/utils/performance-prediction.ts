import {
  RoutePerformanceData,
  RoutePerformanceSession,
} from "@/types/route-performance"
import {
  RoutePerformancePrediction,
  PredictionResult,
  LinearRegressionResult,
} from "@/types/route-analytics"
import {
  PerformancePrediction,
  PerformancePredictionModel,
  SeasonalPattern,
  TimeSeriesDecomposition,
  PredictionFactor,
} from "@/types/insights"
import { TimeSeriesAnalysis } from "./statistical-analysis"
import { MetricsTrend } from "@/lib/performance-data"

export class PerformancePredictionEngine {
  /**
   * Predict future performance for a route using linear regression
   * Target accuracy: ±15%
   */
  async predictRoutePerformance(
    route: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number }
  ): Promise<RoutePerformancePrediction> {
    // Sort sessions by timestamp for trend analysis
    const sortedSessions = route.sessions.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Generate predictions for multiple horizons
    const predictions = {
      "1d": this.predictForHorizon(sortedSessions, 1),
      "7d": this.predictForHorizon(sortedSessions, 7),
      "30d": this.predictForHorizon(sortedSessions, 30),
    }

    // Use 7-day prediction as primary
    const primaryPrediction = predictions["7d"]

    // Ensure no NaN values in final prediction
    const safeScore = isNaN(primaryPrediction.predictedScore)
      ? 50
      : primaryPrediction.predictedScore
    const safeConfidence: [number, number] = [
      isNaN(primaryPrediction.confidenceInterval[0])
        ? 30
        : primaryPrediction.confidenceInterval[0],
      isNaN(primaryPrediction.confidenceInterval[1])
        ? 70
        : primaryPrediction.confidenceInterval[1],
    ]

    return {
      route_pattern: route.routePattern,
      predicted_performance_score: safeScore,
      confidence_interval: safeConfidence,
      prediction_horizon: "7d",
      contributing_factors: this.identifyContributingFactors(
        route,
        appAverages
      ),
      recommendation_priority: this.calculateRecommendationPriority(
        primaryPrediction,
        route
      ),
      forecast_accuracy: this.estimateForecastAccuracy(sortedSessions),
      trend_direction: route.performanceTrend,
      prediction_model: "linear_regression",
    }
  }

  private predictForHorizon(
    sessions: RoutePerformanceSession[],
    horizonDays: number
  ): PredictionResult {
    if (sessions.length < 1) {
      return {
        predictedScore: 50,
        confidenceInterval: [30, 70],
        model: "insufficient_data",
      }
    }

    // Convert timestamps to days since first session
    const firstTimestamp = new Date(sessions[0].timestamp).getTime()
    const xValues = sessions.map(
      session =>
        (new Date(session.timestamp).getTime() - firstTimestamp) /
        (24 * 60 * 60 * 1000)
    )

    // Calculate performance scores for each session
    const yValues = sessions.map(session => {
      const fpsScore = Math.min(100, (session.avgFps / 60) * 100)
      const memoryScore = Math.max(0, 100 - (session.avgMemory / 1000) * 100)
      const cpuScore = Math.max(0, 100 - session.avgCpu)
      return (fpsScore + memoryScore + cpuScore) / 3
    })

    // Linear regression
    const regression = this.calculateLinearRegression(xValues, yValues)

    // Predict for future horizon
    const futureX = Math.max(...xValues) + horizonDays
    const predictedScore = regression.slope * futureX + regression.intercept

    // Calculate confidence interval (±15% target)
    const standardError = this.calculateStandardError(
      xValues,
      yValues,
      regression
    )
    const marginOfError = 1.96 * standardError // 95% confidence interval

    // Ensure no NaN values
    const safePredictedScore = isNaN(predictedScore) ? 50 : predictedScore
    const safeMarginOfError = isNaN(marginOfError) ? 20 : marginOfError
    const safeRSquared = isNaN(regression.rSquared) ? 0.5 : regression.rSquared

    return {
      predictedScore: Math.max(0, Math.min(100, safePredictedScore)),
      confidenceInterval: [
        Math.max(0, safePredictedScore - safeMarginOfError),
        Math.min(100, safePredictedScore + safeMarginOfError),
      ],
      model: "linear_regression",
      rSquared: Math.max(0, Math.min(1, safeRSquared)),
    }
  }

  private calculateLinearRegression(
    x: number[],
    y: number[]
  ): LinearRegressionResult {
    const n = x.length

    // Handle edge case: only one data point
    if (n === 1) {
      return {
        slope: 0, // No trend with single point
        intercept: y[0], // Use the actual value
        rSquared: 1, // Perfect fit with single point
      }
    }

    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)
    const sumYY = y.reduce((sum, val) => sum + val * val, 0)

    const denominator = n * sumXX - sumX * sumX

    // Handle edge case: all x values are the same (vertical line)
    if (Math.abs(denominator) < 1e-10) {
      const meanY = sumY / n
      return {
        slope: 0,
        intercept: meanY,
        rSquared: 0,
      }
    }

    const slope = (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const meanY = sumY / n
    const totalSumSquares = y.reduce((sum, val) => sum + (val - meanY) ** 2, 0)

    // Handle edge case: all y values are the same
    if (totalSumSquares === 0) {
      return { slope, intercept, rSquared: 1 }
    }

    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + (val - predicted) ** 2
    }, 0)

    const rSquared = Math.max(0, 1 - residualSumSquares / totalSumSquares)

    return { slope, intercept, rSquared }
  }

  private calculateStandardError(
    x: number[],
    y: number[],
    regression: LinearRegressionResult
  ): number {
    const n = x.length
    if (n <= 1) return 25 // Default high error for single data point
    if (n <= 2) return 20 // Default high error for insufficient data

    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = regression.slope * x[i] + regression.intercept
      return sum + (val - predicted) ** 2
    }, 0)

    return Math.sqrt(residualSumSquares / (n - 2))
  }

  private identifyContributingFactors(
    route: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number }
  ): string[] {
    const factors: string[] = []

    if (route.avgFps < appAverages.avgFps * 0.8) {
      factors.push("Below average FPS performance")
    }

    if (route.avgMemory > appAverages.avgMemory * 1.2) {
      factors.push("High memory usage pattern")
    }

    if (route.avgCpu > appAverages.avgCpu * 1.2) {
      factors.push("Elevated CPU usage")
    }

    if (route.performanceTrend === "degrading") {
      factors.push("Declining performance trend")
    }

    if (route.uniqueDevices < 3) {
      factors.push("Limited device diversity in data")
    }

    return factors.length > 0 ? factors : ["Stable performance pattern"]
  }

  private calculateRecommendationPriority(
    prediction: PredictionResult,
    route: RoutePerformanceData
  ): "high" | "medium" | "low" {
    if (prediction.predictedScore < 70 || route.riskLevel === "high") {
      return "high"
    }

    if (
      prediction.predictedScore < 85 ||
      route.performanceTrend === "degrading"
    ) {
      return "medium"
    }

    return "low"
  }

  private estimateForecastAccuracy(
    sessions: RoutePerformanceSession[]
  ): number {
    if (sessions.length < 2) return 0.6 // Lower accuracy with less data

    // Simulate accuracy based on data quality indicators
    const consistencyScore = this.calculateDataConsistency(sessions)
    const sampleSizeScore = Math.min(1, sessions.length / 20)
    const timeSpanScore = this.calculateTimeSpanScore(sessions)

    return (consistencyScore + sampleSizeScore + timeSpanScore) / 3
  }

  private calculateDataConsistency(
    sessions: RoutePerformanceSession[]
  ): number {
    if (sessions.length < 2) return 0.5

    const fpsValues = sessions.map(s => s.avgFps)
    const memoryValues = sessions.map(s => s.avgMemory)

    const fpsStdDev = this.standardDeviation(fpsValues)
    const memoryStdDev = this.standardDeviation(memoryValues)

    // Lower standard deviation = higher consistency = better accuracy
    const fpsConsistency = Math.max(0, 1 - fpsStdDev / 30)
    const memoryConsistency = Math.max(0, 1 - memoryStdDev / 200)

    return (fpsConsistency + memoryConsistency) / 2
  }

  private calculateTimeSpanScore(sessions: RoutePerformanceSession[]): number {
    if (sessions.length < 2) return 0.3

    const firstTime = new Date(sessions[0].timestamp).getTime()
    const lastTime = new Date(sessions[sessions.length - 1].timestamp).getTime()
    const timeSpanDays = (lastTime - firstTime) / (24 * 60 * 60 * 1000)

    // Better accuracy with longer time spans (up to 30 days)
    return Math.min(1, timeSpanDays / 30)
  }

  private standardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => (val - mean) ** 2)
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }

  /**
   * Enhanced Prediction Methods for Issue #30
   * Multiple prediction models with seasonal awareness
   */

  /**
   * Predict using multiple models and ensemble results
   */
  async predictWithEnsemble(
    route: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number },
    historicalTrends?: MetricsTrend[],
    models: (
      | "linear_regression"
      | "exponential_smoothing"
      | "seasonal_decomposition"
    )[] = ["linear_regression", "exponential_smoothing"]
  ): Promise<PerformancePrediction> {
    const predictions: { [key: string]: PredictionResult } = {}
    const modelWeights: { [key: string]: number } = {
      linear_regression: 0.4,
      exponential_smoothing: 0.4,
      seasonal_decomposition: 0.2,
    }

    // Generate predictions from each model
    for (const modelType of models) {
      try {
        switch (modelType) {
          case "linear_regression":
            predictions[modelType] = this.predictForHorizon(route.sessions, 7)
            break
          case "exponential_smoothing":
            predictions[modelType] = await this.predictWithTimeSeriesAnalysis(
              route,
              "7d"
            )
            break
          case "seasonal_decomposition":
            if (historicalTrends) {
              predictions[modelType] =
                await this.predictWithSeasonalDecomposition(
                  route,
                  historicalTrends
                )
            }
            break
        }
      } catch (error) {
        console.warn(`Failed to generate prediction with ${modelType}:`, error)
      }
    }

    // Ensemble the predictions
    const validPredictions = Object.entries(predictions).filter(
      ([_, pred]) => pred.predictedScore > 0
    )

    if (validPredictions.length === 0) {
      // Fallback to single linear regression
      const fallback = this.predictForHorizon(route.sessions, 7)
      return this.formatPredictionResult(route, fallback, "linear_regression")
    }

    // Weighted average ensemble
    let weightedScore = 0
    let totalWeight = 0
    let confidenceMin = Infinity
    let confidenceMax = -Infinity

    validPredictions.forEach(([modelType, prediction]) => {
      const weight = modelWeights[modelType] || 0.1
      weightedScore += prediction.predictedScore * weight
      totalWeight += weight
      confidenceMin = Math.min(confidenceMin, prediction.confidenceInterval[0])
      confidenceMax = Math.max(confidenceMax, prediction.confidenceInterval[1])
    })

    const ensemblePrediction: PredictionResult = {
      predictedScore: weightedScore / totalWeight,
      confidenceInterval: [confidenceMin, confidenceMax],
      model: "ensemble",
      rSquared:
        validPredictions.reduce(
          (sum, [_, pred]) => sum + (pred.rSquared || 0),
          0
        ) / validPredictions.length,
    }

    return this.formatPredictionResult(
      route,
      ensemblePrediction,
      "ensemble",
      validPredictions.map(([model]) => model)
    )
  }

  /**
   * Time series prediction with exponential smoothing
   */
  async predictWithTimeSeriesAnalysis(
    route: RoutePerformanceData,
    timeHorizon: "1d" | "7d" | "30d"
  ): Promise<PredictionResult> {
    const sessions = route.sessions.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    if (sessions.length < 1) {
      return {
        predictedScore: 50,
        confidenceInterval: [30, 70],
        model: "insufficient_data_exponential",
      }
    }

    // Calculate performance scores for each session
    const performanceScores = sessions.map(session => {
      const fpsScore = Math.min(100, (session.avgFps / 60) * 100)
      const memoryScore = Math.max(0, 100 - (session.avgMemory / 1000) * 100)
      const cpuScore = Math.max(0, 100 - session.avgCpu)
      return (fpsScore + memoryScore + cpuScore) / 3
    })

    // Apply exponential smoothing
    const horizonDays = timeHorizon === "1d" ? 1 : timeHorizon === "7d" ? 7 : 30
    const alpha = Math.max(0.1, 1 / horizonDays) // Adaptive smoothing parameter
    const smoothed = TimeSeriesAnalysis.exponentialSmoothing(
      performanceScores,
      alpha,
      1
    )

    const predictedScore = smoothed[smoothed.length - 1]

    // Calculate confidence interval based on recent volatility
    const recentScores = performanceScores.slice(
      -Math.min(10, performanceScores.length)
    )
    const volatility = this.standardDeviation(recentScores)
    const marginOfError = Math.min(volatility * 2, 30) // Cap at 30 points

    return {
      predictedScore: Math.max(0, Math.min(100, predictedScore)),
      confidenceInterval: [
        Math.max(0, predictedScore - marginOfError),
        Math.min(100, predictedScore + marginOfError),
      ],
      model: "exponential_smoothing",
      rSquared: this.calculateExponentialSmoothingAccuracy(
        performanceScores,
        smoothed.slice(0, -1)
      ),
    }
  }

  /**
   * Seasonal pattern-based prediction
   */
  async predictWithSeasonalDecomposition(
    route: RoutePerformanceData,
    historicalTrends: MetricsTrend[],
    seasonalPeriod: number = 7
  ): Promise<PredictionResult> {
    if (historicalTrends.length < seasonalPeriod * 2) {
      return {
        predictedScore: 50,
        confidenceInterval: [30, 70],
        model: "insufficient_data_seasonal",
      }
    }

    // Perform seasonal decomposition
    const decomposition = TimeSeriesAnalysis.seasonalDecomposition(
      historicalTrends,
      seasonalPeriod,
      "fps"
    )

    if (decomposition.forecast.length === 0) {
      return {
        predictedScore: 50,
        confidenceInterval: [30, 70],
        model: "seasonal_decomposition_failed",
      }
    }

    // Use the first forecast value (next period)
    const forecastValue = decomposition.forecast[0]

    // Convert FPS forecast to performance score
    const predictedScore = Math.min(100, (forecastValue / 60) * 100)

    // Calculate confidence based on seasonal strength and trend strength
    const confidence =
      (decomposition.seasonal_strength + decomposition.trend_strength) / 2
    const marginOfError = (1 - confidence) * 25 // Higher uncertainty = larger margin

    return {
      predictedScore: Math.max(0, Math.min(100, predictedScore)),
      confidenceInterval: [
        Math.max(0, predictedScore - marginOfError),
        Math.min(100, predictedScore + marginOfError),
      ],
      model: "seasonal_decomposition",
      rSquared: confidence,
    }
  }

  /**
   * Identify seasonal patterns for a route
   */
  detectSeasonalPatterns(
    sessions: RoutePerformanceSession[],
    historicalTrends?: MetricsTrend[]
  ): SeasonalPattern[] {
    if (historicalTrends && historicalTrends.length >= 24) {
      // Use historical trends for more comprehensive pattern detection
      return TimeSeriesAnalysis.detectSeasonalPatterns(
        historicalTrends,
        ["daily", "weekly"],
        "fps"
      )
    }

    // Fallback: Convert sessions to trend data for pattern detection
    if (sessions.length < 1) return []

    const trendData: MetricsTrend[] = sessions.map(session => ({
      timestamp: session.timestamp,
      fps: session.avgFps,
      memory_usage: session.avgMemory,
      cpu_usage: session.avgCpu,
      screen_name: "route_session",
      load_time: session.screenDuration || 1000,
    }))

    return TimeSeriesAnalysis.detectSeasonalPatterns(
      trendData,
      ["daily", "weekly"],
      "fps"
    )
  }

  /**
   * Generate comprehensive performance predictions with multiple models
   */
  async generateComprehensivePredictions(
    route: RoutePerformanceData,
    appAverages: { avgFps: number; avgMemory: number; avgCpu: number },
    historicalTrends?: MetricsTrend[]
  ): Promise<PerformancePrediction[]> {
    const predictions: PerformancePrediction[] = []
    const timeHorizons: ("1h" | "24h" | "7d" | "30d")[] = ["24h", "7d", "30d"]

    for (const horizon of timeHorizons) {
      try {
        const ensemblePrediction = await this.predictWithEnsemble(
          route,
          appAverages,
          historicalTrends,
          [
            "linear_regression",
            "exponential_smoothing",
            "seasonal_decomposition",
          ]
        )

        predictions.push({
          prediction_id: `${route.routePattern}_${horizon}_${Date.now()}`,
          metric_type: "performance_score",
          route_pattern: route.routePattern,
          predicted_value: ensemblePrediction.predicted_value,
          confidence_interval: ensemblePrediction.confidence_interval,
          time_horizon: horizon,
          probability_of_issue: this.calculateProbabilityOfIssue(
            ensemblePrediction.predicted_value
          ),
          contributing_factors: this.identifyContributingFactors(
            route,
            appAverages
          ).map((factor: string) => ({
            factor_name: factor,
            impact_weight:
              1.0 / this.identifyContributingFactors(route, appAverages).length,
            description: this.getFactorDescription(factor),
          })),
          recommended_actions: this.generatePredictiveActions(
            ensemblePrediction.predicted_value
          ),
          model_used: ensemblePrediction.model_used,
          seasonal_adjustment: historicalTrends
            ? this.calculateSeasonalAdjustment(historicalTrends)
            : undefined,
        })
      } catch (error) {
        console.warn(`Failed to generate prediction for ${horizon}:`, error)
      }
    }

    return predictions
  }

  /**
   * Helper methods for enhanced predictions
   */
  private formatPredictionResult(
    route: RoutePerformanceData,
    prediction: PredictionResult,
    modelType: string,
    modelsUsed: string[] = []
  ): PerformancePrediction {
    return {
      prediction_id: `${route.routePattern}_${modelType}_${Date.now()}`,
      metric_type: "performance_score",
      route_pattern: route.routePattern,
      predicted_value: prediction.predictedScore,
      confidence_interval: prediction.confidenceInterval,
      time_horizon: "7d",
      probability_of_issue: this.calculateProbabilityOfIssue(
        prediction.predictedScore
      ),
      contributing_factors: this.identifyContributingFactors(route, {
        avgFps: 0,
        avgMemory: 0,
        avgCpu: 0,
      }).map(factor => ({
        factor_name: factor,
        impact_weight: 1.0,
        description: this.getFactorDescription(factor),
      })),
      recommended_actions: this.generatePredictiveActions(
        prediction.predictedScore
      ),
      model_used: modelsUsed.length > 0 ? modelsUsed.join(", ") : modelType,
    }
  }

  private calculateProbabilityOfIssue(predictedScore: number): number {
    if (predictedScore < 30) return 0.9
    if (predictedScore < 50) return 0.7
    if (predictedScore < 70) return 0.4
    if (predictedScore < 80) return 0.2
    return 0.05
  }

  private getFactorDescription(factor: string): string {
    const descriptions: { [key: string]: string } = {
      "Below average FPS performance":
        "Frame rate is consistently below application average",
      "High memory usage pattern":
        "Memory consumption exceeds typical usage patterns",
      "Elevated CPU usage":
        "CPU utilization is higher than expected for this route",
      "Declining performance trend":
        "Performance metrics show deteriorating trend",
      "Limited device diversity in data":
        "Insufficient device variety may affect prediction accuracy",
    }

    return descriptions[factor] || factor
  }

  private generatePredictiveActions(predictedScore: number): string[] {
    if (predictedScore < 50) {
      return [
        "Immediate performance optimization required",
        "Review and optimize critical path performance",
        "Consider caching strategies for frequently accessed data",
        "Implement performance monitoring alerts",
      ]
    } else if (predictedScore < 70) {
      return [
        "Monitor performance closely for degradation",
        "Implement preventive optimizations",
        "Review resource usage patterns",
        "Consider performance testing under load",
      ]
    } else {
      return [
        "Continue monitoring performance trends",
        "Maintain current optimization strategies",
        "Consider proactive improvements for future scaling",
      ]
    }
  }

  private calculateExponentialSmoothingAccuracy(
    actual: number[],
    predicted: number[]
  ): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0

    const mse =
      actual.reduce((sum, actualVal, i) => {
        const error = actualVal - predicted[i]
        return sum + error * error
      }, 0) / actual.length

    const variance = this.standardDeviation(actual) ** 2
    return variance > 0 ? Math.max(0, 1 - mse / variance) : 0
  }

  private calculateSeasonalAdjustment(
    historicalTrends: MetricsTrend[]
  ): number {
    const decomposition = TimeSeriesAnalysis.seasonalDecomposition(
      historicalTrends,
      7,
      "fps"
    )
    return decomposition.seasonal_strength
  }
}
