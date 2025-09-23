import {
  correlateRouteWithGlobalPerformance,
  identifyProblematicRoutes,
  analyzeRoutePerformanceTrends,
  detectRoutePerformanceAnomalies,
  compareRoutesAgainstGlobalPerformance,
} from "@/lib/utils/route-performance-correlation"
import {
  RoutePerformanceData,
  RoutePerformanceAnalysis,
  RoutePerformanceSession,
} from "@/types/route-performance"

// Mock data for testing
const mockRouteSession: RoutePerformanceSession = {
  sessionId: "session-1",
  deviceId: "device-1",
  routeName: "game",
  routePath: "/home/spurvehog/game-bird-name/game",
  routePattern: "/home/[id]/game-bird-name/game",
  segments: ["home", "spurvehog", "game-bird-name", "game"],
  screenStartTime: 1758623560828,
  screenDuration: 30000,
  fpsMetrics: [58, 59, 60, 55, 57],
  memoryMetrics: [200, 210, 205, 215, 220],
  cpuMetrics: [35, 40, 38, 42, 45],
  avgFps: 57.8,
  avgMemory: 210,
  avgCpu: 40,
  deviceType: "smartphone",
  appVersion: "1.0.0",
  timestamp: "2024-01-15T10:30:00Z",
}

const mockRouteData: RoutePerformanceData = {
  routeName: "game",
  routePattern: "/home/[id]/game-bird-name/game",
  totalSessions: 15,
  uniqueDevices: 8,
  avgFps: 45.5, // Below average
  avgMemory: 350, // Above average
  avgCpu: 25,
  avgScreenDuration: 30000,
  fpsDistribution: { excellent: 2, good: 5, fair: 6, poor: 2 },
  memoryDistribution: { excellent: 1, good: 3, fair: 8, poor: 3 },
  performanceScore: 65,
  riskLevel: "medium",
  sessions: [mockRouteSession],
  performanceTrend: "degrading",
  relativePerformance: {
    fpsVsAverage: -15.5,
    memoryVsAverage: 25.2,
    cpuVsAverage: -10.1,
  },
}

const mockGoodRouteData: RoutePerformanceData = {
  ...mockRouteData,
  routeName: "home",
  routePattern: "/home",
  avgFps: 58.2, // Above average
  avgMemory: 180, // Below average (better)
  avgCpu: 22,
  performanceScore: 85,
  riskLevel: "low",
  performanceTrend: "improving",
  relativePerformance: {
    fpsVsAverage: 15.2,
    memoryVsAverage: -25.8,
    cpuVsAverage: -8.5,
  },
}

const mockAppAverages = {
  avgFps: 50.5,
  avgMemory: 280,
  avgCpu: 30,
}

const mockRouteAnalysis: RoutePerformanceAnalysis = {
  routes: [mockRouteData, mockGoodRouteData],
  summary: {
    totalRoutes: 2,
    totalSessions: 30,
    worstPerformingRoutes: [mockRouteData],
    bestPerformingRoutes: [mockGoodRouteData],
    routesWithHighMemoryUsage: [mockRouteData],
    routesWithLowFps: [mockRouteData],
  },
  appAverages: mockAppAverages,
}

