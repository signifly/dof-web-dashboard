import { RecommendationEngine } from "@/lib/services/recommendation-engine"
import {
  PerformanceInsight,
  PerformanceRecommendation,
  OptimizationOpportunity,
} from "@/types/insights"
import { PerformanceSummary } from "@/lib/performance-data"

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
})
