import {
  analyzeRouteOptimizationOpportunities,
  identifyPreloadingOpportunities,
  assessCachingPotential,
  assessDeviceRouteCompatibility,
  calculatePerformanceBudgetStatus,
  generateRouteNavigationRecommendations,
  categorizeRoutesByPerformance,
  calculateRouteOptimizationImpactScore,
} from "@/lib/utils/route-recommendations"
import {
  RoutePerformanceAnalysis,
  RoutePerformanceData,
  RoutePerformanceSession,
} from "@/types/route-performance"

// Helper function to create properly typed test session data
function createTestSession(overrides: Partial<RoutePerformanceSession> = {}): RoutePerformanceSession {
  return {
    sessionId: "test-session",
    deviceId: "test-device",
    routeName: "Test Route",
    routePath: "/test-route",
    routePattern: "/test-route",
    segments: ["test"],
    screenStartTime: Date.now(),
    screenDuration: 2000,
    fpsMetrics: [40, 38, 42],
    memoryMetrics: [400, 390, 410],
    cpuMetrics: [50, 48, 52],
    avgFps: 40,
    avgMemory: 400,
    avgCpu: 50,
    deviceType: "mobile",
    appVersion: "1.0.0",
    timestamp: "2024-01-01T10:00:00Z",
    ...overrides,
  }
}

