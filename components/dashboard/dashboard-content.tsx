"use client"

import { useEffect, useState } from "react"
import {
  PerformanceSummaryCards,
  CPUInferenceNote,
} from "@/components/performance/performance-summary-cards"
import { PlatformBreakdown } from "@/components/performance/platform-breakdown"
import { RecentSessions } from "@/components/performance/recent-sessions"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { PerformanceTiers } from "@/components/analytics/performance-tiers"
import { FpsDistribution } from "@/components/analytics/fps-distribution"
import { MemoryPressure } from "@/components/analytics/memory-pressure"
import { RegressionDetection } from "@/components/analytics/regression-detection"
import { DataFreshness } from "@/components/ui/data-freshness"
import { RefreshSettings } from "@/components/settings/refresh-settings"
import { useSmartRefresh } from "@/lib/hooks/use-smart-refresh"
import { PerformanceSummary, MetricsTrend } from "@/lib/performance-data"
import { getDashboardDataClient } from "@/lib/performance-data-client"
import { Button } from "@/components/ui/button"
import { Settings, ChevronDown, ChevronUp } from "lucide-react"

interface DashboardContentProps {
  initialSummary: PerformanceSummary
  initialTrends: MetricsTrend[]
}

interface DashboardData {
  summary: PerformanceSummary
  trends: MetricsTrend[]
}

export function DashboardContent({
  initialSummary,
  initialTrends,
}: DashboardContentProps) {
  const [showSettings, setShowSettings] = useState(false)

  // Smart refresh for dashboard data
  const {
    data: dashboardData,
    isRefreshing,
    lastUpdated,
    nextRefresh,
    error,
    isPaused,
    refresh,
  } = useSmartRefresh<DashboardData>(
    async () => {
      return await getDashboardDataClient(50)
    },
    {
      interval: 30000, // 30 seconds for active dashboard data
      pauseOnInteraction: true,
      enabled: true,
      key: "dashboard-data",
      type: "active",
    },
    { summary: initialSummary, trends: initialTrends }
  )

  const summary = dashboardData?.summary || initialSummary
  const trends = dashboardData?.trends || initialTrends

  return (
    <div className="space-y-6">
      {/* Data freshness indicator and settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <DataFreshness
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            nextRefresh={nextRefresh}
            error={error}
            isPaused={isPaused}
            onRefresh={refresh}
            showNextRefresh={true}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
            {showSettings ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsible refresh settings */}
        {showSettings && (
          <div className="border rounded-lg p-4">
            <RefreshSettings sections={["intervals"]} compact={true} />
          </div>
        )}
      </div>

      {/* Performance Summary Cards */}
      <div>
        <PerformanceSummaryCards data={summary} />
        {summary.avgCpu > 0 && <CPUInferenceNote />}
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <PerformanceChart
            data={trends}
            title="FPS Performance Trends"
            metric="fps"
            unit=" FPS"
            height="h-64"
            enableRealtime={true}
          />
        </div>

        <div className="col-span-3">
          <RecentSessions sessions={summary.recentActivity} />
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <PlatformBreakdown data={summary.platformBreakdown} />

        <PerformanceChart
          data={trends}
          title="Memory Usage Trends"
          metric="memory_usage"
          unit=" MB"
          height="h-48"
          enableRealtime={true}
        />
      </div>

      {/* Enhanced Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PerformanceTiers
          tiers={summary.performanceTiers}
          totalMetrics={summary.totalMetrics}
        />

        <FpsDistribution
          distribution={summary.fpsDistribution}
          totalFpsMetrics={summary.fpsDistribution.reduce(
            (sum, item) => sum + item.count,
            0
          )}
        />

        <MemoryPressure
          pressureLevels={summary.memoryPressure}
          totalMemoryMetrics={summary.memoryPressure.reduce(
            (sum, item) => sum + item.count,
            0
          )}
        />
      </div>

      {/* Regression Detection Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Performance Regression Detection
          </h2>
          <DataFreshness
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            error={error}
            compact={true}
          />
        </div>
        <RegressionDetection performanceData={trends} />
      </div>
    </div>
  )
}
