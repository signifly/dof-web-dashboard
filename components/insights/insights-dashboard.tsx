"use client"

import { Card } from "@/components/ui/card"
import { PerformanceScoreCard } from "./performance-score-card"
import { InsightsList } from "./insights-list"
import { RecommendationsPanel } from "./recommendations-panel"
import { TrendsOverview } from "./trends-overview"
import { InsightsReport } from "@/types/insights"
import { AlertTriangle, TrendingUp, Lightbulb, Activity } from "lucide-react"

interface InsightsDashboardProps {
  report: InsightsReport
}

export function InsightsDashboard({ report }: InsightsDashboardProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  const formatAnalysisDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Performance Insights Report</h1>
          <div className="text-sm text-muted-foreground">
            Generated: {formatTimestamp(report.generated_at)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Analysis period: {formatTimestamp(report.time_range.start)} to{" "}
          {formatTimestamp(report.time_range.end)}
        </div>
      </div>

      {/* Performance Score Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PerformanceScoreCard score={report.performance_score} />

        {/* Key Insights Summary Cards */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-3 h-fit">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Critical Issues
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {report.summary.critical_issues}
                </p>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Opportunities
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {report.summary.improvement_opportunities}
                </p>
                <p className="text-xs text-muted-foreground">
                  Optimization potential
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Est. Impact
                </h3>
                <p className="text-lg font-bold text-blue-600">
                  {report.summary.estimated_impact.split(" ")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report.summary.estimated_impact
                    .split(" ")
                    .slice(1)
                    .join(" ")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Trends Analysis */}
      <TrendsOverview trends={report.trends} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsList insights={report.insights} />
        <RecommendationsPanel recommendations={report.recommendations} />
      </div>

      {/* Anomalies Section */}
      {report.anomalies && report.anomalies.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Performance Anomalies Detected
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {report.anomalies.slice(0, 6).map(anomaly => (
              <div key={anomaly.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {anomaly.metric_type.replace("_", " ")}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      anomaly.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : anomaly.severity === "high"
                          ? "bg-orange-100 text-orange-800"
                          : anomaly.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {anomaly.severity}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-mono">
                      {anomaly.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-mono">
                      {anomaly.expected_value.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Z-Score:</span>
                    <span className="font-mono">
                      {anomaly.z_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {report.anomalies.length > 6 && (
            <div className="text-sm text-muted-foreground mt-4 text-center">
              +{report.anomalies.length - 6} more anomalies detected
            </div>
          )}
        </Card>
      )}

      {/* Optimization Opportunities */}
      {report.optimization_opportunities &&
        report.optimization_opportunities.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Optimization Opportunities
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {report.optimization_opportunities
                .slice(0, 4)
                .map(opportunity => (
                  <div
                    key={opportunity.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium capitalize">
                        {opportunity.type.replace("_", " ")}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          opportunity.potential_impact === "high"
                            ? "bg-red-100 text-red-800"
                            : opportunity.potential_impact === "medium"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {opportunity.potential_impact} impact
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {opportunity.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Current:</span>
                        <div className="font-mono">
                          {opportunity.current_value.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <div className="font-mono">
                          {opportunity.target_value.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Improvement:
                        </span>
                        <div className="font-mono text-green-600">
                          {opportunity.improvement_potential.toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Complexity:
                        </span>
                        <div className="capitalize">
                          {opportunity.complexity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

      {/* Report Metadata */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Analysis Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Analysis Duration:</span>
            <div className="font-mono">
              {formatAnalysisDuration(report.metadata.analysis_duration_ms)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Data Points:</span>
            <div className="font-mono">
              {report.metadata.data_points_analyzed.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence Level:</span>
            <div className="font-mono">
              {Math.round(report.metadata.confidence_level * 100)}%
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Report ID:</span>
            <div className="font-mono text-xs">
              {report.id.split("-")[0]}...
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