describe("Route Recommendations Utility", () => {
  const createMockRoute = (
    overrides: Partial<RoutePerformanceData> = {}
  ): RoutePerformanceData => ({
    routePattern: "/test-route",
    totalSessions: 50,
    uniqueDevices: 15,
    avgFps: 40,
    avgMemory: 400,
    avgCpu: 50,
    performanceScore: 70,
    riskLevel: "medium",
    performanceTrend: "stable",
    sessions: [
      createTestSession({
        sessionId: "session-1",
        deviceId: "device-1",
        avgFps: 35,
        avgMemory: 450,
        avgCpu: 55,
        screenDuration: 3000,
        timestamp: "2024-01-01T10:00:00Z",
      }),
      createTestSession({
        sessionId: "session-2",
        deviceId: "device-2",
        avgFps: 45,
        avgMemory: 350,
        avgCpu: 45,
        screenDuration: 2500,
        timestamp: "2024-01-01T11:00:00Z",
      }),
    ],
    ...overrides,
  })

  const createMockRouteAnalysis = (): RoutePerformanceAnalysis => ({
    routes: [
      createMockRoute({
        routePattern: "/slow-route",
        totalSessions: 100,
        uniqueDevices: 30,
        avgFps: 25,
        avgMemory: 700,
        avgCpu: 80,
        performanceScore: 40,
        riskLevel: "high",
        sessions: [
          createTestSession({
            sessionId: "session-slow-1",
            deviceId: "device-slow-1",
            routePattern: "/slow-route",
            avgFps: 20,
            avgMemory: 750,
            avgCpu: 85,
            screenDuration: 6000,
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      }),
      createMockRoute({
        routePattern: "/fast-route",
        totalSessions: 30,
        uniqueDevices: 10,
        avgFps: 60,
        avgMemory: 200,
        avgCpu: 25,
        performanceScore: 90,
        riskLevel: "low",
        sessions: [
          createTestSession({
            sessionId: "session-fast-1",
            deviceId: "device-fast-1",
            routePattern: "/fast-route",
            avgFps: 60,
            avgMemory: 200,
            avgCpu: 25,
            screenDuration: 1000,
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      }),
    ],
    summary: {
      totalSessions: 130,
      totalRoutes: 2,
    },
    appAverages: {
      avgFps: 42.5,
      avgMemory: 450,
      avgCpu: 52.5,
    },
  })

  describe("analyzeRouteOptimizationOpportunities", () => {
    it("should analyze all routes and return optimization opportunities", () => {
      const routeAnalysis = createMockRouteAnalysis()
      const result = analyzeRouteOptimizationOpportunities(routeAnalysis)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty("route_pattern")
      expect(result[0]).toHaveProperty("preloading_opportunity")
      expect(result[0]).toHaveProperty("caching_potential")
      expect(result[0]).toHaveProperty("device_compatibility_issues")
      expect(result[0]).toHaveProperty("performance_budget_status")
      expect(result[0]).toHaveProperty("optimization_recommendations")
    })

    it("should identify different optimization needs for different routes", () => {
      const routeAnalysis = createMockRouteAnalysis()
      const result = analyzeRouteOptimizationOpportunities(routeAnalysis)

      const slowRoute = result.find(r => r.route_pattern === "/slow-route")
      const fastRoute = result.find(r => r.route_pattern === "/fast-route")

      expect(slowRoute).toBeDefined()
      expect(fastRoute).toBeDefined()

      // Slow route should have more optimization opportunities
      expect(slowRoute!.optimization_recommendations.length).toBeGreaterThan(
        fastRoute!.optimization_recommendations.length
      )
    })
  })

  describe("identifyPreloadingOpportunities", () => {
    it("should identify preloading opportunities for slow routes", () => {
      const slowRoute = createMockRoute({
        sessions: [
          createTestSession({
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/slow-route",
            avgFps: 30,
            avgMemory: 400,
            avgCpu: 50,
            screenDuration: 4000, // 4 seconds - slow
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      })

      const result = identifyPreloadingOpportunities(slowRoute)
      expect(result).toBe(true)
    })

    it("should not recommend preloading for fast routes", () => {
      const fastRoute = createMockRoute({
        sessions: [
          createTestSession({
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/fast-route",
            avgFps: 60,
            avgMemory: 200,
            avgCpu: 25,
            screenDuration: 1000, // 1 second - fast
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      })

      const result = identifyPreloadingOpportunities(fastRoute)
      expect(result).toBe(false)
    })

    it("should recommend preloading for high-traffic routes with moderate load times", () => {
      const highTrafficRoute = createMockRoute({
        totalSessions: 100, // High traffic
        sessions: Array.from({ length: 100 }, (_, i) => ({
          sessionId: `session-${i}`,
          deviceId: `device-${i}`,
          routePattern: "/high-traffic",
          timestamp: "2024-01-01T10:00:00Z",
          avgFps: 45,
          avgMemory: 300,
          avgCpu: 40,
          screenDuration: 2500, // Moderate load time
        })),
      })

      const result = identifyPreloadingOpportunities(highTrafficRoute)
      expect(result).toBe(true)
    })
  })

  describe("assessCachingPotential", () => {
    it("should assess high caching potential for high-traffic routes", () => {
      const highTrafficRoute = createMockRoute({
        totalSessions: 100,
        uniqueDevices: 20, // 5 sessions per device on average
        avgMemory: 300, // Moderate memory usage
      })

      const result = assessCachingPotential(highTrafficRoute)
      expect(result).toBe("high")
    })

    it("should assess medium caching potential for moderate traffic", () => {
      const moderateTrafficRoute = createMockRoute({
        totalSessions: 30,
        uniqueDevices: 15, // 2 sessions per device
        avgMemory: 350,
      })

      const result = assessCachingPotential(moderateTrafficRoute)
      expect(result).toBe("medium")
    })

    it("should assess low caching potential for low traffic", () => {
      const lowTrafficRoute = createMockRoute({
        totalSessions: 10,
        uniqueDevices: 10, // 1 session per device
        avgMemory: 500, // Higher memory usage
      })

      const result = assessCachingPotential(lowTrafficRoute)
      expect(result).toBe("low")
    })
  })

  describe("assessDeviceRouteCompatibility", () => {
    it("should identify compatibility issues for high memory routes", () => {
      const highMemoryRoute = createMockRoute({
        avgMemory: 800, // High memory usage
        avgFps: 25, // Low FPS
        performanceScore: 30,
      })

      const result = assessDeviceRouteCompatibility(highMemoryRoute)

      expect(result.length).toBeGreaterThan(0)

      // Should have issues with low-end devices
      const lowEndIssue = result.find(issue => issue.device_tier === "low_end")
      expect(lowEndIssue).toBeDefined()
      expect(lowEndIssue!.performance_score).toBeLessThan(60)
      expect(lowEndIssue!.optimization_priority).toBeGreaterThan(40)
    })

    it("should not identify issues for well-performing routes", () => {
      const wellPerformingRoute = createMockRoute({
        avgMemory: 200, // Low memory usage
        avgFps: 60, // High FPS
        performanceScore: 90,
      })

      const result = assessDeviceRouteCompatibility(wellPerformingRoute)

      // Should have no significant compatibility issues
      expect(result.length).toBe(0)
    })

    it("should assign higher optimization priority to worse performance", () => {
      const poorRoute = createMockRoute({
        avgMemory: 900,
        avgFps: 15,
        performanceScore: 20,
      })

      const result = assessDeviceRouteCompatibility(poorRoute)

      if (result.length > 0) {
        result.forEach(issue => {
          expect(issue.optimization_priority).toBeGreaterThan(60)
        })
      }
    })
  })

  describe("calculatePerformanceBudgetStatus", () => {
    it("should identify exceeded budget for slow routes", () => {
      const slowRoute = createMockRoute({
        sessions: [
          createTestSession({
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/slow-route",
            avgFps: 30,
            avgMemory: 400,
            avgCpu: 50,
            screenDuration: 6000, // 6 seconds
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      })

      const result = calculatePerformanceBudgetStatus(slowRoute, 5000) // 5 second budget
      expect(result).toBe("exceeded")
    })

    it("should identify approaching budget threshold", () => {
      const approachingRoute = createMockRoute({
        sessions: [
          createTestSession({
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/approaching-route",
            avgFps: 40,
            avgMemory: 350,
            avgCpu: 45,
            screenDuration: 4200, // 4.2 seconds (84% of 5 second budget)
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      })

      const result = calculatePerformanceBudgetStatus(approachingRoute, 5000)
      expect(result).toBe("approaching")
    })

    it("should identify within budget for fast routes", () => {
      const fastRoute = createMockRoute({
        sessions: [
          createTestSession({
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/fast-route",
            avgFps: 60,
            avgMemory: 200,
            avgCpu: 25,
            screenDuration: 2000, // 2 seconds
            timestamp: "2024-01-01T10:00:00Z",
          }),
        ],
      })

      const result = calculatePerformanceBudgetStatus(fastRoute, 5000)
      expect(result).toBe("within_budget")
    })
  })

  describe("generateRouteNavigationRecommendations", () => {
    it("should generate preloading recommendations when opportunities exist", () => {
      const routeAnalysis = {
        route_pattern: "/slow-route",
        preloading_opportunity: true,
        caching_potential: "medium" as const,
        device_compatibility_issues: [],
        performance_budget_status: "within_budget" as const,
        optimization_recommendations: [],
      }

      const result = generateRouteNavigationRecommendations(routeAnalysis)

      const preloadingRec = result.find(r => r.type === "preloading")
      expect(preloadingRec).toBeDefined()
      expect(preloadingRec?.priority).toBe("high")
      expect(preloadingRec?.estimated_impact).toContain("30-50%")
    })

    it("should generate high-priority caching recommendations for high potential", () => {
      const routeAnalysis = {
        route_pattern: "/high-traffic-route",
        preloading_opportunity: false,
        caching_potential: "high" as const,
        device_compatibility_issues: [],
        performance_budget_status: "within_budget" as const,
        optimization_recommendations: [],
      }

      const result = generateRouteNavigationRecommendations(routeAnalysis)

      const cachingRec = result.find(r => r.type === "caching")
      expect(cachingRec).toBeDefined()
      expect(cachingRec?.priority).toBe("medium")
      expect(cachingRec?.estimated_impact).toContain("20-35%")
    })

    it("should generate device optimization recommendations when issues exist", () => {
      const routeAnalysis = {
        route_pattern: "/problematic-route",
        preloading_opportunity: false,
        caching_potential: "low" as const,
        device_compatibility_issues: [
          {
            device_tier: "low_end" as const,
            route_pattern: "/problematic-route",
            performance_score: 30,
            optimization_priority: 70,
          },
        ],
        performance_budget_status: "within_budget" as const,
        optimization_recommendations: [],
      }

      const result = generateRouteNavigationRecommendations(routeAnalysis)

      const deviceOptRec = result.find(r => r.type === "device_optimization")
      expect(deviceOptRec).toBeDefined()
      expect(deviceOptRec?.priority).toBe("high") // High priority for low-end device issues
    })

    it("should generate budget recommendations for exceeded routes", () => {
      const routeAnalysis = {
        route_pattern: "/over-budget-route",
        preloading_opportunity: false,
        caching_potential: "low" as const,
        device_compatibility_issues: [],
        performance_budget_status: "exceeded" as const,
        optimization_recommendations: [],
      }

      const result = generateRouteNavigationRecommendations(routeAnalysis)

      const budgetRec = result.find(r => r.type === "performance_budget")
      expect(budgetRec).toBeDefined()
      expect(budgetRec?.priority).toBe("high")
      expect(budgetRec?.description).toContain(
        "immediate optimization required"
      )
    })
  })

  describe("categorizeRoutesByPerformance", () => {
    it("should correctly categorize routes by performance characteristics", () => {
      const routes = [
        createMockRoute({
          routePattern: "/heavy-route",
          avgMemory: 800,
          sessions: [
            createTestSession({
              sessionId: "session-1",
              deviceId: "device-1",
              routePattern: "/heavy-route",
              avgFps: 25,
              avgMemory: 800,
              avgCpu: 75,
              screenDuration: 6000, // Heavy route
              timestamp: "2024-01-01T10:00:00Z",
            }),
          ],
        }),
        createMockRoute({
          routePattern: "/normal-route",
          avgMemory: 350,
          sessions: [
            {
              sessionId: "session-2",
              deviceId: "device-2",
              routePattern: "/normal-route",
              timestamp: "2024-01-01T10:00:00Z",
              avgFps: 45,
              avgMemory: 350,
              avgCpu: 50,
              screenDuration: 3000, // Normal route
            },
          ],
        }),
        createMockRoute({
          routePattern: "/light-route",
          avgMemory: 150,
          sessions: [
            {
              sessionId: "session-3",
              deviceId: "device-3",
              routePattern: "/light-route",
              timestamp: "2024-01-01T10:00:00Z",
              avgFps: 60,
              avgMemory: 150,
              avgCpu: 20,
              screenDuration: 1000, // Light route
            },
          ],
        }),
      ]

      const result = categorizeRoutesByPerformance(routes)

      expect(result.heavyRoutes).toHaveLength(1)
      expect(result.normalRoutes).toHaveLength(1)
      expect(result.lightRoutes).toHaveLength(1)

      expect(result.heavyRoutes[0].routePattern).toBe("/heavy-route")
      expect(result.normalRoutes[0].routePattern).toBe("/normal-route")
      expect(result.lightRoutes[0].routePattern).toBe("/light-route")
    })

    it("should handle edge cases in route categorization", () => {
      const emptyRoutes: RoutePerformanceData[] = []
      const result = categorizeRoutesByPerformance(emptyRoutes)

      expect(result.heavyRoutes).toHaveLength(0)
      expect(result.normalRoutes).toHaveLength(0)
      expect(result.lightRoutes).toHaveLength(0)
    })
  })

  describe("calculateRouteOptimizationImpactScore", () => {
    it("should calculate higher impact scores for preloading on slow routes", () => {
      const slowRoute = createMockRoute({
        totalSessions: 100,
        sessions: [
          {
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/slow-route",
            timestamp: "2024-01-01T10:00:00Z",
            avgFps: 30,
            avgMemory: 400,
            avgCpu: 50,
            screenDuration: 5000, // Slow
          },
        ],
      })

      const fastRoute = createMockRoute({
        totalSessions: 100,
        sessions: [
          {
            sessionId: "session-2",
            deviceId: "device-2",
            routePattern: "/fast-route",
            timestamp: "2024-01-01T10:00:00Z",
            avgFps: 60,
            avgMemory: 200,
            avgCpu: 25,
            screenDuration: 1000, // Fast
          },
        ],
      })

      const slowRouteScore = calculateRouteOptimizationImpactScore(
        slowRoute,
        "preloading"
      )
      const fastRouteScore = calculateRouteOptimizationImpactScore(
        fastRoute,
        "preloading"
      )

      expect(slowRouteScore).toBeGreaterThan(fastRouteScore)
    })

    it("should calculate higher caching impact for routes with repeat visits", () => {
      const highRepeatRoute = createMockRoute({
        totalSessions: 100,
        uniqueDevices: 20, // 5 sessions per device
      })

      const lowRepeatRoute = createMockRoute({
        totalSessions: 100,
        uniqueDevices: 100, // 1 session per device
      })

      const highRepeatScore = calculateRouteOptimizationImpactScore(
        highRepeatRoute,
        "caching"
      )
      const lowRepeatScore = calculateRouteOptimizationImpactScore(
        lowRepeatRoute,
        "caching"
      )

      expect(highRepeatScore).toBeGreaterThan(lowRepeatScore)
    })

    it("should calculate appropriate impact scores for device optimization", () => {
      const poorPerformanceRoute = createMockRoute({
        avgFps: 20, // Low FPS
        avgMemory: 800, // High memory
      })

      const goodPerformanceRoute = createMockRoute({
        avgFps: 60, // Good FPS
        avgMemory: 200, // Low memory
      })

      const poorScore = calculateRouteOptimizationImpactScore(
        poorPerformanceRoute,
        "device_optimization"
      )
      const goodScore = calculateRouteOptimizationImpactScore(
        goodPerformanceRoute,
        "device_optimization"
      )

      expect(poorScore).toBe(80) // High impact for poor performance
      expect(goodScore).toBe(40) // Lower impact for good performance
    })

    it("should cap impact scores at 100", () => {
      const extremeRoute = createMockRoute({
        totalSessions: 10000, // Very high traffic
        sessions: [
          {
            sessionId: "session-1",
            deviceId: "device-1",
            routePattern: "/extreme-route",
            timestamp: "2024-01-01T10:00:00Z",
            avgFps: 10,
            avgMemory: 1000,
            avgCpu: 90,
            screenDuration: 20000, // Extremely slow
          },
        ],
      })

      const score = calculateRouteOptimizationImpactScore(
        extremeRoute,
        "preloading"
      )
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})
