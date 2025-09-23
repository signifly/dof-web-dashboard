import { UserJourneyTracker } from "@/lib/services/user-journey-tracker"
import { UserJourney, BottleneckPoint } from "@/types/user-journey"
import { PerformanceSession, PerformanceMetric } from "@/lib/performance-data"

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

describe("UserJourneyTracker", () => {
  let tracker: UserJourneyTracker
  let mockSessions: PerformanceSession[]
  let mockMetrics: PerformanceMetric[]

  beforeEach(() => {
    tracker = new UserJourneyTracker()
    mockSessions = createMockSessionData()
    mockMetrics = createMockMetricsData()

    // Mock the private methods that access Supabase
    jest
      .spyOn(tracker as any, "getSessionsForJourneyAnalysis")
      .mockResolvedValue(mockSessions)
    jest
      .spyOn(tracker as any, "getSessionMetrics")
      .mockResolvedValue(mockMetrics)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("reconstructJourneys", () => {
    it("should reconstruct user journeys from session data", async () => {
      const journeys = await tracker.reconstructJourneys()

      expect(journeys).toBeDefined()
      expect(journeys.length).toBeGreaterThan(0)

      journeys.forEach(journey => {
        expect(journey.journey_id).toBeDefined()
        expect(journey.anonymous_user_id).toBeDefined()
        expect(journey.route_sequence).toBeDefined()
        expect(journey.performance_trajectory).toBeDefined()
      })
    })

    it("should group sessions by user correctly", async () => {
      const journeys = await tracker.reconstructJourneys()

      const user1Journeys = journeys.filter(
        j => j.anonymous_user_id === "user1"
      )
      const user2Journeys = journeys.filter(
        j => j.anonymous_user_id === "user2"
      )

      expect(user1Journeys.length).toBeGreaterThan(0)
      expect(user2Journeys.length).toBeGreaterThan(0)
    })

    it("should handle time window separation correctly", async () => {
      const journeys = await tracker.reconstructJourneys(1) // 1 hour window

      // Should create separate journeys for sessions > 1 hour apart
      expect(journeys.length).toBeGreaterThanOrEqual(2)
    })

    it("should return empty array when no sessions available", async () => {
      jest
        .spyOn(tracker as any, "getSessionsForJourneyAnalysis")
        .mockResolvedValue([])

      const journeys = await tracker.reconstructJourneys()

      expect(journeys).toEqual([])
    })
  })

  describe("analyzeJourneyPatterns", () => {
    it("should identify common journey patterns", async () => {
      const journeys = await tracker.reconstructJourneys()
      const patterns = await tracker.analyzeJourneyPatterns(journeys)

      expect(patterns).toBeDefined()
      patterns.forEach(pattern => {
        expect(pattern.pattern_id).toBeDefined()
        expect(pattern.route_sequence).toBeDefined()
        expect(pattern.frequency).toBeGreaterThan(0)
        expect(pattern.completion_rate).toBeGreaterThanOrEqual(0)
        expect(pattern.completion_rate).toBeLessThanOrEqual(1)
      })
    })

    it("should sort patterns by user impact score", async () => {
      const journeys = await tracker.reconstructJourneys()
      const patterns = await tracker.analyzeJourneyPatterns(journeys)

      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].user_impact_score).toBeGreaterThanOrEqual(
          patterns[i].user_impact_score
        )
      }
    })

    it("should filter out patterns that occur only once", async () => {
      const journeys = [
        createMockJourney({
          route_sequence: [
            {
              route_pattern: "/unique-route",
              route_name: "unique",
              entry_timestamp: "2023-01-01",
              exit_timestamp: "2023-01-01",
              duration: 1000,
              performance_metrics: {
                avg_fps: 60,
                avg_memory: 200,
                avg_cpu: 30,
                avg_load_time: 1000,
              },
              transition_performance: {
                transition_time: 1000,
                memory_spike: 0,
                cpu_spike: 0,
              },
            },
          ],
        }),
      ]

      const patterns = await tracker.analyzeJourneyPatterns(journeys)

      expect(patterns).toEqual([])
    })
  })

  describe("detectJourneyBottlenecks", () => {
    it("should detect performance bottlenecks in journeys", async () => {
      const journey = createMockJourneyWithBottlenecks()
      const bottlenecks = await tracker.detectJourneyBottlenecks(journey)

      expect(bottlenecks).toBeDefined()
      expect(bottlenecks.length).toBeGreaterThan(0)

      bottlenecks.forEach(bottleneck => {
        expect(bottleneck.route_pattern).toBeDefined()
        expect(bottleneck.bottleneck_type).toBeDefined()
        expect(bottleneck.severity).toMatch(/^(critical|high|medium|low)$/)
        expect(bottleneck.impact_score).toBeGreaterThan(0)
      })
    })

    it("should sort bottlenecks by impact score", async () => {
      const journey = createMockJourneyWithBottlenecks()
      const bottlenecks = await tracker.detectJourneyBottlenecks(journey)

      for (let i = 1; i < bottlenecks.length; i++) {
        expect(bottlenecks[i - 1].impact_score).toBeGreaterThanOrEqual(
          bottlenecks[i].impact_score
        )
      }
    })

    it("should detect FPS drop bottlenecks", async () => {
      const journey = createMockJourney({
        performance_trajectory: [
          {
            timestamp: "2023-01-01T10:00:00Z",
            fps: 60,
            memory_usage: 200,
            cpu_usage: 30,
            route_pattern: "/home",
          },
          {
            timestamp: "2023-01-01T10:01:00Z",
            fps: 30,
            memory_usage: 200,
            cpu_usage: 30,
            route_pattern: "/game",
          },
        ],
      })

      const bottlenecks = await tracker.detectJourneyBottlenecks(journey)

      const fpsBottleneck = bottlenecks.find(
        b => b.bottleneck_type === "performance_drop"
      )
      expect(fpsBottleneck).toBeDefined()
      expect(fpsBottleneck!.route_pattern).toBe("/game")
    })

    it("should detect memory spike bottlenecks", async () => {
      const journey = createMockJourney({
        performance_trajectory: [
          {
            timestamp: "2023-01-01T10:00:00Z",
            fps: 60,
            memory_usage: 200,
            cpu_usage: 30,
            route_pattern: "/home",
          },
          {
            timestamp: "2023-01-01T10:01:00Z",
            fps: 60,
            memory_usage: 400,
            cpu_usage: 30,
            route_pattern: "/heavy-route",
          },
        ],
      })

      const bottlenecks = await tracker.detectJourneyBottlenecks(journey)

      const memoryBottleneck = bottlenecks.find(
        b => b.bottleneck_type === "memory_spike"
      )
      expect(memoryBottleneck).toBeDefined()
      expect(memoryBottleneck!.route_pattern).toBe("/heavy-route")
    })

    it("should detect slow transition bottlenecks", async () => {
      const journey = createMockJourney({
        route_sequence: [
          {
            route_pattern: "/slow-route",
            route_name: "slow",
            entry_timestamp: "2023-01-01T10:00:00Z",
            exit_timestamp: "2023-01-01T10:01:30Z",
            duration: 90000,
            performance_metrics: {
              avg_fps: 60,
              avg_memory: 200,
              avg_cpu: 30,
              avg_load_time: 1000,
            },
            transition_performance: {
              transition_time: 1000,
              memory_spike: 0,
              cpu_spike: 0,
            },
          },
        ],
      })

      const bottlenecks = await tracker.detectJourneyBottlenecks(journey)

      const slowBottleneck = bottlenecks.find(
        b => b.bottleneck_type === "slow_transition"
      )
      expect(slowBottleneck).toBeDefined()
      expect(slowBottleneck!.route_pattern).toBe("/slow-route")
    })
  })

  describe("calculateJourneyScore", () => {
    it("should calculate journey performance score correctly", async () => {
      const journey = createMockJourney()
      const score = await tracker.calculateJourneyScore(journey)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it("should apply completion bonus for completed journeys", async () => {
      const completedJourney = createMockJourney({
        completion_status: "completed",
      })
      const abandonedJourney = createMockJourney({
        completion_status: "abandoned",
      })

      const completedScore =
        await tracker.calculateJourneyScore(completedJourney)
      const abandonedScore =
        await tracker.calculateJourneyScore(abandonedJourney)

      // Completed journeys should generally score higher (with same performance)
      expect(completedScore).toBeGreaterThan(abandonedScore)
    })

    it("should apply bottleneck penalty", async () => {
      const journeyWithBottlenecks = createMockJourney({
        bottleneck_points: [createMockBottleneck(), createMockBottleneck()],
      })
      const journeyWithoutBottlenecks = createMockJourney({
        bottleneck_points: [],
      })

      const scoreWithBottlenecks = await tracker.calculateJourneyScore(
        journeyWithBottlenecks
      )
      const scoreWithoutBottlenecks = await tracker.calculateJourneyScore(
        journeyWithoutBottlenecks
      )

      expect(scoreWithBottlenecks).toBeLessThan(scoreWithoutBottlenecks)
    })

    it("should return default score for journeys with no performance data", async () => {
      const journey = createMockJourney({ performance_trajectory: [] })
      const score = await tracker.calculateJourneyScore(journey)

      expect(score).toBe(50)
    })
  })

  describe("Journey completion status", () => {
    it("should mark journeys as completed with sufficient routes and duration", async () => {
      const journey = createMockJourney({
        route_sequence: [
          createMockRouteVisit("/home"),
          createMockRouteVisit("/game"),
          createMockRouteVisit("/profile"),
          createMockRouteVisit("/settings"),
        ],
        journey_duration: 120000, // 2 minutes
      })

      // Simulate finalization logic
      const status = (tracker as any).determineCompletionStatus(journey)
      expect(status).toBe("completed")
    })

    it("should mark journeys as abandoned with few routes or short duration", async () => {
      const journey = createMockJourney({
        route_sequence: [createMockRouteVisit("/home")],
        journey_duration: 5000, // 5 seconds
      })

      const status = (tracker as any).determineCompletionStatus(journey)
      expect(status).toBe("abandoned")
    })

    it("should mark journeys as in_progress for intermediate cases", async () => {
      const journey = createMockJourney({
        route_sequence: [
          createMockRouteVisit("/home"),
          createMockRouteVisit("/game"),
        ],
        journey_duration: 15000, // 15 seconds
      })

      const status = (tracker as any).determineCompletionStatus(journey)
      expect(status).toBe("in_progress")
    })
  })
})

// Helper functions for creating mock data

function createMockSessionData(): PerformanceSession[] {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  return [
    {
      id: "session1",
      anonymous_user_id: "user1",
      session_start: threeDaysAgo.toISOString(),
      session_end: new Date(
        threeDaysAgo.getTime() + 30 * 60 * 1000
      ).toISOString(),
      app_version: "1.0.0",
      device_type: "mobile",
      os_version: "iOS 15",
      created_at: threeDaysAgo.toISOString(),
    },
    {
      id: "session2",
      anonymous_user_id: "user1",
      session_start: twoHoursAgo.toISOString(),
      session_end: oneHourAgo.toISOString(),
      app_version: "1.0.0",
      device_type: "mobile",
      os_version: "iOS 15",
      created_at: twoHoursAgo.toISOString(),
    },
    {
      id: "session3",
      anonymous_user_id: "user2",
      session_start: oneHourAgo.toISOString(),
      session_end: now.toISOString(),
      app_version: "1.0.0",
      device_type: "desktop",
      os_version: "macOS 12",
      created_at: oneHourAgo.toISOString(),
    },
  ]
}

function createMockMetricsData(): PerformanceMetric[] {
  return [
    {
      id: "metric1",
      session_id: "session1",
      metric_type: "screen_time",
      metric_value: 30000,
      metric_unit: "ms",
      context: { screen_name: "Home" },
      timestamp: "2023-01-01T10:00:00Z",
      created_at: "2023-01-01T10:00:00Z",
    },
    {
      id: "metric2",
      session_id: "session1",
      metric_type: "fps",
      metric_value: 55,
      metric_unit: "fps",
      context: { screen_name: "Home" },
      timestamp: "2023-01-01T10:00:30Z",
      created_at: "2023-01-01T10:00:30Z",
    },
    {
      id: "metric3",
      session_id: "session1",
      metric_type: "memory_usage",
      metric_value: 250,
      metric_unit: "MB",
      context: { screen_name: "Home" },
      timestamp: "2023-01-01T10:01:00Z",
      created_at: "2023-01-01T10:01:00Z",
    },
  ]
}

function createMockJourneyWithBottlenecks(): UserJourney {
  return {
    journey_id: "test-journey-bottlenecks",
    session_id: "test-session",
    device_id: "test-device",
    anonymous_user_id: "test-user",
    route_sequence: [
      createMockRouteVisit("/home"),
      createMockRouteVisit("/slow-game"),
      createMockRouteVisit("/profile"),
    ],
    journey_duration: 180000,
    performance_trajectory: [
      {
        timestamp: "2023-01-01T10:00:00Z",
        fps: 60,
        memory_usage: 200,
        cpu_usage: 30,
        route_pattern: "/home",
      },
      {
        timestamp: "2023-01-01T10:01:00Z",
        fps: 25,
        memory_usage: 600,
        cpu_usage: 80,
        route_pattern: "/slow-game",
      },
      {
        timestamp: "2023-01-01T10:02:00Z",
        fps: 55,
        memory_usage: 300,
        cpu_usage: 40,
        route_pattern: "/profile",
      },
    ],
    bottleneck_points: [
      createMockBottleneck(),
      {
        route_pattern: "/slow-game",
        timestamp: "2023-01-01T10:01:00Z",
        bottleneck_type: "memory_spike",
        severity: "high",
        impact_score: 75,
        description: "Memory spike in slow game route",
      },
    ],
    journey_score: 65,
    completion_status: "completed",
    journey_start: "2023-01-01T10:00:00Z",
    journey_end: "2023-01-01T10:03:00Z",
  }
}

function createMockJourney(overrides?: Partial<UserJourney>): UserJourney {
  return {
    journey_id: "test-journey",
    session_id: "test-session",
    device_id: "test-device",
    anonymous_user_id: "test-user",
    route_sequence: [
      createMockRouteVisit("/home"),
      createMockRouteVisit("/game"),
      createMockRouteVisit("/profile"),
    ],
    journey_duration: 60000,
    performance_trajectory: [
      {
        timestamp: "2023-01-01T10:00:00Z",
        fps: 55,
        memory_usage: 400,
        cpu_usage: 30,
        route_pattern: "/home",
      },
      {
        timestamp: "2023-01-01T10:01:00Z",
        fps: 50,
        memory_usage: 450,
        cpu_usage: 35,
        route_pattern: "/game",
      },
    ],
    bottleneck_points: [],
    journey_score: 75,
    completion_status: "completed",
    journey_start: "2023-01-01T10:00:00Z",
    journey_end: "2023-01-01T10:01:00Z",
    ...overrides,
  }
}

function createMockRouteVisit(routePattern: string) {
  return {
    route_pattern: routePattern,
    route_name: routePattern.substring(1),
    entry_timestamp: "2023-01-01T10:00:00Z",
    exit_timestamp: "2023-01-01T10:00:30Z",
    duration: 30000,
    performance_metrics: {
      avg_fps: 55,
      avg_memory: 400,
      avg_cpu: 30,
      avg_load_time: 2000,
    },
    transition_performance: {
      transition_time: 1000,
      memory_spike: 50,
      cpu_spike: 10,
    },
  }
}

function createMockBottleneck(): BottleneckPoint {
  return {
    route_pattern: "/slow-route",
    timestamp: "2023-01-01T10:00:00Z",
    bottleneck_type: "performance_drop",
    severity: "high",
    impact_score: 50,
    description: "Test bottleneck",
  }
}
