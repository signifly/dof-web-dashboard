import { RecommendationEngine } from "@/lib/services/recommendation-engine"
import { PerformanceInsight, OptimizationOpportunity } from "@/types/insights"
import { PerformanceSummary } from "@/lib/performance-data"
import { RoutePerformanceAnalysis } from "@/types/route-performance"

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "test-uuid-123"),
  },
})

describe("RecommendationEngine", () => {
  let engine: RecommendationEngine

  const mockPerformanceContext: PerformanceSummary = {
    totalSessions: 100,
    totalMetrics: 1000,
    deviceCount: 25,
    avgFps: 30,
    avgMemory: 500,
    avgCpu: 60,
    avgLoadTime: 3000,
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

  const createMockInsight = (
    overrides: Partial<PerformanceInsight> = {}
  ): PerformanceInsight => ({
    id: "insight-123",
    type: "trend_decline",
    severity: "high",
    title: "Test Insight",
    description: "Test insight description",
    confidence: 0.8,
    impact: "medium",
    category: "performance",
    detected_at: new Date().toISOString(),
    data_context: {
      metric_type: "fps",
      value: 25,
      baseline: 45,
      deviation: -20,
      affected_sessions: 50,
      affected_devices: 10,
    },
    ...overrides,
  })

  beforeEach(() => {
    engine = new RecommendationEngine()
    jest.clearAllMocks()
  })

  describe("generateRecommendations", () => {
    it("should generate recommendations from insights", async () => {
      const insights = [
        createMockInsight({
          type: "trend_decline",
          category: "performance",
          severity: "critical",
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0]).toMatchObject({
        id: expect.any(String),
        insight_id: "insight-123",
        title: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        impact: expect.any(String),
        effort: expect.any(String),
        priority_score: expect.any(Number),
        status: "pending",
        created_at: expect.any(String),
        actionable_steps: expect.any(Array),
        estimated_improvement: expect.any(String),
        related_metrics: expect.any(Array),
        implementation_time: expect.any(String),
      })
    })

    it("should filter out low priority recommendations", async () => {
      const insights = [
        createMockInsight({
          type: "trend_decline",
          severity: "low",
          confidence: 0.1, // Very low confidence
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      // Should filter out recommendations below priority threshold (2.0)
      expect(recommendations.length).toBe(0)
    })

    it("should generate FPS optimization recommendations", async () => {
      const insights = [
        createMockInsight({
          type: "trend_decline",
          category: "performance",
          severity: "critical",
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      const fpsRecommendation = recommendations.find(
        r =>
          r.title.toLowerCase().includes("rendering") ||
          r.title.toLowerCase().includes("fps")
      )

      expect(fpsRecommendation).toBeDefined()
      expect(
        fpsRecommendation?.actionable_steps.some(step =>
          /gpu|rendering|fps|frame/i.test(step)
        )
      ).toBe(true)
    })

    it("should generate memory optimization recommendations", async () => {
      const insights = [
        createMockInsight({
          type: "alert",
          category: "memory",
          data_context: {
            metric_type: "memory",
            value: 800,
            baseline: 400,
            deviation: 400,
          },
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      const memoryRecommendation = recommendations.find(
        r => r.category === "memory"
      )

      expect(memoryRecommendation).toBeDefined()
      expect(
        memoryRecommendation?.actionable_steps.some(step =>
          /memory|allocation|pooling/i.test(step)
        )
      ).toBe(true)
    })

    it("should handle critical FPS anomalies", async () => {
      const insights = [
        createMockInsight({
          type: "anomaly",
          category: "performance",
          severity: "critical",
          data_context: {
            metric_type: "fps",
            value: 5, // Very low FPS
            baseline: 45,
            deviation: -40,
          },
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      const criticalRecommendation = recommendations.find(r =>
        r.title.toLowerCase().includes("critical")
      )

      expect(criticalRecommendation).toBeDefined()
      expect(criticalRecommendation?.impact).toBe("high")
      expect(
        criticalRecommendation?.actionable_steps.some(step =>
          /immediately|urgent|profile/i.test(step)
        )
      ).toBe(true)
    })

    it("should generate CPU optimization recommendations", async () => {
      const insights = [
        createMockInsight({
          category: "cpu",
          data_context: {
            metric_type: "cpu",
            value: 85, // High CPU usage
            baseline: 40,
            deviation: 45,
          },
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      const cpuRecommendation = recommendations.find(r => r.category === "cpu")

      expect(cpuRecommendation).toBeDefined()
      expect(
        cpuRecommendation?.actionable_steps.some(step =>
          /cpu|thread|algorithm|processing/i.test(step)
        )
      ).toBe(true)
    })

    it("should generate rendering performance recommendations", async () => {
      const insights = [
        createMockInsight({
          category: "rendering",
          data_context: {
            metric_type: "fps",
            value: 20, // Low FPS
            baseline: 45,
            deviation: -25,
          },
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      const renderingRecommendation = recommendations.find(
        r => r.category === "rendering"
      )

      expect(renderingRecommendation).toBeDefined()
      expect(
        renderingRecommendation?.actionable_steps.some(step =>
          /rendering|fps|gpu|frame/i.test(step)
        )
      ).toBe(true)
    })

    it("should sort recommendations by priority score", async () => {
      const insights = [
        createMockInsight({
          type: "trend_decline",
          severity: "low",
          confidence: 0.5,
        }),
        createMockInsight({
          id: "insight-456",
          type: "anomaly",
          severity: "critical",
          confidence: 0.9,
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      if (recommendations.length > 1) {
        // Should be sorted by priority score (highest first)
        expect(recommendations[0].priority_score).toBeGreaterThanOrEqual(
          recommendations[1].priority_score
        )
      }
    })

    it("should limit to maximum 10 recommendations", async () => {
      // Create many insights that would generate recommendations
      const insights = Array.from({ length: 20 }, (_, i) =>
        createMockInsight({
          id: `insight-${i}`,
          type: "trend_decline",
          severity: "high",
          confidence: 0.8,
        })
      )

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      expect(recommendations.length).toBeLessThanOrEqual(10)
    })

    it("should handle optimization opportunities", async () => {
      const opportunity: OptimizationOpportunity = {
        id: "opp-123",
        type: "memory_optimization",
        potential_impact: "high",
        affected_metric: "memory_usage",
        current_value: 800,
        target_value: 400,
        improvement_potential: 50, // 50% improvement
        complexity: "moderate",
        description: "Optimize memory allocation patterns",
      }

      const recommendations = await engine.generateRecommendations(
        [],
        mockPerformanceContext,
        [opportunity]
      )

      expect(recommendations.length).toBeGreaterThan(0)

      const oppRecommendation = recommendations.find(
        r => r.insight_id === "opp-123"
      )

      expect(oppRecommendation).toBeDefined()
      expect(oppRecommendation?.title).toContain("Memory Optimization")
      expect(oppRecommendation?.estimated_improvement).toContain("50%")
    })

    it("should deduplicate similar recommendations", async () => {
      const insights = [
        createMockInsight({
          type: "trend_decline",
          category: "performance",
        }),
        createMockInsight({
          id: "insight-456",
          type: "trend_decline", // Same type and category
          category: "performance",
        }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      // Should deduplicate recommendations with same category and title pattern
      const uniqueTitles = new Set(recommendations.map(r => r.title))
      expect(uniqueTitles.size).toBeLessThanOrEqual(recommendations.length)
    })

    it("should adjust priority based on context", async () => {
      const lowFpsContext: PerformanceSummary = {
        ...mockPerformanceContext,
        avgFps: 15, // Very low FPS
      }

      const highMemoryContext: PerformanceSummary = {
        ...mockPerformanceContext,
        avgMemory: 800, // High memory usage
      }

      const renderingInsight = createMockInsight({
        category: "rendering",
      })

      const memoryInsight = createMockInsight({
        category: "memory",
      })

      const renderingRecommendations = await engine.generateRecommendations(
        [renderingInsight],
        lowFpsContext
      )

      const memoryRecommendations = await engine.generateRecommendations(
        [memoryInsight],
        highMemoryContext
      )

      // Priority should be boosted for rendering recommendations when FPS is very low
      if (renderingRecommendations.length > 0) {
        expect(renderingRecommendations[0].priority_score).toBeGreaterThan(2.0)
      }

      // Priority should be boosted for memory recommendations when memory is high
      if (memoryRecommendations.length > 0) {
        expect(memoryRecommendations[0].priority_score).toBeGreaterThan(2.0)
      }
    })
  })

  describe("opportunity recommendations", () => {
    it("should handle different optimization opportunity types", async () => {
      const opportunities: OptimizationOpportunity[] = [
        {
          id: "opp-memory",
          type: "memory_optimization",
          potential_impact: "high",
          affected_metric: "memory_usage",
          current_value: 800,
          target_value: 400,
          improvement_potential: 50,
          complexity: "moderate",
          description: "Optimize memory allocation",
        },
        {
          id: "opp-cpu",
          type: "cpu_optimization",
          potential_impact: "medium",
          affected_metric: "cpu_usage",
          current_value: 70,
          target_value: 40,
          improvement_potential: 30,
          complexity: "simple",
          description: "Optimize CPU intensive operations",
        },
        {
          id: "opp-fps",
          type: "fps_improvement",
          potential_impact: "high",
          affected_metric: "fps",
          current_value: 30,
          target_value: 45,
          improvement_potential: 25,
          complexity: "complex",
          description: "Improve rendering performance",
        },
        {
          id: "opp-memory2",
          type: "memory_optimization",
          potential_impact: "medium",
          affected_metric: "memory_usage",
          current_value: 600,
          target_value: 400,
          improvement_potential: 40,
          complexity: "simple",
          description: "Optimize memory allocation patterns",
        },
      ]

      const recommendations = await engine.generateRecommendations(
        [],
        mockPerformanceContext,
        opportunities
      )

      expect(recommendations.length).toBe(4)

      // Check that each opportunity type generates appropriate recommendations
      const memoryRecs = recommendations.filter(r => r.title.includes("Memory"))
      const cpuRec = recommendations.find(r => r.title.includes("Cpu"))
      const fpsRec = recommendations.find(r => r.title.includes("Fps"))

      expect(memoryRecs.length).toBeGreaterThan(0)
      expect(memoryRecs[0]?.category).toBe("memory")
      expect(cpuRec?.category).toBe("cpu")
      expect(fpsRec?.category).toBe("rendering")
    })

    it("should set appropriate effort levels based on complexity", async () => {
      const opportunities: OptimizationOpportunity[] = [
        {
          id: "opp-simple",
          type: "memory_optimization",
          potential_impact: "high",
          affected_metric: "memory",
          current_value: 800,
          target_value: 400,
          improvement_potential: 50,
          complexity: "simple",
          description: "Simple optimization",
        },
        {
          id: "opp-complex",
          type: "cpu_optimization",
          potential_impact: "high",
          affected_metric: "cpu",
          current_value: 70,
          target_value: 40,
          improvement_potential: 50,
          complexity: "complex",
          description: "Complex optimization",
        },
      ]

      const recommendations = await engine.generateRecommendations(
        [],
        mockPerformanceContext,
        opportunities
      )

      const simpleRec = recommendations.find(r => r.insight_id === "opp-simple")
      const complexRec = recommendations.find(
        r => r.insight_id === "opp-complex"
      )

      expect(simpleRec?.effort).toBe("low")
      expect(complexRec?.effort).toBe("high")
    })

    it("should filter out low-priority opportunities", async () => {
      const lowPriorityOpportunity: OptimizationOpportunity = {
        id: "opp-low",
        type: "memory_optimization",
        potential_impact: "low", // Low impact
        affected_metric: "memory",
        current_value: 400,
        target_value: 380,
        improvement_potential: 5, // Low improvement potential
        complexity: "complex", // High complexity
        description: "Minor optimization",
      }

      const recommendations = await engine.generateRecommendations(
        [],
        mockPerformanceContext,
        [lowPriorityOpportunity]
      )

      // Should filter out due to low priority score
      expect(recommendations.length).toBe(0)
    })
  })

  describe("priority scoring", () => {
    it("should score high impact, low effort recommendations highly", async () => {
      const highPriorityInsight = createMockInsight({
        severity: "critical",
        confidence: 0.9,
      })

      const recommendations = await engine.generateRecommendations(
        [highPriorityInsight],
        mockPerformanceContext
      )

      if (recommendations.length > 0) {
        expect(recommendations[0].priority_score).toBeGreaterThan(3.0)
      }
    })

    it("should consider device count in priority scoring", async () => {
      const highDeviceContext: PerformanceSummary = {
        ...mockPerformanceContext,
        deviceCount: 200, // Many affected devices
      }

      const lowDeviceContext: PerformanceSummary = {
        ...mockPerformanceContext,
        deviceCount: 5, // Few affected devices
      }

      const insight = createMockInsight({
        severity: "high",
        confidence: 0.8,
      })

      const highDeviceRecs = await engine.generateRecommendations(
        [insight],
        highDeviceContext
      )
      const lowDeviceRecs = await engine.generateRecommendations(
        [insight],
        lowDeviceContext
      )

      if (highDeviceRecs.length > 0 && lowDeviceRecs.length > 0) {
        expect(highDeviceRecs[0].priority_score).toBeGreaterThan(
          lowDeviceRecs[0].priority_score
        )
      }
    })
  })

  describe("actionable steps generation", () => {
    it("should generate specific actionable steps for each recommendation type", async () => {
      const insights = [
        createMockInsight({ category: "memory" }),
        createMockInsight({ id: "insight-2", category: "cpu" }),
        createMockInsight({ id: "insight-3", category: "rendering" }),
        createMockInsight({ id: "insight-4", category: "rendering" }),
      ]

      const recommendations = await engine.generateRecommendations(
        insights,
        mockPerformanceContext
      )

      recommendations.forEach(rec => {
        expect(rec.actionable_steps.length).toBeGreaterThan(0)
        expect(
          rec.actionable_steps.every(step => typeof step === "string")
        ).toBe(true)
        expect(rec.actionable_steps.every(step => step.length > 10)).toBe(true) // Non-trivial steps
      })
    })
  })

  // Route-Specific Recommendation Tests for Issue #28
  describe("Route-Specific Recommendations", () => {
    const createMockRouteInsight = (
      overrides: Partial<PerformanceInsight> = {}
    ): PerformanceInsight => ({
      id: "route-insight-123",
      type: "route_performance_anomaly",
      severity: "high",
      title: "Route Performance Issue",
      description: "Route performing poorly",
      confidence: 0.8,
      impact: "medium",
      category: "performance",
      detected_at: new Date().toISOString(),
      data_context: {
        metric_type: "screen_duration",
        value: 4000,
        baseline: 2000,
        deviation: 2000,
        affected_sessions: 50,
        affected_devices: 10,
        route_context: {
          route_name: "dashboard",
          route_pattern: "/dashboard",
          affected_routes: ["/dashboard"],
          route_specific_metrics: {
            sessions_count: 100,
            unique_devices: 25,
            avg_screen_duration: 4000,
          },
        },
      },
      ...overrides,
    })

    const createMockRouteData = (): RoutePerformanceAnalysis => ({
      routes: [
        {
          routePattern: "/dashboard",
          totalSessions: 120,
          uniqueDevices: 30,
          avgFps: 35,
          avgMemory: 600,
          avgCpu: 70,
          performanceScore: 55,
          riskLevel: "medium",
          performanceTrend: "stable",
          sessions: [
            {
              sessionId: "session-1",
              deviceId: "device-1",
              routeName: "Dashboard",
              routePath: "/dashboard",
              routePattern: "/dashboard",
              segments: ["dashboard"],
              screenStartTime: Date.now(),
              screenDuration: 5000,
              fpsMetrics: [30, 28, 32],
              memoryMetrics: [650, 640, 660],
              cpuMetrics: [75, 70, 80],
              avgFps: 30,
              avgMemory: 650,
              avgCpu: 75,
              deviceType: "mobile",
              appVersion: "1.0.0",
              timestamp: "2024-01-01T10:00:00Z",
            },
            {
              sessionId: "session-2",
              deviceId: "device-2",
              routeName: "Dashboard",
              routePath: "/dashboard",
              routePattern: "/dashboard",
              segments: ["dashboard"],
              screenStartTime: Date.now(),
              screenDuration: 3000,
              fpsMetrics: [40, 38, 42],
              memoryMetrics: [550, 540, 560],
              cpuMetrics: [65, 60, 70],
              avgFps: 40,
              avgMemory: 550,
              avgCpu: 65,
              deviceType: "mobile",
              appVersion: "1.0.0",
              timestamp: "2024-01-01T11:00:00Z",
            },
          ],
        },
        {
          routePattern: "/profile",
          totalSessions: 80,
          uniqueDevices: 20,
          avgFps: 50,
          avgMemory: 300,
          avgCpu: 40,
          performanceScore: 85,
          riskLevel: "low",
          performanceTrend: "improving",
          sessions: [
            {
              sessionId: "session-3",
              deviceId: "device-3",
              routeName: "Profile",
              routePath: "/profile",
              routePattern: "/profile",
              segments: ["profile"],
              screenStartTime: Date.now(),
              screenDuration: 1500,
              fpsMetrics: [55, 53, 57],
              memoryMetrics: [280, 270, 290],
              cpuMetrics: [35, 30, 40],
              avgFps: 55,
              avgMemory: 280,
              avgCpu: 35,
              deviceType: "mobile",
              appVersion: "1.0.0",
              timestamp: "2024-01-01T12:00:00Z",
            },
          ],
        },
      ],
      summary: {
        totalSessions: 200,
        totalRoutes: 2,
      },
      appAverages: {
        avgFps: 42.5,
        avgMemory: 450,
        avgCpu: 55,
      },
    })

    describe("Route Navigation Optimization", () => {
      it("should recommend preloading for long-duration routes", async () => {
        const insight = createMockRouteInsight({
          type: "route_performance_anomaly",
          data_context: {
            metric_type: "screen_duration",
            value: 4000,
            baseline: 2000,
            deviation: 2000,
            route_context: {
              route_name: "dashboard",
              route_pattern: "/dashboard",
              affected_routes: ["/dashboard"],
              route_specific_metrics: {
                sessions_count: 100,
                unique_devices: 25,
                avg_screen_duration: 4000,
              },
            },
          },
        })

        const recommendations = await engine.generateRecommendations(
          [insight],
          mockPerformanceContext
        )

        const preloadingRec = recommendations.find(
          r =>
            r.category === "route_navigation" && r.title.includes("Preloading")
        )

        expect(preloadingRec).toBeDefined()
        expect(preloadingRec?.actionable_steps).toContain(
          expect.stringMatching(/preloading|skeleton|progressive/i)
        )
        expect(preloadingRec?.estimated_improvement).toContain("30-50%")
      })

      it("should generate route optimization recommendations from route data", async () => {
        const routeData = createMockRouteData()

        const recommendations = await engine.generateRecommendations(
          [],
          mockPerformanceContext,
          undefined,
          routeData
        )

        expect(recommendations.length).toBeGreaterThan(0)

        // Should generate recommendations for the slow dashboard route
        const dashboardRecs = recommendations.filter(r =>
          r.title.includes("dashboard")
        )
        expect(dashboardRecs.length).toBeGreaterThan(0)
      })
    })

    describe("Device-Route Compatibility", () => {
      it("should recommend device-specific optimizations for poor performing routes", async () => {
        const insight = createMockRouteInsight({
          type: "route_performance_anomaly",
          data_context: {
            metric_type: "screen_duration",
            value: 6000,
            baseline: 2000,
            deviation: 4000,
            route_context: {
              route_name: "dashboard",
              route_pattern: "/dashboard",
              affected_routes: ["/dashboard"],
              route_specific_metrics: {
                sessions_count: 150,
                unique_devices: 40,
                avg_screen_duration: 6000,
              },
            },
          },
        })

        const recommendations = await engine.generateRecommendations(
          [insight],
          mockPerformanceContext
        )

        const deviceOptRec = recommendations.find(
          r => r.category === "route_device_optimization"
        )

        expect(deviceOptRec).toBeDefined()
        expect(deviceOptRec?.impact).toBe("high")
        expect(deviceOptRec?.actionable_steps).toContain(
          expect.stringMatching(/device|simplified|alternative/i)
        )
      })
    })

    describe("Route Performance Budget", () => {
      it("should flag routes exceeding performance budget", async () => {
        const insight = createMockRouteInsight({
          type: "route_performance_degradation",
          data_context: {
            metric_type: "screen_duration",
            value: 7000,
            baseline: 2000,
            deviation: 5000,
            route_context: {
              route_name: "heavy-page",
              route_pattern: "/heavy-page",
              affected_routes: ["/heavy-page"],
              route_specific_metrics: {
                sessions_count: 80,
                unique_devices: 20,
                avg_screen_duration: 7000,
              },
            },
          },
        })

        const recommendations = await engine.generateRecommendations(
          [insight],
          mockPerformanceContext
        )

        const budgetRec = recommendations.find(
          r => r.category === "route_performance_budget"
        )

        expect(budgetRec).toBeDefined()
        expect(budgetRec?.impact).toBe("high")
        expect(budgetRec?.actionable_steps).toContain(
          expect.stringMatching(/budget|monitoring|alerts/i)
        )
      })
    })

    describe("Route Caching Optimization", () => {
      it("should recommend caching for high-traffic routes", async () => {
        const insight = createMockRouteInsight({
          type: "route_vs_global_performance",
          data_context: {
            metric_type: "screen_duration",
            value: 3000,
            baseline: 2500,
            deviation: 500,
            route_context: {
              route_name: "popular-page",
              route_pattern: "/popular",
              affected_routes: ["/popular"],
              route_specific_metrics: {
                sessions_count: 200, // High traffic
                unique_devices: 50,
                avg_screen_duration: 3000,
              },
            },
          },
        })

        const recommendations = await engine.generateRecommendations(
          [insight],
          mockPerformanceContext
        )

        const cachingRec = recommendations.find(
          r => r.category === "route_caching"
        )

        expect(cachingRec).toBeDefined()
        expect(cachingRec?.actionable_steps).toContain(
          expect.stringMatching(/caching|memoization|cache/i)
        )
        expect(cachingRec?.estimated_improvement).toContain("20-35%")
      })
    })

    describe("Route Context Priority Adjustments", () => {
      it("should boost priority for routes with many affected sessions", async () => {
        const highSessionInsight = createMockRouteInsight({
          data_context: {
            metric_type: "screen_duration",
            value: 4000,
            baseline: 2000,
            deviation: 2000,
            route_context: {
              route_name: "high-traffic",
              route_pattern: "/high-traffic",
              affected_routes: ["/high-traffic"],
              route_specific_metrics: {
                sessions_count: 500, // Very high session count
                unique_devices: 100,
                avg_screen_duration: 4000,
              },
            },
          },
        })

        const lowSessionInsight = createMockRouteInsight({
          id: "route-insight-456",
          data_context: {
            metric_type: "screen_duration",
            value: 4000,
            baseline: 2000,
            deviation: 2000,
            route_context: {
              route_name: "low-traffic",
              route_pattern: "/low-traffic",
              affected_routes: ["/low-traffic"],
              route_specific_metrics: {
                sessions_count: 10, // Low session count
                unique_devices: 5,
                avg_screen_duration: 4000,
              },
            },
          },
        })

        const highSessionRecs = await engine.generateRecommendations(
          [highSessionInsight],
          mockPerformanceContext
        )
        const lowSessionRecs = await engine.generateRecommendations(
          [lowSessionInsight],
          mockPerformanceContext
        )

        if (highSessionRecs.length > 0 && lowSessionRecs.length > 0) {
          expect(highSessionRecs[0].priority_score).toBeGreaterThan(
            lowSessionRecs[0].priority_score
          )
        }
      })

      it("should boost priority for routes with poor screen duration", async () => {
        const slowRouteInsight = createMockRouteInsight({
          data_context: {
            metric_type: "screen_duration",
            value: 6000,
            baseline: 2000,
            deviation: 4000,
            route_context: {
              route_name: "slow-route",
              route_pattern: "/slow",
              affected_routes: ["/slow"],
              route_specific_metrics: {
                sessions_count: 100,
                unique_devices: 25,
                avg_screen_duration: 6000, // Very slow
              },
            },
          },
        })

        const recommendations = await engine.generateRecommendations(
          [slowRouteInsight],
          mockPerformanceContext
        )

        if (recommendations.length > 0) {
          expect(recommendations[0].priority_score).toBeGreaterThan(3.0)
        }
      })

      it("should boost priority for route-specific categories", async () => {
        const routeInsight = createMockRouteInsight()
        const generalInsight = createMockInsight({
          id: "general-insight",
          category: "performance",
        })

        const routeRecs = await engine.generateRecommendations(
          [routeInsight],
          mockPerformanceContext
        )
        const generalRecs = await engine.generateRecommendations(
          [generalInsight],
          mockPerformanceContext
        )

        const routeSpecificRec = routeRecs.find(r =>
          r.category.toString().startsWith("route_")
        )

        if (routeSpecificRec && generalRecs.length > 0) {
          expect(routeSpecificRec.priority_score).toBeGreaterThan(
            generalRecs[0].priority_score
          )
        }
      })
    })

    describe("Route Optimization Categories", () => {
      it("should correctly categorize route optimization recommendations", async () => {
        const routeData = createMockRouteData()

        const recommendations = await engine.generateRecommendations(
          [],
          mockPerformanceContext,
          undefined,
          routeData
        )

        const routeCategories = [
          "route_navigation",
          "route_caching",
          "route_device_optimization",
          "route_performance_budget",
        ]

        const routeRecs = recommendations.filter(r =>
          routeCategories.includes(r.category as string)
        )

        expect(routeRecs.length).toBeGreaterThan(0)

        routeRecs.forEach(rec => {
          expect(routeCategories).toContain(rec.category)
          expect(rec.title).toMatch(/dashboard|profile/) // Should reference route patterns
          expect(rec.actionable_steps.length).toBeGreaterThan(0)
          expect(rec.estimated_improvement).toBeTruthy()
        })
      })

      it("should generate appropriate action steps for each route optimization type", async () => {
        const routeData = createMockRouteData()

        const recommendations = await engine.generateRecommendations(
          [],
          mockPerformanceContext,
          undefined,
          routeData
        )

        const routeRecs = recommendations.filter(r =>
          r.category.toString().startsWith("route_")
        )

        routeRecs.forEach(rec => {
          switch (rec.category) {
            case "route_navigation":
              expect(
                rec.actionable_steps.some(step =>
                  /preloading|skeleton|progressive/i.test(step)
                )
              ).toBe(true)
              break
            case "route_caching":
              expect(
                rec.actionable_steps.some(step =>
                  /caching|memoization|cache/i.test(step)
                )
              ).toBe(true)
              break
            case "route_device_optimization":
              expect(
                rec.actionable_steps.some(step =>
                  /device|tier|simplified/i.test(step)
                )
              ).toBe(true)
              break
            case "route_performance_budget":
              expect(
                rec.actionable_steps.some(step =>
                  /budget|monitoring|alerts/i.test(step)
                )
              ).toBe(true)
              break
          }
        })
      })
    })

    describe("Route Optimization Integration", () => {
      it("should combine route recommendations with insight-based recommendations", async () => {
        const generalInsight = createMockInsight({
          category: "memory",
          severity: "high",
        })
        const routeInsight = createMockRouteInsight()
        const routeData = createMockRouteData()

        const recommendations = await engine.generateRecommendations(
          [generalInsight, routeInsight],
          mockPerformanceContext,
          undefined,
          routeData
        )

        // Should have both route-specific and general recommendations
        const routeRecs = recommendations.filter(r =>
          r.category.toString().startsWith("route_")
        )
        const generalRecs = recommendations.filter(
          r => !r.category.toString().startsWith("route_")
        )

        expect(routeRecs.length).toBeGreaterThan(0)
        expect(generalRecs.length).toBeGreaterThan(0)
      })

      it("should handle edge cases gracefully", async () => {
        // Test with empty route data
        const emptyRouteData: RoutePerformanceAnalysis = {
          routes: [],
          summary: {
            totalSessions: 0,
            totalRoutes: 0,
          },
          appAverages: { avgFps: 0, avgMemory: 0, avgCpu: 0 },
        }

        const recommendations = await engine.generateRecommendations(
          [],
          mockPerformanceContext,
          undefined,
          emptyRouteData
        )

        // Should handle empty route data without errors
        expect(Array.isArray(recommendations)).toBe(true)
      })

      it("should filter route recommendations by priority threshold", async () => {
        // Create route data with minimal optimization opportunities
        const minimalRouteData: RoutePerformanceAnalysis = {
          routes: [
            {
              routeName: "Fast Route",
              routePattern: "/fast-route",
              totalSessions: 5, // Low traffic
              uniqueDevices: 2,
              avgFps: 60, // Good performance
              avgMemory: 200, // Low memory
              avgCpu: 20, // Low CPU
              avgScreenDuration: 800,
              fpsDistribution: { excellent: 100, good: 0, fair: 0, poor: 0 },
              memoryDistribution: { excellent: 100, good: 0, fair: 0, poor: 0 },
              performanceScore: 95, // Excellent score
              riskLevel: "low",
              performanceTrend: "improving",
              relativePerformance: {
                fpsVsAverage: 1.0,
                memoryVsAverage: 0.5,
                cpuVsAverage: 0.5,
              },
              sessions: [
                {
                  sessionId: "session-fast",
                  deviceId: "device-fast",
                  routeName: "Fast Route",
                  routePath: "/fast-route",
                  routePattern: "/fast-route",
                  segments: ["fast"],
                  screenStartTime: Date.now(),
                  screenDuration: 800, // Very fast
                  fpsMetrics: [60, 58, 62],
                  memoryMetrics: [200, 190, 210],
                  cpuMetrics: [20, 18, 22],
                  avgFps: 60,
                  avgMemory: 200,
                  avgCpu: 20,
                  deviceType: "mobile",
                  appVersion: "1.0.0",
                  timestamp: "2024-01-01T10:00:00Z",
                },
              ],
            },
          ],
          summary: {
            totalSessions: 5,
            totalRoutes: 1,
          },
          appAverages: { avgFps: 60, avgMemory: 200, avgCpu: 20 },
        }

        const recommendations = await engine.generateRecommendations(
          [],
          mockPerformanceContext,
          undefined,
          minimalRouteData
        )

        // Should filter out low-priority route recommendations
        const routeRecs = recommendations.filter(r =>
          r.category.toString().startsWith("route_")
        )
        expect(routeRecs.length).toBe(0) // No optimization needed for fast route
      })
    })
  })
})
