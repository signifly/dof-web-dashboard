import {
  analyzeJourneyAbandonmentPatterns,
  identifyHighValueJourneyPaths,
  detectJourneyPerformanceRegression,
  analyzeCompletionRatesByLength,
  identifyProblematicRoutes,
  calculateJourneyFlowEfficiency,
  analyzeJourneyPatternsByDevice,
} from "@/lib/utils/journey-analysis"
import { UserJourney, JourneyPattern } from "@/types/user-journey"

describe("Journey Analysis Utilities", () => {
  let mockJourneys: UserJourney[]
  let mockPatterns: JourneyPattern[]

  beforeEach(() => {
    mockJourneys = createMockJourneyData()
    mockPatterns = createMockPatternData()
  })

  describe("analyzeJourneyAbandonmentPatterns", () => {
    it("should identify abandonment points correctly", () => {
      const abandonmentPatterns =
        analyzeJourneyAbandonmentPatterns(mockJourneys)

      expect(abandonmentPatterns).toBeDefined()
      expect(abandonmentPatterns.length).toBeGreaterThan(0)

      abandonmentPatterns.forEach(pattern => {
        expect(pattern.abandonment_point).toBeDefined()
        expect(pattern.frequency).toBeGreaterThan(0)
        expect(pattern.avg_time_to_abandonment).toBeGreaterThan(0)
        expect(Array.isArray(pattern.common_preceding_routes)).toBe(true)
      })
    })

    it("should sort patterns by frequency descending", () => {
      const abandonmentPatterns =
        analyzeJourneyAbandonmentPatterns(mockJourneys)

      for (let i = 1; i < abandonmentPatterns.length; i++) {
        expect(abandonmentPatterns[i - 1].frequency).toBeGreaterThanOrEqual(
          abandonmentPatterns[i].frequency
        )
      }
    })

    it("should only analyze abandoned journeys", () => {
      const allCompletedJourneys = mockJourneys.map(j => ({
        ...j,
        completion_status: "completed" as const,
      }))
      const abandonmentPatterns =
        analyzeJourneyAbandonmentPatterns(allCompletedJourneys)

      expect(abandonmentPatterns).toEqual([])
    })

    it("should calculate correct average time to abandonment", () => {
      const testJourneys = [
        createMockJourney({
          completion_status: "abandoned",
          journey_duration: 60000,
          route_sequence: [
            createMockRouteVisit("/home"),
            createMockRouteVisit("/game"),
          ],
        }),
        createMockJourney({
          completion_status: "abandoned",
          journey_duration: 120000,
          route_sequence: [
            createMockRouteVisit("/profile"),
            createMockRouteVisit("/game"),
          ],
        }),
      ]

      const patterns = analyzeJourneyAbandonmentPatterns(testJourneys)
      const gamePattern = patterns.find(p => p.abandonment_point === "/game")

      expect(gamePattern).toBeDefined()
      expect(gamePattern!.avg_time_to_abandonment).toBe(90000) // (60000 + 120000) / 2
    })
  })

  describe("identifyHighValueJourneyPaths", () => {
    it("should identify patterns with good completion rates and frequency", () => {
      const highValuePaths = identifyHighValueJourneyPaths(mockPatterns)

      highValuePaths.forEach(pattern => {
        expect(pattern.completion_rate).toBeGreaterThan(0.7)
        expect(pattern.frequency).toBeGreaterThanOrEqual(5)
      })
    })

    it("should sort by completion rate × frequency descending", () => {
      const highValuePaths = identifyHighValueJourneyPaths(mockPatterns)

      for (let i = 1; i < highValuePaths.length; i++) {
        const prevValue =
          highValuePaths[i - 1].completion_rate *
          highValuePaths[i - 1].frequency
        const currValue =
          highValuePaths[i].completion_rate * highValuePaths[i].frequency
        expect(prevValue).toBeGreaterThanOrEqual(currValue)
      }
    })

    it("should filter out low-value patterns", () => {
      const lowValuePatterns = [
        { ...mockPatterns[0], completion_rate: 0.5, frequency: 10 }, // Low completion rate
        { ...mockPatterns[0], completion_rate: 0.9, frequency: 2 }, // Low frequency
      ]

      const highValuePaths = identifyHighValueJourneyPaths(lowValuePatterns)
      expect(highValuePaths).toEqual([])
    })
  })

  describe("detectJourneyPerformanceRegression", () => {
    it("should detect performance regressions between current and historical data", () => {
      const currentJourneys = [
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 30,
                avg_memory: 600,
                avg_cpu: 80,
                avg_load_time: 3000,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 25,
                avg_memory: 650,
                avg_cpu: 85,
                avg_load_time: 3200,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 35,
                avg_memory: 550,
                avg_cpu: 75,
                avg_load_time: 2800,
              },
            },
          ],
        }),
      ]
      const historicalJourneys = [
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 60,
                avg_memory: 200,
                avg_cpu: 30,
                avg_load_time: 1000,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 58,
                avg_memory: 220,
                avg_cpu: 32,
                avg_load_time: 1100,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/home"),
              performance_metrics: {
                avg_fps: 62,
                avg_memory: 180,
                avg_cpu: 28,
                avg_load_time: 900,
              },
            },
          ],
        }),
      ]

      const regressions = detectJourneyPerformanceRegression(
        currentJourneys,
        historicalJourneys
      )

      expect(regressions.length).toBeGreaterThan(0)
      regressions.forEach(regression => {
        expect(regression.route_pattern).toBeDefined()
        expect(typeof regression.performance_change).toBe("number")
        expect(regression.significance).toMatch(/^(high|medium|low)$/)
        expect(regression.sample_size).toBeGreaterThanOrEqual(3)
      })
    })

    it("should sort regressions by absolute performance change", () => {
      const currentJourneys = createMockJourneysWithPerformanceChanges()
      const historicalJourneys = createMockBaselineJourneys()

      const regressions = detectJourneyPerformanceRegression(
        currentJourneys,
        historicalJourneys
      )

      for (let i = 1; i < regressions.length; i++) {
        const prevChange = Math.abs(regressions[i - 1].performance_change)
        const currChange = Math.abs(regressions[i].performance_change)
        expect(prevChange).toBeGreaterThanOrEqual(currChange)
      }
    })

    it("should classify regression significance correctly", () => {
      const currentJourneys = [
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/severe"),
              performance_metrics: {
                avg_fps: 20,
                avg_memory: 800,
                avg_cpu: 90,
                avg_load_time: 5000,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/severe"),
              performance_metrics: {
                avg_fps: 25,
                avg_memory: 750,
                avg_cpu: 85,
                avg_load_time: 4500,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/severe"),
              performance_metrics: {
                avg_fps: 18,
                avg_memory: 850,
                avg_cpu: 95,
                avg_load_time: 5500,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/moderate"),
              performance_metrics: {
                avg_fps: 45,
                avg_memory: 350,
                avg_cpu: 50,
                avg_load_time: 2500,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/moderate"),
              performance_metrics: {
                avg_fps: 48,
                avg_memory: 320,
                avg_cpu: 45,
                avg_load_time: 2300,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/moderate"),
              performance_metrics: {
                avg_fps: 42,
                avg_memory: 380,
                avg_cpu: 55,
                avg_load_time: 2700,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/minor"),
              performance_metrics: {
                avg_fps: 55,
                avg_memory: 250,
                avg_cpu: 35,
                avg_load_time: 1500,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/minor"),
              performance_metrics: {
                avg_fps: 53,
                avg_memory: 270,
                avg_cpu: 37,
                avg_load_time: 1600,
              },
            },
          ],
        }),
        createMockJourney({
          route_sequence: [
            {
              ...createMockRouteVisit("/minor"),
              performance_metrics: {
                avg_fps: 57,
                avg_memory: 230,
                avg_cpu: 33,
                avg_load_time: 1400,
              },
            },
          ],
        }),
      ]
      const historicalJourneys = createMockBaselineJourneys()

      const regressions = detectJourneyPerformanceRegression(
        currentJourneys,
        historicalJourneys
      )

      expect(regressions.length).toBeGreaterThan(0)

      // Check that we have regressions with different significance levels
      const significanceLevels = regressions.map(r => r.significance)
      expect(significanceLevels).toContain("high")

      // Find the most severe regression (should be 'high' significance)
      const mostSevereRegression = regressions[0] // Should be sorted by severity
      expect(mostSevereRegression.significance).toBe("high")
    })

    it("should ignore routes with insufficient sample size", () => {
      const currentJourneys = [createMockJourney()] // Only 1 journey
      const historicalJourneys = [createMockJourney()] // Only 1 journey

      const regressions = detectJourneyPerformanceRegression(
        currentJourneys,
        historicalJourneys
      )

      expect(regressions).toEqual([])
    })
  })

  describe("analyzeCompletionRatesByLength", () => {
    it("should group journeys by route sequence length", () => {
      const completionAnalysis = analyzeCompletionRatesByLength(mockJourneys)

      expect(completionAnalysis.length).toBeGreaterThan(0)

      completionAnalysis.forEach(analysis => {
        expect(analysis.sequence_length).toBeGreaterThan(0)
        expect(analysis.total_journeys).toBeGreaterThan(0)
        expect(analysis.completion_rate).toBeGreaterThanOrEqual(0)
        expect(analysis.completion_rate).toBeLessThanOrEqual(1)
        expect(analysis.avg_performance_score).toBeGreaterThanOrEqual(0)
      })
    })

    it("should sort by sequence length ascending", () => {
      const completionAnalysis = analyzeCompletionRatesByLength(mockJourneys)

      for (let i = 1; i < completionAnalysis.length; i++) {
        expect(completionAnalysis[i - 1].sequence_length).toBeLessThanOrEqual(
          completionAnalysis[i].sequence_length
        )
      }
    })

    it("should calculate completion rates correctly", () => {
      const testJourneys = [
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/home")],
        }),
        createMockJourney({
          completion_status: "abandoned",
          route_sequence: [createMockRouteVisit("/home")],
        }),
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/home")],
        }),
      ]

      const analysis = analyzeCompletionRatesByLength(testJourneys)
      const singleRouteAnalysis = analysis.find(a => a.sequence_length === 1)

      expect(singleRouteAnalysis).toBeDefined()
      expect(singleRouteAnalysis!.completion_rate).toBeCloseTo(2 / 3, 2) // 2 completed out of 3 total
    })
  })

  describe("identifyProblematicRoutes", () => {
    it("should identify routes with high abandonment correlation", () => {
      const problematicRoutes = identifyProblematicRoutes(mockJourneys)

      problematicRoutes.forEach(route => {
        expect(route.route_pattern).toBeDefined()
        expect(route.abandonment_correlation).toBeGreaterThan(0.3)
        expect(route.frequency_in_abandoned_journeys).toBeGreaterThanOrEqual(3)
        expect(route.avg_performance_impact).toBeGreaterThanOrEqual(0)
      })
    })

    it("should sort by abandonment correlation descending", () => {
      const problematicRoutes = identifyProblematicRoutes(mockJourneys)

      for (let i = 1; i < problematicRoutes.length; i++) {
        expect(
          problematicRoutes[i - 1].abandonment_correlation
        ).toBeGreaterThanOrEqual(problematicRoutes[i].abandonment_correlation)
      }
    })

    it("should filter out routes with low frequency or correlation", () => {
      const testJourneys = [
        createMockJourney({
          completion_status: "abandoned",
          route_sequence: [createMockRouteVisit("/rare-route")],
        }), // Only 1 occurrence
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/good-route")],
        }),
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/good-route")],
        }),
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/good-route")],
        }),
        createMockJourney({
          completion_status: "completed",
          route_sequence: [createMockRouteVisit("/good-route")],
        }),
      ]

      const problematicRoutes = identifyProblematicRoutes(testJourneys)

      // Should not include /rare-route (frequency < 3) or /good-route (correlation < 0.3)
      expect(problematicRoutes).toEqual([])
    })
  })

  describe("calculateJourneyFlowEfficiency", () => {
    it("should calculate flow efficiency metrics correctly", () => {
      const efficiency = calculateJourneyFlowEfficiency(mockJourneys)

      expect(efficiency.avg_journey_duration).toBeGreaterThan(0)
      expect(efficiency.avg_routes_per_journey).toBeGreaterThan(0)
      expect(efficiency.avg_time_per_route).toBeGreaterThan(0)
      expect(efficiency.efficiency_score).toBeGreaterThanOrEqual(0)
      expect(efficiency.efficiency_score).toBeLessThanOrEqual(100)
      expect(efficiency.bottleneck_frequency).toBeGreaterThanOrEqual(0)
    })

    it("should return zero metrics for empty journey array", () => {
      const efficiency = calculateJourneyFlowEfficiency([])

      expect(efficiency.avg_journey_duration).toBe(0)
      expect(efficiency.avg_routes_per_journey).toBe(0)
      expect(efficiency.avg_time_per_route).toBe(0)
      expect(efficiency.efficiency_score).toBe(0)
      expect(efficiency.bottleneck_frequency).toBe(0)
    })

    it("should calculate efficiency score based on time per route", () => {
      const fastJourneys = [
        createMockJourney({
          journey_duration: 60000, // 1 minute
          route_sequence: [
            createMockRouteVisit("/fast1"),
            createMockRouteVisit("/fast2"),
          ], // 30s per route
        }),
      ]

      const slowJourneys = [
        createMockJourney({
          journey_duration: 300000, // 5 minutes
          route_sequence: [
            createMockRouteVisit("/slow1"),
            createMockRouteVisit("/slow2"),
          ], // 150s per route
        }),
      ]

      const fastEfficiency = calculateJourneyFlowEfficiency(fastJourneys)
      const slowEfficiency = calculateJourneyFlowEfficiency(slowJourneys)

      expect(fastEfficiency.efficiency_score).toBeGreaterThan(
        slowEfficiency.efficiency_score
      )
    })
  })

  describe("analyzeJourneyPatternsByDevice", () => {
    it("should group journeys by device type", () => {
      const deviceAnalysis = analyzeJourneyPatternsByDevice(mockJourneys)

      expect(deviceAnalysis.length).toBeGreaterThan(0)

      deviceAnalysis.forEach(analysis => {
        expect(analysis.device_type).toBeDefined()
        expect(analysis.total_journeys).toBeGreaterThan(0)
        expect(analysis.avg_completion_rate).toBeGreaterThanOrEqual(0)
        expect(analysis.avg_completion_rate).toBeLessThanOrEqual(1)
        expect(analysis.avg_performance_score).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(analysis.common_bottlenecks)).toBe(true)
      })
    })

    it("should sort by total journeys descending", () => {
      const deviceAnalysis = analyzeJourneyPatternsByDevice(mockJourneys)

      for (let i = 1; i < deviceAnalysis.length; i++) {
        expect(deviceAnalysis[i - 1].total_journeys).toBeGreaterThanOrEqual(
          deviceAnalysis[i].total_journeys
        )
      }
    })

    it("should identify common bottlenecks per device type", () => {
      const testJourneys = [
        createMockJourney({
          device_id: "mobile",
          bottleneck_points: [
            {
              route_pattern: "/mobile-heavy",
              timestamp: "2023-01-01",
              bottleneck_type: "memory_spike",
              severity: "high",
              impact_score: 80,
              description: "test",
            },
          ],
        }),
        createMockJourney({
          device_id: "mobile",
          bottleneck_points: [
            {
              route_pattern: "/mobile-heavy",
              timestamp: "2023-01-01",
              bottleneck_type: "memory_spike",
              severity: "high",
              impact_score: 80,
              description: "test",
            },
          ],
        }),
      ]

      const deviceAnalysis = analyzeJourneyPatternsByDevice(testJourneys)
      const mobileAnalysis = deviceAnalysis.find(
        d => d.device_type === "mobile"
      )

      expect(mobileAnalysis).toBeDefined()
      expect(mobileAnalysis!.common_bottlenecks).toContain("/mobile-heavy")
    })
  })
})