describe("Route Performance Correlation", () => {
  describe("correlateRouteWithGlobalPerformance", () => {
    it("should calculate correct performance deviations", () => {
      const result = correlateRouteWithGlobalPerformance(
        mockRouteData,
        mockAppAverages
      )

      expect(result.route_pattern).toBe("/home/[id]/game-bird-name/game")
      expect(result.route_name).toBe("game")

      // FPS deviation: (45.5 - 50.5) / 50.5 * 100 ≈ -9.9%
      expect(result.performance_vs_average.fps_deviation).toBeCloseTo(-9.9, 1)

      // Memory deviation: (350 - 280) / 280 * 100 = 25%
      expect(result.performance_vs_average.memory_deviation).toBeCloseTo(25, 1)

      // CPU deviation: (25 - 30) / 30 * 100 ≈ -16.7%
      expect(result.performance_vs_average.cpu_deviation).toBeCloseTo(-16.7, 1)
    })

    it("should calculate anomaly score based on deviations", () => {
      const result = correlateRouteWithGlobalPerformance(
        mockRouteData,
        mockAppAverages
      )

      expect(result.anomaly_score).toBeGreaterThan(0)
      expect(result.anomaly_score).toBeLessThanOrEqual(1)
    })

    it("should determine risk assessment correctly", () => {
      const highRiskRoute: RoutePerformanceData = {
        ...mockRouteData,
        avgFps: 20, // Very low
        avgMemory: 600, // Very high
        performanceScore: 35, // Poor score
      }

      const result = correlateRouteWithGlobalPerformance(
        highRiskRoute,
        mockAppAverages
      )

      expect(result.risk_assessment).toBe("high")
    })

    it("should analyze trend direction and confidence", () => {
      const result = correlateRouteWithGlobalPerformance(
        mockRouteData,
        mockAppAverages
      )

      expect(result.trend_analysis.direction).toBe("degrading")
      expect(result.trend_analysis.sessions_analyzed).toBe(15)
      expect(result.trend_analysis.confidence).toBeGreaterThan(0.5) // High confidence due to sufficient sessions
    })
  })

  describe("identifyProblematicRoutes", () => {
    it("should identify routes with poor performance", () => {
      const problematicRoutes = identifyProblematicRoutes(mockRouteAnalysis)

      expect(problematicRoutes).toHaveLength(1)
      expect(problematicRoutes[0].routeName).toBe("game")
      expect(problematicRoutes[0].performanceScore).toBe(65) // Below 70
    })

    it("should identify routes with high risk level", () => {
      const highRiskAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          { ...mockRouteData, riskLevel: "high" },
          mockGoodRouteData,
        ],
      }

      const problematicRoutes = identifyProblematicRoutes(highRiskAnalysis)

      expect(problematicRoutes).toHaveLength(1)
      expect(problematicRoutes[0].riskLevel).toBe("high")
    })

    it("should identify routes with degrading performance", () => {
      const degradingAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          { ...mockGoodRouteData, performanceTrend: "degrading" },
          mockGoodRouteData,
        ],
      }

      const problematicRoutes = identifyProblematicRoutes(degradingAnalysis)

      expect(problematicRoutes).toHaveLength(1)
      expect(problematicRoutes[0].performanceTrend).toBe("degrading")
    })

    it("should return empty array when no problematic routes", () => {
      const goodAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [mockGoodRouteData],
      }

      const problematicRoutes = identifyProblematicRoutes(goodAnalysis)

      expect(problematicRoutes).toHaveLength(0)
    })
  })

  describe("analyzeRoutePerformanceTrends", () => {
    it("should analyze FPS trends for routes with sufficient data", () => {
      const trendsAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            totalSessions: 10, // Sufficient data
            performanceTrend: "degrading",
          },
        ],
      }

      const trends = analyzeRoutePerformanceTrends(trendsAnalysis)

      expect(trends).toHaveLength(1)
      expect(trends[0].route_pattern).toBe("/home/[id]/game-bird-name/game")
      expect(trends[0].trend_direction).toBe("degrading")
      expect(trends[0].metric_type).toBe("fps")
      expect(trends[0].sessions_analyzed).toBe(10)
    })

    it("should skip routes with insufficient data", () => {
      const insufficientDataAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            totalSessions: 2, // Insufficient data
          },
        ],
      }

      const trends = analyzeRoutePerformanceTrends(insufficientDataAnalysis)

      expect(trends).toHaveLength(0)
    })

    it("should analyze memory trends", () => {
      const memoryTrendRoute: RoutePerformanceData = {
        ...mockRouteData,
        totalSessions: 6,
        sessions: [
          { ...mockRouteSession, avgMemory: 200 },
          { ...mockRouteSession, avgMemory: 220 },
          { ...mockRouteSession, avgMemory: 240 },
          { ...mockRouteSession, avgMemory: 260 },
          { ...mockRouteSession, avgMemory: 280 },
          { ...mockRouteSession, avgMemory: 300 },
        ],
      }

      const trendsAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [memoryTrendRoute],
      }

      const trends = analyzeRoutePerformanceTrends(trendsAnalysis)

      const memoryTrend = trends.find(t => t.metric_type === "memory")
      expect(memoryTrend?.trend_direction).toBe("degrading")
    })

    it("should sort trends by significance", () => {
      const multiTrendAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            routeName: "route1",
            totalSessions: 20, // High significance
            performanceTrend: "degrading",
          },
          {
            ...mockRouteData,
            routeName: "route2",
            totalSessions: 5, // Medium significance
            performanceTrend: "improving",
          },
        ],
      }

      const trends = analyzeRoutePerformanceTrends(multiTrendAnalysis)

      expect(trends[0].sessions_analyzed).toBeGreaterThanOrEqual(
        trends[trends.length - 1].sessions_analyzed
      )
    })
  })

  describe("detectRoutePerformanceAnomalies", () => {
    it("should detect FPS anomalies", () => {
      const anomalousAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            avgFps: 20, // Very low compared to app average of 50.5
          },
        ],
      }

      const anomalies = detectRoutePerformanceAnomalies(anomalousAnalysis)

      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].metric_type).toBe("fps")
      expect(anomalies[0].route_pattern).toBe("/home/[id]/game-bird-name/game")
      expect(anomalies[0].current_value).toBe(20)
      expect(anomalies[0].expected_value).toBe(50.5)
    })

    it("should detect memory anomalies", () => {
      const memoryAnomalousAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            avgMemory: 500, // Very high compared to app average of 280
          },
        ],
      }

      const anomalies = detectRoutePerformanceAnomalies(memoryAnomalousAnalysis)

      expect(anomalies.some(a => a.metric_type === "memory")).toBe(true)
    })

    it("should detect CPU anomalies", () => {
      const cpuAnomalousAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            avgCpu: 60, // High compared to app average of 30
          },
        ],
      }

      const anomalies = detectRoutePerformanceAnomalies(cpuAnomalousAnalysis)

      expect(anomalies.some(a => a.metric_type === "cpu")).toBe(true)
    })

    it("should sort anomalies by severity", () => {
      const multiAnomalousAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            routeName: "criticalRoute",
            avgFps: 10, // Critical deviation
          },
          {
            ...mockRouteData,
            routeName: "moderateRoute",
            avgFps: 35, // Moderate deviation
          },
        ],
      }

      const anomalies = detectRoutePerformanceAnomalies(multiAnomalousAnalysis)

      expect(anomalies[0].anomaly_severity).toBe("critical")
      expect(anomalies[1].anomaly_severity).toBe("medium")
    })

    it("should not detect anomalies for normal performance", () => {
      const normalAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [mockGoodRouteData], // Good performance, close to averages
      }

      const anomalies = detectRoutePerformanceAnomalies(normalAnalysis)

      expect(anomalies).toHaveLength(0)
    })
  })

  describe("compareRoutesAgainstGlobalPerformance", () => {
    it("should identify overperforming routes", () => {
      const comparisons = compareRoutesAgainstGlobalPerformance(mockRouteAnalysis)

      const overperformingComparison = comparisons.find(
        c => c.comparison_type === "overperforming"
      )

      expect(overperformingComparison).toBeDefined()
      expect(overperformingComparison?.route_name).toBe("home")
    })

    it("should identify underperforming routes", () => {
      const comparisons = compareRoutesAgainstGlobalPerformance(mockRouteAnalysis)

      const underperformingComparison = comparisons.find(
        c => c.comparison_type === "underperforming"
      )

      expect(underperformingComparison).toBeDefined()
    })

    it("should calculate deviation percentages correctly", () => {
      const comparisons = compareRoutesAgainstGlobalPerformance(mockRouteAnalysis)

      expect(comparisons.length).toBeGreaterThan(0)
      comparisons.forEach(comparison => {
        expect(comparison.deviation_percentage).toBeGreaterThan(15) // Minimum threshold
        expect(comparison.confidence).toBeGreaterThan(0)
        expect(comparison.confidence).toBeLessThanOrEqual(1)
      })
    })

    it("should sort comparisons by deviation percentage", () => {
      const comparisons = compareRoutesAgainstGlobalPerformance(mockRouteAnalysis)

      for (let i = 1; i < comparisons.length; i++) {
        expect(comparisons[i - 1].deviation_percentage).toBeGreaterThanOrEqual(
          comparisons[i].deviation_percentage
        )
      }
    })

    it("should set confidence based on session count", () => {
      const highSessionAnalysis: RoutePerformanceAnalysis = {
        ...mockRouteAnalysis,
        routes: [
          {
            ...mockRouteData,
            totalSessions: 15, // High confidence
            avgFps: 30, // Significant deviation
          },
          {
            ...mockRouteData,
            totalSessions: 5, // Lower confidence
            avgFps: 30,
          },
        ],
      }

      const comparisons = compareRoutesAgainstGlobalPerformance(highSessionAnalysis)

      const highConfidenceComparison = comparisons.find(
        c => c.sessions_count === 15
      )
      const lowConfidenceComparison = comparisons.find(
        c => c.sessions_count === 5
      )

      expect(highConfidenceComparison?.confidence).toBe(0.9)
      expect(lowConfidenceComparison?.confidence).toBe(0.6)
    })
  })
})