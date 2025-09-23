import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { InsightsDashboard } from "@/components/insights/insights-dashboard"
import { InsightsReport } from "@/types/insights"

// Mock the child components
jest.mock("@/components/insights/performance-score-card", () => ({
  PerformanceScoreCard: ({ score }: any) => (
    <div data-testid="performance-score-card">Score: {score.overall}</div>
  ),
}))

jest.mock("@/components/insights/insights-list", () => ({
  InsightsList: ({ insights }: any) => (
    <div data-testid="insights-list">Insights: {insights.length}</div>
  ),
}))

jest.mock("@/components/insights/recommendations-panel", () => ({
  RecommendationsPanel: ({ recommendations }: any) => (
    <div data-testid="recommendations-panel">
      Recommendations: {recommendations.length}
    </div>
  ),
}))

jest.mock("@/components/insights/trends-overview", () => ({
  TrendsOverview: ({ trends }: any) => (
    <div data-testid="trends-overview">
      Trends: {Object.keys(trends).length}
    </div>
  ),
}))

describe("InsightsDashboard", () => {
  const mockReport: InsightsReport = {
    id: "report-123",
    generated_at: "2023-01-01T12:00:00Z",
    time_range: {
      start: "2023-01-01T00:00:00Z",
      end: "2023-01-01T23:59:59Z",
    },
    performance_score: {
      overall: 75,
      breakdown: {
        fps: 70,
        cpu: 80,
        memory: 75,
      },
      grade: "B",
      trend: "improving",
      last_calculated: "2023-01-01T12:00:00Z",
    },
    insights: [
      {
        id: "insight-1",
        type: "trend_decline",
        severity: "high",
        title: "FPS Performance Declining",
        description: "Frame rate has decreased by 15% over the past week",
        confidence: 0.85,
        impact: "high",
        category: "performance",
        detected_at: "2023-01-01T10:00:00Z",
        data_context: {
          metric_type: "fps",
          value: 30,
          baseline: 45,
          deviation: -15,
          affected_sessions: 25,
        },
      },
    ],
    recommendations: [
      {
        id: "rec-1",
        insight_id: "insight-1",
        title: "Optimize Rendering Pipeline",
        description: "Implement GPU profiling and texture optimization",
        category: "performance",
        impact: "high",
        effort: "medium",
        priority_score: 4.2,
        actionable_steps: [
          "Profile GPU usage during heavy scenes",
          "Optimize texture compression settings",
        ],
        estimated_improvement: "15-25% FPS improvement",
        related_metrics: ["fps", "gpu_usage"],
        implementation_time: "2-3 development days",
        status: "pending",
        created_at: "2023-01-01T12:00:00Z",
      },
    ],
    summary: {
      total_insights: 1,
      critical_issues: 0,
      improvement_opportunities: 1,
      estimated_impact: "Moderate performance improvement expected",
      top_priority_recommendations: 1,
    },
    trends: {
      fps_trend: {
        direction: "down",
        slope: -1.2,
        confidence: 0.85,
        significance: "high",
        r_squared: 0.75,
        forecast: 28,
        data_points: 50,
        time_period: "7 days",
      },
      memory_trend: {
        direction: "stable",
        slope: 0.1,
        confidence: 0.3,
        significance: "low",
        r_squared: 0.1,
        data_points: 50,
        time_period: "7 days",
      },
      cpu_trend: {
        direction: "stable",
        slope: -0.2,
        confidence: 0.4,
        significance: "low",
        r_squared: 0.15,
        data_points: 50,
        time_period: "7 days",
      },
    },
    anomalies: [
      {
        id: "anomaly-1",
        metric_type: "fps",
        value: 10,
        expected_value: 35,
        deviation: -25,
        z_score: 3.5,
        severity: "critical",
        timestamp: "2023-01-01T11:30:00Z",
      },
    ],
    optimization_opportunities: [
      {
        id: "opp-1",
        type: "memory_optimization",
        potential_impact: "high",
        affected_metric: "memory_usage",
        current_value: 600,
        target_value: 400,
        improvement_potential: 33,
        complexity: "moderate",
        description: "Optimize memory allocation patterns to reduce usage",
      },
    ],
    metadata: {
      analysis_duration_ms: 1250,
      data_points_analyzed: 150,
      confidence_level: 0.75,
    },
  }

  it("should render all main components", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByTestId("performance-score-card")).toBeInTheDocument()
    expect(screen.getByTestId("insights-list")).toBeInTheDocument()
    expect(screen.getByTestId("recommendations-panel")).toBeInTheDocument()
    expect(screen.getByTestId("trends-overview")).toBeInTheDocument()
  })

  it("should display report generation time", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByText(/Generated at/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 1, 2023/)).toBeInTheDocument()
  })

  it("should display time range information", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByText(/Analysis Period/)).toBeInTheDocument()
  })

  it("should show anomalies section when anomalies exist", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByText(/Performance Anomalies/)).toBeInTheDocument()
    expect(screen.getByText(/1 anomaly detected/)).toBeInTheDocument()
  })

  it("should hide anomalies section when no anomalies", () => {
    const reportWithoutAnomalies = {
      ...mockReport,
      anomalies: [],
    }

    render(<InsightsDashboard report={reportWithoutAnomalies} />)

    expect(screen.queryByText(/Performance Anomalies/)).not.toBeInTheDocument()
  })

  it("should show optimization opportunities section", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByText(/Optimization Opportunities/)).toBeInTheDocument()
    expect(screen.getByText(/1 opportunity identified/)).toBeInTheDocument()
  })

  it("should display metadata information", () => {
    render(<InsightsDashboard report={mockReport} />)

    expect(screen.getByText(/Analysis Metadata/)).toBeInTheDocument()
    expect(screen.getByText(/1.25s/)).toBeInTheDocument() // Analysis duration
    expect(screen.getByText(/150 data points/)).toBeInTheDocument()
    expect(screen.getByText(/75%/)).toBeInTheDocument() // Confidence level
  })

  it("should handle empty insights gracefully", () => {
    const emptyReport = {
      ...mockReport,
      insights: [],
      recommendations: [],
      anomalies: [],
      optimization_opportunities: [],
      summary: {
        ...mockReport.summary,
        total_insights: 0,
        critical_issues: 0,
        improvement_opportunities: 0,
        top_priority_recommendations: 0,
      },
    }

    render(<InsightsDashboard report={emptyReport} />)

    expect(screen.getByTestId("insights-list")).toHaveTextContent("Insights: 0")
    expect(screen.getByTestId("recommendations-panel")).toHaveTextContent(
      "Recommendations: 0"
    )
  })

  it("should display critical issues badge when present", () => {
    const reportWithCritical = {
      ...mockReport,
      insights: [
        {
          ...mockReport.insights[0],
          severity: "critical" as const,
        },
      ],
      summary: {
        ...mockReport.summary,
        critical_issues: 1,
      },
    }

    render(<InsightsDashboard report={reportWithCritical} />)

    expect(screen.getByText(/1 critical issue/)).toBeInTheDocument()
  })

  it("should handle large numbers in metadata", () => {
    const reportWithLargeMetadata = {
      ...mockReport,
      metadata: {
        analysis_duration_ms: 15750,
        data_points_analyzed: 10000,
        confidence_level: 0.95,
      },
    }

    render(<InsightsDashboard report={reportWithLargeMetadata} />)

    expect(screen.getByText(/15.75s/)).toBeInTheDocument()
    expect(screen.getByText(/10,000 data points/)).toBeInTheDocument()
    expect(screen.getByText(/95%/)).toBeInTheDocument()
  })

  it("should format anomaly information correctly", () => {
    const reportWithMultipleAnomalies = {
      ...mockReport,
      anomalies: [
        mockReport.anomalies[0],
        {
          id: "anomaly-2",
          metric_type: "memory",
          value: 1000,
          expected_value: 500,
          deviation: 500,
          z_score: 2.8,
          severity: "high" as const,
          timestamp: "2023-01-01T11:45:00Z",
        },
      ],
    }

    render(<InsightsDashboard report={reportWithMultipleAnomalies} />)

    expect(screen.getByText(/2 anomalies detected/)).toBeInTheDocument()
  })

  it("should format opportunity information correctly", () => {
    const reportWithMultipleOpportunities = {
      ...mockReport,
      optimization_opportunities: [
        mockReport.optimization_opportunities[0],
        {
          id: "opp-2",
          type: "cpu_optimization" as const,
          potential_impact: "medium" as const,
          affected_metric: "cpu_usage",
          current_value: 70,
          target_value: 50,
          improvement_potential: 28,
          complexity: "simple" as const,
          description: "Optimize CPU intensive operations",
        },
      ],
    }

    render(<InsightsDashboard report={reportWithMultipleOpportunities} />)

    expect(screen.getByText(/2 opportunities identified/)).toBeInTheDocument()
  })

  it("should have proper accessibility attributes", () => {
    render(<InsightsDashboard report={mockReport} />)

    const mainContainer =
      screen.getByRole("main") || screen.getByTestId("insights-dashboard")
    expect(mainContainer).toBeInTheDocument()

    // Check for proper headings hierarchy
    expect(
      screen.getByText(/Performance Insights Dashboard/)
    ).toBeInTheDocument()
  })

  it("should handle edge cases in time formatting", () => {
    const reportWithEdgeTime = {
      ...mockReport,
      generated_at: "2023-12-31T23:59:59.999Z", // End of year edge case
      time_range: {
        start: "2023-12-31T00:00:00Z",
        end: "2023-12-31T23:59:59Z",
      },
    }

    render(<InsightsDashboard report={reportWithEdgeTime} />)

    expect(screen.getByText(/Dec 31, 2023/)).toBeInTheDocument()
  })

  it("should maintain component props structure", () => {
    render(<InsightsDashboard report={mockReport} />)

    // Verify that child components receive the correct props
    expect(screen.getByTestId("performance-score-card")).toHaveTextContent(
      "Score: 75"
    )
    expect(screen.getByTestId("insights-list")).toHaveTextContent("Insights: 1")
    expect(screen.getByTestId("recommendations-panel")).toHaveTextContent(
      "Recommendations: 1"
    )
    expect(screen.getByTestId("trends-overview")).toHaveTextContent("Trends: 4")
  })

  it("should handle zero confidence level", () => {
    const reportWithZeroConfidence = {
      ...mockReport,
      metadata: {
        ...mockReport.metadata,
        confidence_level: 0,
      },
    }

    render(<InsightsDashboard report={reportWithZeroConfidence} />)

    expect(screen.getByText(/0%/)).toBeInTheDocument()
  })

  it("should handle very small analysis duration", () => {
    const reportWithFastAnalysis = {
      ...mockReport,
      metadata: {
        ...mockReport.metadata,
        analysis_duration_ms: 50,
      },
    }

    render(<InsightsDashboard report={reportWithFastAnalysis} />)

    expect(screen.getByText(/0.05s/)).toBeInTheDocument()
  })
})