// Helper functions for creating mock data

function createMockJourneyData(): UserJourney[] {
  return [
    createMockJourney({
      anonymous_user_id: "user1",
      completion_status: "completed",
      route_sequence: [
        createMockRouteVisit("/home"),
        createMockRouteVisit("/game"),
        createMockRouteVisit("/profile"),
      ],
      journey_score: 80,
      device_id: "mobile",
    }),
    createMockJourney({
      anonymous_user_id: "user2",
      completion_status: "abandoned",
      route_sequence: [
        createMockRouteVisit("/home"),
        createMockRouteVisit("/game"),
      ],
      journey_score: 45,
      device_id: "desktop",
    }),
    createMockJourney({
      anonymous_user_id: "user3",
      completion_status: "abandoned",
      route_sequence: [createMockRouteVisit("/settings")],
      journey_score: 30,
      device_id: "mobile",
    }),
    createMockJourney({
      anonymous_user_id: "user4",
      completion_status: "completed",
      route_sequence: [
        createMockRouteVisit("/home"),
        createMockRouteVisit("/profile"),
        createMockRouteVisit("/settings"),
      ],
      journey_score: 75,
      device_id: "tablet",
    }),
  ]
}

function createMockPatternData(): JourneyPattern[] {
  return [
    {
      pattern_id: "pattern1",
      route_sequence: ["/home", "/game", "/profile"],
      frequency: 10,
      avg_performance_score: 80,
      common_bottlenecks: [],
      optimization_potential: 20,
      user_impact_score: 60,
      avg_journey_duration: 120000,
      completion_rate: 0.8,
    },
    {
      pattern_id: "pattern2",
      route_sequence: ["/home", "/settings"],
      frequency: 5,
      avg_performance_score: 90,
      common_bottlenecks: [],
      optimization_potential: 10,
      user_impact_score: 30,
      avg_journey_duration: 60000,
      completion_rate: 0.9,
    },
    {
      pattern_id: "pattern3",
      route_sequence: ["/profile"],
      frequency: 3,
      avg_performance_score: 60,
      common_bottlenecks: ["/profile"],
      optimization_potential: 60,
      user_impact_score: 80,
      avg_journey_duration: 30000,
      completion_rate: 0.5,
    },
  ]
}

