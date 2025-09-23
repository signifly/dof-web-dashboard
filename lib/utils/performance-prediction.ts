import {
  RoutePerformanceData,
  RoutePerformanceSession,
} from "@/types/route-performance"
import {
  RoutePerformancePrediction,
  PredictionResult,
  LinearRegressionResult,
} from "@/types/route-analytics"

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

    return {
      route_pattern: route.routePattern,
      predicted_performance_score: primaryPrediction.predictedScore,
      confidence_interval: primaryPrediction.confidenceInterval,
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
    if (sessions.length < 3) {
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

    return {
      predictedScore: Math.max(0, Math.min(100, predictedScore)),
      confidenceInterval: [
        Math.max(0, predictedScore - marginOfError),
        Math.min(100, predictedScore + marginOfError),
      ],
      model: "linear_regression",
      rSquared: regression.rSquared,
    }
  }

  private calculateLinearRegression(
    x: number[],
    y: number[]
  ): LinearRegressionResult {
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)
    const sumYY = y.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const meanY = sumY / n
    const totalSumSquares = y.reduce((sum, val) => sum + (val - meanY) ** 2, 0)
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + (val - predicted) ** 2
    }, 0)

    const rSquared = 1 - residualSumSquares / totalSumSquares

    return { slope, intercept, rSquared }
  }

  private calculateStandardError(
    x: number[],
    y: number[],
    regression: LinearRegressionResult
  ): number {
    const n = x.length
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
    if (prediction.predictedScore < 50 || route.riskLevel === "high") {
      return "high"
    }

    if (
      prediction.predictedScore < 70 ||
      route.performanceTrend === "degrading"
    ) {
      return "medium"
    }

    return "low"
  }

  private estimateForecastAccuracy(
    sessions: RoutePerformanceSession[]
  ): number {
    if (sessions.length < 5) return 0.6 // Lower accuracy with less data

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
}