function createMockJourneysWithPerformanceChanges(): UserJourney[] {
  return [
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 20,
            avg_memory: 800,
            avg_cpu: 90,
            avg_load_time: 5000,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 25,
            avg_memory: 750,
            avg_cpu: 85,
            avg_load_time: 4500,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 18,
            avg_memory: 850,
            avg_cpu: 95,
            avg_load_time: 5500,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 45,
            avg_memory: 350,
            avg_cpu: 50,
            avg_load_time: 2500,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 48,
            avg_memory: 320,
            avg_cpu: 45,
            avg_load_time: 2300,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 42,
            avg_memory: 380,
            avg_cpu: 55,
            avg_load_time: 2700,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 55,
            avg_memory: 250,
            avg_cpu: 35,
            avg_load_time: 1500,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 53,
            avg_memory: 270,
            avg_cpu: 37,
            avg_load_time: 1600,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 57,
            avg_memory: 230,
            avg_cpu: 33,
            avg_load_time: 1400,
          },
        },
      ],
    }),
  ]
}

function createMockBaselineJourneys(): UserJourney[] {
  return [
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 60,
            avg_memory: 200,
            avg_cpu: 30,
            avg_load_time: 1000,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 58,
            avg_memory: 220,
            avg_cpu: 32,
            avg_load_time: 1100,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/severe"),
          performance_metrics: {
            avg_fps: 62,
            avg_memory: 180,
            avg_cpu: 28,
            avg_load_time: 900,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 60,
            avg_memory: 200,
            avg_cpu: 30,
            avg_load_time: 1000,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 58,
            avg_memory: 220,
            avg_cpu: 32,
            avg_load_time: 1100,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/moderate"),
          performance_metrics: {
            avg_fps: 62,
            avg_memory: 180,
            avg_cpu: 28,
            avg_load_time: 900,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 60,
            avg_memory: 200,
            avg_cpu: 30,
            avg_load_time: 1000,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 58,
            avg_memory: 220,
            avg_cpu: 32,
            avg_load_time: 1100,
          },
        },
      ],
    }),
    createMockJourney({
      route_sequence: [
        {
          ...createMockRouteVisit("/minor"),
          performance_metrics: {
            avg_fps: 62,
            avg_memory: 180,
            avg_cpu: 28,
            avg_load_time: 900,
          },
        },
      ],
    }),
  ]
}

function createMockJourney(overrides?: Partial<UserJourney>): UserJourney {
  return {
    journey_id: `test-journey-${Math.random()}`,
    session_id: "test-session",
    device_id: "test-device",
    anonymous_user_id: "test-user",
    route_sequence: [
      createMockRouteVisit("/home"),
      createMockRouteVisit("/game"),
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
